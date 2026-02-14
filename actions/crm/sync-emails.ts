import { getGmailClientForUser } from "@/lib/gmail";
import { getGraphClient } from "@/lib/microsoft";
import { prismadb } from "@/lib/prisma";
import { ensureContactForLead } from "@/actions/crm/lead-conversions";

/**
 * Syncs Gmail for a specific user
 */
export async function syncGmailForUser(userId: string, days: number = 7) {
    try {
        const gmail = await getGmailClientForUser(userId);
        if (!gmail) return { success: false, error: "Gmail not connected" };

        const profile = await gmail.users.getProfile({ userId: "me" });
        const myEmail = (profile.data.emailAddress || "").toLowerCase();

        const q = `from:me newer_than:${days}d`;
        const messageIds: string[] = [];
        const resp: any = await gmail.users.messages.list({ userId: "me", q, maxResults: 100 });
        const msgs = resp.data.messages || [];
        for (const m of msgs) if (m.id) messageIds.push(m.id);

        const threadIds = new Set<string>();
        for (const mid of messageIds) {
            const meta = await gmail.users.messages.get({ userId: "me", id: mid, format: "metadata", metadataHeaders: ["threadId"] });
            if (meta.data.threadId) threadIds.add(meta.data.threadId);
        }

        const replyDetails = new Map<string, { email: string, snippet: string, date: string, threadId: string }>();
        for (const tid of Array.from(threadIds)) {
            const th: any = await gmail.users.threads.get({ userId: "me", id: tid, format: "metadata", metadataHeaders: ["From", "Date"] });
            const messages = th.data.messages || [];
            for (const m of messages) {
                const headers = (m.payload?.headers || []).reduce((acc: any, h: any) => {
                    acc[h.name.toLowerCase()] = h.value;
                    return acc;
                }, {} as Record<string, string>);
                const from = (headers["from"] || "").toLowerCase();
                const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s@]+@[^\s@]+)/);
                const senderEmail = (emailMatch && emailMatch[1]) ? emailMatch[1] : (emailMatch ? emailMatch[0] : "");

                if (senderEmail && senderEmail !== myEmail) {
                    replyDetails.set(senderEmail, {
                        email: senderEmail,
                        snippet: m.snippet || "",
                        date: headers["date"] || new Date().toISOString(),
                        threadId: tid
                    });
                }
            }
        }

        let updatedCount = 0;
        for (const [senderEmail, detail] of Array.from(replyDetails.entries())) {
            const lead = await prismadb.crm_Leads.findFirst({ where: { email: senderEmail } });
            if (!lead) continue;

            const existingActivity = await prismadb.crm_Lead_Activities.findFirst({
                where: {
                    lead: lead.id,
                    type: "reply_received",
                    createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
                }
            });

            if (existingActivity) {
                const meta = existingActivity.metadata as any;
                if (meta?.threadId === detail.threadId) continue;
            }

            await prismadb.crm_Leads.update({
                where: { id: lead.id },
                data: { pipeline_stage: "Engage_Human" as any } as any,
            });

            await ensureContactForLead(lead.id).catch(() => { });

            await prismadb.crm_Lead_Activities.create({
                data: {
                    lead: lead.id,
                    user: userId,
                    type: "reply_received",
                    metadata: {
                        from_email: senderEmail,
                        snippet: detail.snippet,
                        threadId: detail.threadId,
                        date: detail.date,
                        provider: "gmail"
                    } as any,
                },
            });
            updatedCount++;
        }

        return { success: true, leadsUpdated: updatedCount };
    } catch (error: any) {
        console.error(`Gmail sync error for user ${userId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Syncs Microsoft Outlook for a specific user
 */
export async function syncOutlookForUser(userId: string, days: number = 7) {
    try {
        const client = await getGraphClient(userId);
        if (!client) return { success: false, error: "Outlook not connected" };

        const me = await client.api("/me").select("mail,userPrincipalName").get();
        const myEmail = (me.mail || me.userPrincipalName || "").toLowerCase();

        const date = new Date();
        date.setDate(date.getDate() - days);
        const filterDate = date.toISOString();

        const messages = await client.api("/me/messages")
            .filter(`receivedDateTime ge ${filterDate}`)
            .select("from,subject,bodyPreview,receivedDateTime,conversationId,id")
            .top(50)
            .get();

        const replyDetails = new Map<string, { email: string, snippet: string, date: string, threadId: string, messageId: string }>();

        for (const msg of messages.value || []) {
            const fromEmail = msg.from?.emailAddress?.address?.toLowerCase();
            if (fromEmail && fromEmail !== myEmail) {
                replyDetails.set(fromEmail, {
                    email: fromEmail,
                    snippet: msg.bodyPreview || "",
                    date: msg.receivedDateTime,
                    threadId: msg.conversationId,
                    messageId: msg.id
                });
            }
        }

        let updatedCount = 0;
        for (const [senderEmail, detail] of Array.from(replyDetails.entries())) {
            const lead = await prismadb.crm_Leads.findFirst({ where: { email: senderEmail } });
            if (!lead) continue;

            const existingActivity = await prismadb.crm_Lead_Activities.findFirst({
                where: {
                    lead: lead.id,
                    type: "reply_received",
                    createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
                }
            });

            if (existingActivity) {
                const meta = existingActivity.metadata as any;
                if (meta?.threadId === detail.threadId || meta?.messageId === detail.messageId) continue;
            }

            await prismadb.crm_Leads.update({
                where: { id: lead.id },
                data: { pipeline_stage: "Engage_Human" as any } as any
            });

            await ensureContactForLead(lead.id).catch(() => { });

            await prismadb.crm_Lead_Activities.create({
                data: {
                    lead: lead.id,
                    user: userId,
                    type: "reply_received",
                    metadata: {
                        from_email: senderEmail,
                        snippet: detail.snippet,
                        threadId: detail.threadId,
                        messageId: detail.messageId,
                        date: detail.date,
                        provider: "outlook"
                    } as any
                }
            });
            updatedCount++;
        }
        return { success: true, leadsUpdated: updatedCount };
    } catch (error: any) {
        console.error(`Outlook sync error for user ${userId}:`, error.message);
        return { success: false, error: error.message };
    }
}
