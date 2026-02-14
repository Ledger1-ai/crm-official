import { Client } from "@microsoft/microsoft-graph-client";
// import "isomorphic-fetch";
import { prismadb } from "@/lib/prisma";

// Microsoft OAuth Constants
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const TENANT_ID = process.env.AZURE_TENANT_ID || "common";
const REDIRECT_URI = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/microsoft/callback`;

// Scopes for Calendar and Offline Access
const SCOPES = [
    "User.Read",
    "Calendars.ReadWrite",
    "Mail.Read",
    "offline_access" // Crucial for refresh tokens
].join(" ");

export function getMicrosoftAuthUrl(userId: string) {
    if (!CLIENT_ID) throw new Error("Missing AZURE_CLIENT_ID");

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        response_mode: "query",
        scope: SCOPES,
        state: userId, // Pass userId as state to link on callback
    });

    return `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(userId: string, code: string) {
    if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Missing Azure Credentials");

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        scope: SCOPES,
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        client_secret: CLIENT_SECRET,
    });

    const response = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error_description || "Failed to exchange code");
    }

    // Save tokens
    await prismadb.microsoft_Tokens.upsert({
        where: { id: (await prismadb.microsoft_Tokens.findFirst({ where: { user: userId } }))?.id || "new" },
        update: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            scope: data.scope,
            expiry_date: new Date(Date.now() + data.expires_in * 1000),
            updatedAt: new Date(),
        } as any, // Prisma generic type workaround
        create: {
            user: userId,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            scope: data.scope,
            expiry_date: new Date(Date.now() + data.expires_in * 1000),
        } as any,
    });

    return data;
}

/**
 * Get an authenticated Microsoft Graph Client for a user
 */
export async function getGraphClient(userId: string) {
    const token = await prismadb.microsoft_Tokens.findFirst({
        where: { user: userId },
    });

    if (!token) return null;

    // Check expiry
    let accessToken = token.access_token;
    if (token.expiry_date && new Date() > token.expiry_date && token.refresh_token) {
        // Refresh
        try {
            const params = new URLSearchParams({
                client_id: CLIENT_ID!,
                scope: SCOPES,
                refresh_token: token.refresh_token,
                redirect_uri: REDIRECT_URI,
                grant_type: "refresh_token",
                client_secret: CLIENT_SECRET!,
            });

            const response = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });

            const data = await response.json();
            if (response.ok) {
                accessToken = data.access_token;
                // Update DB
                await prismadb.microsoft_Tokens.update({
                    where: { id: token.id },
                    data: {
                        access_token: data.access_token,
                        refresh_token: data.refresh_token || token.refresh_token, // RTs assume to carry over often
                        expiry_date: new Date(Date.now() + data.expires_in * 1000),
                        updatedAt: new Date(),
                    },
                });
            }
        } catch (e) {
            console.error("Failed to refresh Microsoft token", e);
            return null;
        }
    }

    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });

    return client;
}
