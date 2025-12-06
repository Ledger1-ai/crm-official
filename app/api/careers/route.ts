import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import { logActivity } from "@/actions/audit";

export async function GET(req: Request) {
    try {
        const jobs = await prismadb.jobPosting.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(jobs);
    } catch (error) {
        console.error("[CAREERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, department, location, type, description, summary, content, requirements, applyLink } = body;

        // Fallback: If description is missing but content exists, use content.
        // Or if content is missing but description exists (old client?), use description.
        // Ideally we save both if provided.
        const finalDescription = description || content;
        const finalContent = content || description;

        const job = await prismadb.jobPosting.create({
            data: {
                title,
                department,
                location,
                type,
                description: finalDescription,
                summary,
                content: finalContent,
                requirements,
                applyLink,
            },
        });

        await logActivity(
            "Created Job",
            "Careers",
            `Posted new job: ${title}`
        );

        revalidatePath('/careers');
        return NextResponse.json(job);
    } catch (error) {
        console.error("[CAREERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, title, department, location, type, description, summary, content, requirements, applyLink, active } = body;

        const finalDescription = description || content;
        const finalContent = content || description;

        const job = await prismadb.jobPosting.update({
            where: { id },
            data: {
                title,
                department,
                location,
                type,
                description: finalDescription,
                summary,
                content: finalContent,
                requirements,
                applyLink,
                active,
            },
        });

        await logActivity(
            "Updated Job",
            "Careers",
            `Updated job: ${title}`
        );

        revalidatePath('/careers');
        return NextResponse.json(job);
    } catch (error) {
        console.error("[CAREERS_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new NextResponse("ID required", { status: 400 });

        const job = await prismadb.jobPosting.findUnique({ where: { id } });

        await prismadb.jobPosting.delete({
            where: { id },
        });

        await logActivity(
            "Deleted Job",
            "Careers",
            `Deleted job: ${job?.title || id}`
        );

        revalidatePath('/careers');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CAREERS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
