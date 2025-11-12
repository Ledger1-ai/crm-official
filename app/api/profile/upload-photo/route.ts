import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { processProfileImage, validateImageFile } from "@/lib/image-processing";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type and size
    try {
      validateImageFile(file.type, file.size);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image: resize to 500x500 and convert to base64
    const base64Image = await processProfileImage(buffer);

    // Update user's avatar in database
    await prismadb.users.update({
      where: {
        id: session.user.id,
      },
      data: {
        avatar: base64Image,
      },
    });

    return NextResponse.json(
      {
        success: true,
        avatar: base64Image,
        message: "Profile photo updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    return NextResponse.json(
      { error: "Failed to upload profile photo" },
      { status: 500 }
    );
  }
}
