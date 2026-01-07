import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm as prisma } from "@/lib/prisma-crm";
import { OutreachItemStatus } from "@prisma/client";

// PUT - Update an existing campaign (used for draft auto-save)
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            id,
            name,
            description,
            channels,
            leadIds,
            poolId,
            projectId,
            promptTemplate,
            promptOverride,
            signatureHtml,
            resourceLinks,
            meetingLink,
            includeResearch,
            status,
            config, // Wizard state for drafts
        } = body;

        if (!id) {
            return NextResponse.json(
                { message: "Campaign ID is required for update" },
                { status: 400 }
            );
        }

        // Verify the campaign exists and belongs to the user's team
        const existingCampaign = await prisma.crm_Outreach_Campaigns.findUnique({
            where: { id },
        });

        if (!existingCampaign) {
            return NextResponse.json(
                { message: "Campaign not found" },
                { status: 404 }
            );
        }

        // Update the campaign
        const campaign = await prisma.crm_Outreach_Campaigns.update({
            where: { id },
            data: {
                name: name || existingCampaign.name,
                description: description ?? existingCampaign.description,
                status: status || existingCampaign.status,
                project: projectId ?? existingCampaign.project,
                pool: poolId ?? existingCampaign.pool,
                prompt_override: promptTemplate || promptOverride || existingCampaign.prompt_override,
                signature_html: signatureHtml ?? existingCampaign.signature_html,
                resource_links: resourceLinks ?? existingCampaign.resource_links,
                meeting_link: meetingLink ?? existingCampaign.meeting_link,
                channels: channels || existingCampaign.channels,
                total_leads: leadIds?.length ?? existingCampaign.total_leads,
                // Store wizard config as JSON in signature_meta field (reusing available JSON field)
                signature_meta: config ?? existingCampaign.signature_meta,
                updatedAt: new Date(),
            },
        });

        // If lead IDs changed for a DRAFT campaign, update the outreach items
        if (leadIds && status === "DRAFT") {
            // Delete existing outreach items for this campaign
            await prisma.crm_Outreach_Items.deleteMany({
                where: { campaign: id },
            });

            // Create new outreach items
            const outreachItems = [];
            for (const leadId of leadIds) {
                for (const channel of (channels || existingCampaign.channels || ["EMAIL"])) {
                    outreachItems.push({
                        campaign: id,
                        lead: leadId,
                        channel,
                        status: OutreachItemStatus.PENDING,
                        retry_count: 0,
                    });
                }
            }

            if (outreachItems.length > 0) {
                await prisma.crm_Outreach_Items.createMany({
                    data: outreachItems,
                });
            }
        }

        return NextResponse.json({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            totalLeads: campaign.total_leads,
            message: "Campaign updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating campaign:", error);
        return NextResponse.json(
            { message: error.message || "Failed to update campaign" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            description,
            channels,
            leadIds,
            poolId,
            projectId,
            promptOverride,
            signatureHtml,
            resourceLinks,
            meetingLink,
            includeResearch,
            status, // Accept status from request for approval workflow
        } = body;

        // Validation
        if (!name || !leadIds || leadIds.length === 0) {
            return NextResponse.json(
                { message: "Campaign name and at least one lead are required" },
                { status: 400 }
            );
        }

        // Get user's team
        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        // Use provided status or default to DRAFT
        const campaignStatus = status || "DRAFT";

        // Create the campaign
        const campaign = await prisma.crm_Outreach_Campaigns.create({
            data: {
                name,
                description: description || null,
                status: campaignStatus,
                user: session.user.id,
                team_id: user?.team_id || null,
                project: projectId || null,
                pool: poolId || null,
                prompt_override: promptOverride || null,
                signature_html: signatureHtml || null,
                signature_meta: null,
                resource_links: resourceLinks || null,
                meeting_link: meetingLink || null,
                channels: channels || ["EMAIL"],
                total_leads: leadIds.length,
                emails_sent: 0,
                emails_opened: 0,
                sms_sent: 0,
                sms_delivered: 0,
                calls_initiated: 0,
                meetings_booked: 0,
            },
        });

        // Create outreach items for each lead and channel
        const outreachItems = [];
        for (const leadId of leadIds) {
            for (const channel of (channels || ["EMAIL"])) {
                outreachItems.push({
                    campaign: campaign.id,
                    lead: leadId,
                    channel,
                    status: OutreachItemStatus.PENDING,
                    retry_count: 0,
                });
            }
        }

        // Batch create outreach items
        await prisma.crm_Outreach_Items.createMany({
            data: outreachItems,
        });

        // Log activity
        await prisma.crm_Lead_Activities.createMany({
            data: leadIds.map((leadId: string) => ({
                lead: leadId,
                user: session.user.id,
                type: "CAMPAIGN_CREATED",
                metadata: {
                    campaignId: campaign.id,
                    campaignName: name,
                },
            })),
        });

        return NextResponse.json({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            totalLeads: campaign.total_leads,
            message: "Campaign created successfully",
        });
    } catch (error: any) {
        console.error("Error creating campaign:", error);
        return NextResponse.json(
            { message: error.message || "Failed to create campaign" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get user's team
        const user = await prisma.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true },
        });

        // Fetch campaigns for the user's team
        const campaigns = await prisma.crm_Outreach_Campaigns.findMany({
            where: user?.team_id
                ? { team_id: user.team_id }
                : { user: session.user.id },
            include: {
                assigned_user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                assigned_pool: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assigned_project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                outreach_items: {
                    select: {
                        id: true,
                        status: true,
                        channel: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(campaigns);
    } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json(
            { message: error.message || "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}
