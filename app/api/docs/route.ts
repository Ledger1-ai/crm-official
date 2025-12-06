import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import { logActivity } from "@/actions/audit";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, slug, category, order, content, videoUrl, resources } = body;

        const doc = await prismadb.docArticle.create({
            data: {
                title,
                slug,
                category,
                order,
                content,
                videoUrl,

                resources,
            } as any,
        });

        await logActivity("Created Documentation", "Documentation", `Created article: ${title}`);

        revalidatePath('/docs');
        return NextResponse.json(doc);
    } catch (error) {
        console.log("[DOCS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
