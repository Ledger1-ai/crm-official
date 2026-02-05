import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        if (!slug) {
            return new NextResponse("Slug is required", { status: 400 });
        }

        const form = await prismadb.form.findUnique({
            where: { slug },
            include: {
                fields: {
                    where: { is_visible: true },
                    orderBy: { position: 'asc' }
                }
            }
        });

        if (!form) {
            return new NextResponse("Form not found", { status: 404 });
        }

        // Return only necessary public fields
        const publicForm = {
            id: form.id,
            name: form.name,
            description: form.description,
            status: form.status,
            fields: form.fields,
            primary_color: form.primary_color,
            custom_css: form.custom_css, // Includes theme settings
            require_captcha: form.require_captcha,
            captcha_site_key: form.captcha_site_key,
            submission_behavior: form.submission_behavior,
            redirect_url: form.redirect_url,
            success_message: form.success_message,
        };

        return NextResponse.json(publicForm);

    } catch (error) {
        console.error("[PUBLIC_FORM_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
