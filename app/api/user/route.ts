import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { logActivityInternal } from "@/actions/audit";
import sendEmail from "@/lib/sendmail";

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

    const hashedPassword = await hash(password, 12);

    const user = await prismadb.users.create({
      data: {
        name,
        username,
        email,
        userLanguage: language,
        password: hashedPassword,
        userStatus: initialStatus === "PENDING" ? "PENDING" : "ACTIVE",
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

    // Send Emails
    const sendFrom = "sales@basalthq.com";

    // 1. Email to Sales Team (sales@basalthq.com)
    try {
      const salesSubject = `New Team Registration: ${companyName}`;
      const salesHtml = `
            <h2>New Team Registration Alert</h2>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Proposed Plan:</strong> ${selectedPlan.name}</p>
            <p><strong>Status:</strong> ${initialStatus}</p>
            <hr />
            <h3>User Details</h3>
            <p><strong>User:</strong> ${name} (${email})</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Language:</strong> ${language}</p>
            <br />
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partners">Review in Partners Dashboard</a></p>
        `;

      await sendEmail({
        to: "sales@basalthq.com",
        from: sendFrom,
        subject: salesSubject,
        text: `New Team Registration: ${companyName}\nUser: ${name} (${email})\nPlan: ${selectedPlan.name}\nStatus: ${initialStatus}`,
        html: salesHtml
      });
      console.log(`[Register] Sent notification email to sales@basalthq.com for team ${companyName}`);
    } catch (emailError) {
      console.error("[Register] Failed to send sales notification email:", emailError);
    }

    // 2. Email to User (Registrant)
    try {
      const userSubject = `Welcome to Basalt - Application Received`;
      const userHtml = `
            <h2>Thank you for signing up!</h2>
            <p>We have successfully received your registration for <strong>${companyName}</strong>.</p>
            <p>Your selected plan: <strong>${selectedPlan.name}</strong></p>
            <br />
            <p>Our team is currently reviewing your application details and will approve your account shortly.</p>
            <p>Once approved, you will be able to access the full platform.</p>
            <br />
            <p>If you have any questions, please feel free to reach out to us at <a href="mailto:sales@basalthq.com">sales@basalthq.com</a>.</p>
            <br />
            <p>Best regards,</p>
            <p>The Basalt Team</p>
        `;

      await sendEmail({
        to: email,
        from: sendFrom,
        subject: userSubject,
        text: `Thank you for signing up for Basalt!\n\nWe have received your registration for ${companyName}.\nOur team is reviewing your application and will approve your account shortly.`,
        html: userHtml
      });
      console.log(`[Register] Sent welcome email to user ${email}`);
    } catch (emailError) {
      console.error("[Register] Failed to send user welcome email:", emailError);
    }

    // Log Activity
    await logActivityInternal(user.id, "User Register", "Auth", `User registered with team ${companyName} on plan ${selectedPlan.name}`);

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
