import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

// GET - Get single form
export async function GET(
    req: NextRequest,
    { params }: { params: { formId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = (session.user as any).team_id;
        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const form = await (prismadb as any).form.findFirst({
            where: {
                id: params.formId,
                team_id: teamId,
            },
            include: {
                fields: {
                    orderBy: { position: "asc" },
                },
                _count: {
                    select: { submissions: true },
                },
            },
        });

        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        return NextResponse.json(form);
    } catch (error) {
        console.error("Error fetching form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update form
export async function PATCH(
    req: NextRequest,
    { params }: { params: { formId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        let teamId = (session.user as any).team_id;

        // If no team_id on session, try to get from database
        if (!teamId) {
            const user = await prismadb.users.findUnique({
                where: { id: userId },
                select: { team_id: true },
            });
            teamId = user?.team_id;
        }

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        // Check form exists and belongs to team
        const existingForm = await (prismadb as any).form.findFirst({
            where: {
                id: params.formId,
                team_id: teamId,
            },
        });

        if (!existingForm) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        const body = await req.json();
        const {
            name,
            description,
            status,
            visibility,
            primary_color,
            custom_css,
            success_message,
            redirect_url,
            require_captcha,
            notify_emails,
            webhook_url,
            auto_respond,
            auto_respond_subject,
            auto_respond_body,
        } = body;

        // Build update data - only include fields that are provided
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (visibility !== undefined) updateData.visibility = visibility;
        if (primary_color !== undefined) updateData.primary_color = primary_color;
        if (custom_css !== undefined) updateData.custom_css = custom_css;
        if (success_message !== undefined) updateData.success_message = success_message;
        if (redirect_url !== undefined) updateData.redirect_url = redirect_url;
        if (require_captcha !== undefined) updateData.require_captcha = require_captcha;
        if (notify_emails !== undefined) updateData.notify_emails = notify_emails;
        if (webhook_url !== undefined) updateData.webhook_url = webhook_url;
        if (auto_respond !== undefined) updateData.auto_respond = auto_respond;
        if (auto_respond_subject !== undefined) updateData.auto_respond_subject = auto_respond_subject;
        if (auto_respond_body !== undefined) updateData.auto_respond_body = auto_respond_body;

        const form = await (prismadb as any).form.update({
            where: { id: params.formId },
            data: updateData,
            include: {
                fields: {
                    orderBy: { position: "asc" },
                },
            },
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error("Error updating form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete form
export async function DELETE(
    req: NextRequest,
    { params }: { params: { formId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = (session.user as any).team_id;
        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        // Check form exists and belongs to team
        const existingForm = await (prismadb as any).form.findFirst({
            where: {
                id: params.formId,
                team_id: teamId,
            },
        });

        if (!existingForm) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        // Delete form (fields and submissions will cascade due to schema)
        await (prismadb as any).form.delete({
            where: { id: params.formId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting form:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
