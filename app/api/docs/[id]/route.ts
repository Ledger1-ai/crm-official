import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import { logActivity } from "@/actions/audit";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!params.id) return new NextResponse("Doc ID is required", { status: 400 });

        const doc = await prismadb.docArticle.findUnique({
            where: { id: params.id },
        });

        return NextResponse.json(doc);
    } catch (error) {
        console.log("[DOC_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { title, slug, category, order, content, videoUrl, resources } = body;

        const doc = await prismadb.docArticle.update({
            where: { id: params.id },
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

        await logActivity("Updated Documentation", "Documentation", `Updated article: ${doc.title}`);

        revalidatePath('/docs');
        return NextResponse.json(doc);
    } catch (error) {
        console.log("[DOC_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const doc = await prismadb.docArticle.delete({
            where: { id: params.id },
        });

        revalidatePath('/docs');
        return NextResponse.json(doc);
    } catch (error) {
        console.log("[DOC_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
