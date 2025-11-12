import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

/**
 * POST /api/user/set-password
 * Allows a logged-in user (OAuth or credentials) to set/update their local password.
 *
 * Request body:
 *   {
 *     "newPassword": string,
 *     "currentPassword": string | null // optional; required only if user already has a password
 *   }
 *
 * Behavior:
 * - If the user has no password (e.g., OAuth account), currentPassword is NOT required.
 * - If the user has an existing password (credentials account), currentPassword must match.
 * - newPassword must meet basic complexity (min 8 chars).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: { newPassword?: string; currentPassword?: string | null };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const newPassword = body?.newPassword?.trim();
  const currentPassword = body?.currentPassword?.trim() || null;

  if (!newPassword || newPassword.length < 8) {
    return new NextResponse("New password must be at least 8 characters.", { status: 400 });
  }

  try {
    const user = await prismadb.users.findFirst({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse("User not found.", { status: 404 });
    }

    // If user already has a password, require currentPassword validation
    if (user.password) {
      if (!currentPassword) {
        return new NextResponse("Current password is required.", { status: 400 });
      }
      const ok = await compare(currentPassword, user.password);
      if (!ok) {
        return new NextResponse("Current password is incorrect.", { status: 400 });
      }
    }

    // Hash and set new password
    const hashed = await hash(newPassword, 12);
    await prismadb.users.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ status: true, message: "Password updated." }, { status: 200 });
  } catch (error) {
    console.error("[USER_SET_PASSWORD_POST]", error);
    return new NextResponse("Failed to update password.", { status: 500 });
  }
}
