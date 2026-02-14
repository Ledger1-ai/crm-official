import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailClientForUser } from "@/lib/gmail";
import { getGraphClient } from "@/lib/microsoft";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = session.user.id;
    const threadId = searchParams.get("threadId");
    const messageId = searchParams.get("messageId");
    const provider = searchParams.get("provider"); // "gmail" | "outlook"

    if (!threadId && !messageId) return new NextResponse("Missing threadId or messageId", { status: 400 });

    try {
        if (provider === "gmail") {
            const gmail = await getGmailClientForUser(userId);
            if (!gmail) return new NextResponse("Gmail not connected", { status: 400 });

            const processMessage = (msg: any) => {
                const attachments: any[] = [];
                const findAttachments = (parts: any[]) => {
                    for (const part of parts) {
                        if (part.filename && part.body?.attachmentId) {
                            attachments.push({
                                id: part.body.attachmentId,
                                filename: part.filename,
                                mimeType: part.mimeType,
                                size: part.body.size,
                                messageId: msg.id
                            });
                        }
                        if (part.parts) findAttachments(part.parts);
                    }
                };
                if (msg.payload?.parts) findAttachments(msg.payload.parts);
                return { ...msg, attachments };
            };

            if (threadId) {
                const thread = await gmail.users.threads.get({ userId: "me", id: threadId, format: "full" });
                const messages = (thread.data.messages || []).map(processMessage);
                return NextResponse.json({ messages });
            } else {
                const msg = await gmail.users.messages.get({ userId: "me", id: messageId!, format: "full" });
                return NextResponse.json({ message: processMessage(msg.data) });
            }
        }

        if (provider === "outlook") {
            const client = await getGraphClient(userId);
            if (!client) return new NextResponse("Microsoft not connected", { status: 400 });

            if (threadId) {
                // Outlook conversation/thread
                const messages = await client.api(`/me/messages`)
                    .filter(`conversationId eq '${threadId}'`)
                    .expand("attachments")
                    .select("from,subject,body,receivedDateTime,id,attachments")
                    .get();

                const processed = messages.value.map((m: any) => ({
                    ...m,
                    attachments: (m.attachments || []).map((a: any) => ({
                        id: a.id,
                        filename: a.name,
                        mimeType: a.contentType,
                        size: a.size,
                        isInline: a.isInline,
                        messageId: m.id
                    }))
                }));

                return NextResponse.json({ messages: processed });
            } else {
                const msg = await client.api(`/me/messages/${messageId}`)
                    .expand("attachments")
                    .get();

                const processed = {
                    ...msg,
                    attachments: (msg.attachments || []).map((a: any) => ({
                        id: a.id,
                        filename: a.name,
                        mimeType: a.contentType,
                        size: a.size,
                        isInline: a.isInline,
                        messageId: msg.id
                    }))
                };

                return NextResponse.json({ message: processed });
            }
        }

        return new NextResponse("Invalid provider", { status: 400 });
    } catch (error: any) {
        console.error("[FETCH_EMAIL_FULL]", error);
        return new NextResponse(error.message || "Failed to fetch email", { status: 500 });
    }
}
