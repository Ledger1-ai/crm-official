/**
 * Portal Recipient Management API
 * Add, list, and manage portal recipients (from leads)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// GET - List recipients for a portal
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const portalId = searchParams.get("portalId");

        if (!portalId) {
            return NextResponse.json({ error: "portalId is required" }, { status: 400 });
        }

        const recipients = await (prismadb as any).crm_Portal_Recipient.findMany({
            where: { portal: portalId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ recipients });
    } catch (err: any) {
        console.error("[Portal Recipient API] GET Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Add recipients from leads
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { portalId, leadIds, recipients: manualRecipients } = body;

        if (!portalId) {
            return NextResponse.json({ error: "portalId is required" }, { status: 400 });
        }

        const results: { id: string; email: string; created: boolean; error?: string }[] = [];

        // Add recipients from lead IDs
        if (leadIds?.length) {
            const leads = await prismadb.crm_Leads.findMany({
                where: { id: { in: leadIds } },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                },
            });

            for (const lead of leads) {
                if (!lead.email) {
                    results.push({ id: lead.id, email: "", created: false, error: "No email" });
                    continue;
                }

                try {
                    const accessToken = crypto.randomBytes(16).toString("hex");

                    const recipient = await (prismadb as any).crm_Portal_Recipient.upsert({
                        where: {
                            portal_email: {
                                portal: portalId,
                                email: lead.email,
                            },
                        },
                        create: {
                            portal: portalId,
                            lead: lead.id,
                            email: lead.email,
                            phone: lead.phone,
                            access_token: accessToken,
                            first_name: lead.firstName,
                            last_name: lead.lastName,
                            company: lead.company,
                        },
                        update: {
                            phone: lead.phone,
                            first_name: lead.firstName,
                            last_name: lead.lastName,
                            company: lead.company,
                        },
                    });

                    results.push({ id: recipient.id, email: lead.email, created: true });
                } catch (err: any) {
                    results.push({ id: lead.id, email: lead.email, created: false, error: err.message });
                }
            }
        }

        // Add manual recipients
        if (manualRecipients?.length) {
            for (const r of manualRecipients) {
                if (!r.email) continue;

                try {
                    const accessToken = crypto.randomBytes(16).toString("hex");

                    const recipient = await (prismadb as any).crm_Portal_Recipient.upsert({
                        where: {
                            portal_email: {
                                portal: portalId,
                                email: r.email,
                            },
                        },
                        create: {
                            portal: portalId,
                            email: r.email,
                            phone: r.phone || null,
                            access_token: accessToken,
                            first_name: r.firstName || null,
                            last_name: r.lastName || null,
                            company: r.company || null,
                        },
                        update: {
                            phone: r.phone || undefined,
                            first_name: r.firstName || undefined,
                            last_name: r.lastName || undefined,
                            company: r.company || undefined,
                        },
                    });

                    results.push({ id: recipient.id, email: r.email, created: true });
                } catch (err: any) {
                    results.push({ id: "", email: r.email, created: false, error: err.message });
                }
            }
        }

        const created = results.filter(r => r.created).length;
        const failed = results.filter(r => !r.created).length;

        return NextResponse.json({
            success: true,
            created,
            failed,
            results,
        });
    } catch (err: any) {
        console.error("[Portal Recipient API] POST Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE - Remove a recipient (opt-out)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const recipientId = searchParams.get("recipientId");

        if (!recipientId) {
            return NextResponse.json({ error: "recipientId is required" }, { status: 400 });
        }

        // Soft delete - mark as opted out
        await (prismadb as any).crm_Portal_Recipient.update({
            where: { id: recipientId },
            data: {
                is_opted_out: true,
                opted_out_at: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[Portal Recipient API] DELETE Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
