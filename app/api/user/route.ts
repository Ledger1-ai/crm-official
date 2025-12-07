import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { newUserNotify } from "@/lib/new-user-notify";
import { logActivityInternal } from "@/actions/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, language, password, confirmPassword, companyName, planId } = body;

    // Validate required fields
    if (!name || !email || !language || !password || !confirmPassword || !companyName || !planId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Password does not match", { status: 400 });
    }

    // Check if user already exists
    const checkexisting = await prismadb.users.findFirst({
      where: {
        email: email,
      },
    });

    if (checkexisting) {
      return new NextResponse("User already exist", { status: 409 });
    }

    // Check if team slug exists (simple slugify)
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const checkSlug = await prismadb.team.findUnique({
      where: { slug }
    });

    if (checkSlug) {
      return new NextResponse("Company name already taken (slug collision). Please choose another.", { status: 409 });
    }

    // Fetch the selected plan
    const selectedPlan = await prismadb.plan.findUnique({
      where: { id: planId }
    });

    if (!selectedPlan) {
      return new NextResponse("Invalid Plan selected", { status: 400 });
    }

    // Determine Status
    // If Plan is Free (price 0) -> ACTIVE
    // If Plan is Paid -> PENDING
    const isFree = selectedPlan.price === 0;
    const initialStatus = isFree ? "ACTIVE" : "PENDING";

    // Create User first (we need ID for team owner)
    // Note: We are creating the user initially. If Team creation fails, we might leave a dangling user. 
    // Ideally use a transaction, but Mongo doesn't support multi-document transactions in standalone.
    // Assuming standard Replica Set or similar, transaction would be best.

    // For now, simple flow:

    const hashedPassword = await hash(password, 12);

    const user = await prismadb.users.create({
      data: {
        name,
        username,
        email,
        userLanguage: language,
        password: hashedPassword,
        userStatus: initialStatus === "PENDING" ? "PENDING" : "ACTIVE", // Or PENDING for everyone? User said "pending status until admin can approve" for non-free.
        is_admin: false, // Default to false
        is_account_admin: true, // They are the owner of their account/team
      },
    });

    // Create Team
    const team = await prismadb.team.create({
      data: {
        name: companyName,
        slug: slug,
        owner_id: user.id,
        plan_id: selectedPlan.id,
        status: initialStatus === "PENDING" ? "PENDING" : "ACTIVE",
        members: {
          connect: { id: user.id }
        }
      }
    });

    // Update User with Team ID (and role)
    await prismadb.users.update({
      where: { id: user.id },
      data: {
        team_id: team.id,
        team_role: "OWNER"
      }
    });

    // Notify Admins
    if (!isFree) {
      newUserNotify(user); // Reuse existing notification
    }

    await logActivityInternal(user.id, "User Register", "Auth", `User registered with team ${team.name} on plan ${selectedPlan.name}`);

    return NextResponse.json({ ...user, teamId: team.id });

  } catch (error) {
    console.log("[USERS_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  if (!session || !session.user) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  // Return just the current authenticated user context (lightweight for popup)
  return NextResponse.json({ user: session.user });
}
