import { authOptions } from "@/lib/auth";
import resendHelper from "@/lib/resend";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request) {
  /*
  Resend.com function init - this is a helper function that will be used to send emails
  */
  const resend = await resendHelper();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  const body = await req.json();
  if (!body) {
    return new NextResponse("Missing body", { status: 400 });
  }
  const { feedback } = body;

  if (!feedback) {
    return new NextResponse("Missing feedback", { status: 400 });
  }

  try {
    const userId = session.user.id;
    const teamId = (session.user as any).team_id;

    // 1. Find PLATFORM_ADMIN users to notify internally
    const admins = await prismadb.users.findMany({
      where: {
        OR: [
          { team_role: "PLATFORM_ADMIN" },
          { is_admin: true }
        ]
      },
      select: { id: true, email: true }
    });

    // 2. Create Internal message so it appears in /messages
    if (admins.length > 0) {
      await prismadb.internalMessage.create({
        data: {
          sender_id: userId,
          sender_name: session.user.name || session.user.email,
          sender_email: session.user.email,
          subject: "New Feedback Received",
          body_text: feedback,
          status: "SENT",
          priority: "HIGH",
          team_id: teamId || "",
          sentAt: new Date(),
          recipients: {
            create: admins.map(admin => ({
              recipient_id: admin.id,
              recipient_type: "TO"
            }))
          }
        }
      });
    }

    // 3. Send mail notification
    // Primary: sales@basalthq.com, Fallback: sysadm@basalthq.com
    const adminEmails = admins.map(a => a.email as string).filter(Boolean);
    const toEmails = ["sales@basalthq.com", "sysadm@basalthq.com", ...adminEmails];
    const uniqueEmails = Array.from(new Set(toEmails));

    await resend.emails.send({
      from:
        process.env.NEXT_PUBLIC_APP_NAME + " <" + process.env.EMAIL_FROM + ">",
      to: uniqueEmails,
      subject: "New Feedback from: " + (session.user.name || session.user.email),
      text: `User: ${session.user.name} (${session.user.email})\n\nFeedback:\n${feedback}`,
    });

    return NextResponse.json({ message: "Feedback sent" }, { status: 200 });
  } catch (error) {
    console.log("[FEEDBACK_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
