// ... (imports remain)
import { prismadb } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { newUserNotify } from "./new-user-notify";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { logActivityInternal } from "@/actions/audit";

function getGoogleCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SECRET;
  if (!clientId || clientId.length === 0) {
    // console.warn("Missing GOOGLE_ID");
    return { clientId: "", clientSecret: "" };
  }
  if (!clientSecret || clientSecret.length === 0) {
    // console.warn("Missing GOOGLE_SECRET");
    return { clientId: "", clientSecret: "" };
  }
  return { clientId, clientSecret };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.JWT_SECRET,
  //adapter: PrismaAdapter(prismadb),
  session: {
    strategy: "jwt",
  },

  providers: [
    // Static providers (Env driven) as fallback
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),

    GitHubProvider({
      name: "github",
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),


    AzureADProvider({
      clientId: process.env.AZURE_CLIENT_ID || "",
      clientSecret: process.env.AZURE_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_TENANT_ID || "common",
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },

      async authorize(credentials) {
        // console.log(credentials, "credentials");
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email or password is missing");
        }

        // Normalize email to avoid case sensitivity issues in lookups
        const normalizedEmail =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : credentials.email;

        const user = await prismadb.users.findFirst({
          where: {
            email: normalizedEmail,
          },
        });

        //clear white space from password
        const trimmedPassword = credentials.password.trim();

        if (!user) {
          throw new Error("User not found. Please register first.");
        }

        // Check if user is active
        if (user.userStatus !== "ACTIVE") {
          throw new Error("Your account is pending approval. Please contact support.");
        }

        if (!user?.password) {
          throw new Error(
            "Account exists but no password is set. Sign in with Google/GitHub or use 'Forgot password' to set one."
          );
        }

        const isCorrectPassword = await bcrypt.compare(
          trimmedPassword,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Password is incorrect");
        }

        //console.log(user, "user");
        return user;
      },
    }),
  ],
  events: {
    // Update lastLoginAt only on sign-in to avoid concurrent session-triggered writes
    async signIn({ user }: any) {
      if (!user?.id) return;
      try {
        await prismadb.users.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log the login activity
        await logActivityInternal(user.id, "User Login", "Auth", "User logged in successfully");
      } catch (_err) {
        // swallow to avoid deadlocks during concurrent sign-ins
        console.error("Error in signIn event:", _err);
      }
    },
  },
  callbacks: {
    //TODO: fix this any
    async session({ token, session }: any) {
      // Guard against missing token data to avoid runtime errors and JWT session failures
      if (!token?.email) {
        return session;
      }

      // Normalize email for stable lookups and consistent storage
      const tokenEmail =
        typeof token?.email === "string" ? token.email.toLowerCase() : token?.email;

      const user = await prismadb.users.findFirst({
        where: {
          email: tokenEmail,
        },
      });

      if (!user) {
        try {
          const newUser = await prismadb.users.create({
            data: {
              email: tokenEmail,
              name: token.name,
              avatar: token.picture,
              is_admin: false,
              is_account_admin: false,
              lastLoginAt: new Date(),
              userStatus:
                process.env.ALLOW_OPEN_REGISTRATION === "true"
                  ? "ACTIVE"
                  : "PENDING",
            },
          });

          // Try to prevent redundant notifications
          // await newUserNotify(newUser);

          //Put new created user data in session
          session.user.id = newUser.id;
          session.user.name = newUser.name;
          session.user.email = newUser.email;
          session.user.avatar = newUser.avatar;
          session.user.image = newUser.avatar;
          session.user.isAdmin = false;
          session.user.userLanguage = newUser.userLanguage;
          session.user.userStatus = newUser.userStatus;
          session.user.lastLoginAt = newUser.lastLoginAt;
          return session;
        } catch (error) {
          console.error("[auth.session] users.create error:", error);
          return session;
        }
      } else {
        // User already exists in localDB, put user data in session (avoid DB writes here)
        //User allready exist in localDB, put user data in session
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.avatar = user.avatar;
        session.user.image = user.avatar;
        session.user.isAdmin = user.is_admin;
        session.user.userLanguage = user.userLanguage;
        session.user.userStatus = user.userStatus;
        session.user.lastLoginAt = user.lastLoginAt;

        // Fetch role and permissions if available
        if (user.roleId) {
          const role = await prismadb.role.findUnique({ where: { id: user.roleId } });
          if (role) {
            session.user.role = role.name;
            session.user.permissions = role.permissions;
          }
        }
      }

      //console.log(session, "session");
      return session;
    },
  },
};


// Cache for dynamic options to avoid hitting DB on every request (1 min cache)
let cachedOptions: NextAuthOptions | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000;

export async function getDynamicAuthOptions(): Promise<NextAuthOptions> {
  const now = Date.now();
  if (cachedOptions && (now - lastCacheTime < CACHE_TTL)) {
    return cachedOptions;
  }

  // Start with base options (env vars)
  // We clone providers to avoid mutating the exported static object indefinitely if we push/pop
  const newOptions = { ...authOptions, providers: [...authOptions.providers] };

  try {
    const dbConfigs = await prismadb.systemAuthConfig.findMany({
      where: { enabled: true }
    });

    // Add/Override providers from DB
    for (const config of dbConfigs) {
      if (config.provider === 'google') {
        // Find existing index or append
        const existingIndex = newOptions.providers.findIndex(p => p.id === 'google');
        const provider = GoogleProvider({
          clientId: config.clientId,
          clientSecret: config.clientSecret
        });
        if (existingIndex >= 0) {
          newOptions.providers[existingIndex] = provider;
        } else {
          newOptions.providers.push(provider);
        }
      } else if (config.provider === 'github') {
        const existingIndex = newOptions.providers.findIndex(p => p.id === 'github');
        const provider = GitHubProvider({
          name: "github",
          clientId: config.clientId,
          clientSecret: config.clientSecret
        });
        if (existingIndex >= 0) {
          newOptions.providers[existingIndex] = provider;
        } else {
          newOptions.providers.push(provider);
        }
      } else if (config.provider === 'azure-ad') {
        const existingIndex = newOptions.providers.findIndex(p => p.id === 'azure-ad');
        const provider = AzureADProvider({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          tenantId: config.tenantId || "common",
        });
        if (existingIndex >= 0) {
          newOptions.providers[existingIndex] = provider;
        } else {
          newOptions.providers.push(provider);
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch dynamic auth config:", error);
    // Fallback to static env vars (newOptions already has them)
  }

  cachedOptions = newOptions;
  lastCacheTime = now;
  return newOptions;
}
