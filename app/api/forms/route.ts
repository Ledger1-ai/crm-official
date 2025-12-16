import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import crypto from "crypto";

// GET - List forms for team
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teamId = (session.user as any).team_id;
        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("project_id");

        const where: any = { team_id: teamId };
        if (projectId) {
            where.project_id = projectId;
        }

        const forms = await (prismadb as any).form.findMany({
            where,
            include: {
                fields: {
                    orderBy: { position: "asc" },
                },
                _count: {
                    select: { submissions: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(forms);
    } catch (error) {
        console.error("Error fetching forms:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new form
export async function POST(req: NextRequest) {
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
            return NextResponse.json({ error: "No team associated. Please contact support." }, { status: 400 });
        }

        const body = await req.json();
        const { name, description, project_id, visibility, fields } = body;

        if (!name) {
            return NextResponse.json({ error: "Form name required" }, { status: 400 });
        }

        // Generate unique slug
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const slug = `${baseSlug}-${crypto.randomBytes(4).toString("hex")}`;

        // Build the data object carefully to avoid invalid fields
        const formData: any = {
            name,
            slug,
            team_id: teamId,
            created_by: userId,
            status: "ACTIVE",
            visibility: visibility || "PUBLIC",
        };

        // Only add optional fields if they have values
        if (description) formData.description = description;
        if (project_id && project_id !== "__none__") formData.project_id = project_id;

        const form = await (prismadb as any).form.create({
            data: {
                ...formData,
                fields: fields && fields.length > 0 ? {
                    create: fields.map((field: any, index: number) => {
                        const fieldData: any = {
                            name: field.name || `field_${index}`,
                            label: field.label || "Field",
                            field_type: field.field_type || "TEXT",
                            is_required: field.is_required || false,
                            position: field.position ?? index,
                            is_visible: field.is_visible !== false,
                        };

                        // Only add optional fields if they have values
                        if (field.placeholder) fieldData.placeholder = field.placeholder;
                        if (field.help_text) fieldData.help_text = field.help_text;
                        if (field.options && Array.isArray(field.options)) fieldData.options = field.options;
                        if (field.min_length) fieldData.min_length = field.min_length;
                        if (field.max_length) fieldData.max_length = field.max_length;
                        if (field.pattern) fieldData.pattern = field.pattern;
                        if (field.lead_field_mapping && field.lead_field_mapping !== "__none__") {
                            fieldData.lead_field_mapping = field.lead_field_mapping;
                        }

                        return fieldData;
                    }),
                } : undefined,
            },
            include: {
                fields: {
                    orderBy: { position: "asc" },
                },
            },
        });

        return NextResponse.json(form);
    } catch (error: any) {
        console.error("Error creating form:", error);
        // Return more specific error message for debugging
        const errorMessage = error?.message || "Internal server error";
        const errorDetails = {
            code: error?.code,
            meta: error?.meta,
            name: error?.name
        };
        return NextResponse.json({
            error: errorMessage,
            details: errorDetails,
            hint: "Make sure the database schema has been migrated (npx prisma db push)"
        }, { status: 500 });
    }
}
