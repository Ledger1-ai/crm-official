import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  const body = await req.json();
  const { sectionId } = params;
  const { newTitle } = body;

  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      await prismadb.sections.update({
        where: {
          id: sectionId,
        },
        data: {
          title: newTitle,
        },
      });

      return NextResponse.json(
        { message: "Section Title change successfully" },
        { status: 200 }
      );
    } catch (error: any) {
      if (error.code === 'P2034' && retryCount < MAX_RETRIES - 1) {
        retryCount++;
        console.log(`[NEW_SECTION_TITLE_POST] Write conflict/deadlock, retrying (${retryCount}/${MAX_RETRIES})...`);
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        continue;
      }
      console.log("[NEW_SECTION_TITLE_POST]", error);
      return new NextResponse("Initial error", { status: 500 });
    }
  }

  return new NextResponse("Max retries exceeded", { status: 500 });
}
