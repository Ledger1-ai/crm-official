import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

// API to add messages module to existing databases
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if messages module already exists
        const existingModule = await prismadb.system_Modules_Enabled.findFirst({
            where: { name: "messages" },
        });

        if (existingModule) {
            return NextResponse.json({
                success: true,
                message: "Messages module already exists",
                module: existingModule
            });
        }

        // Get the current max position
        const maxPositionResult = await prismadb.system_Modules_Enabled.findFirst({
            orderBy: { position: "desc" },
            select: { position: true },
        });

        const newPosition = (maxPositionResult?.position || 0) + 1;

        // Create the messages module
        const messagesModule = await prismadb.system_Modules_Enabled.create({
            data: {
                v: 0,
                name: "messages",
                enabled: true,
                position: newPosition,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Messages module added successfully",
            module: messagesModule
        });
    } catch (error) {
        console.error("Error adding messages module:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET to check if messages module exists
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const messagesModule = await prismadb.system_Modules_Enabled.findFirst({
            where: { name: "messages" },
        });

        return NextResponse.json({
            exists: !!messagesModule,
            module: messagesModule
        });
    } catch (error) {
        console.error("Error checking messages module:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
