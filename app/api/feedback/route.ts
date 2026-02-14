import { authOptions } from "@/lib/auth";
import resendHelper from "@/lib/resend";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body || !body.feedback) {
      return new NextResponse("Missing feedback", { status: 400 });
    }

    const { feedback } = body;
    const userId = session.user.id;
    const teamId = (session.user as any).team_id;

    // Fetch User and Team Details
    const [user, team] = await Promise.all([
      prismadb.users.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      }),
      teamId ? prismadb.team.findUnique({
        where: { id: teamId },
        select: { name: true }
      }) : null
    ]);

    const senderName = user?.name || session.user.name || "Unknown User";
    const senderEmail = user?.email || session.user.email || "Unknown Email";
    const teamName = team?.name || "No Team";
    const timeDelivered = new Date().toLocaleString();

    // Construct the content
    const subject = `New Feedback from: ${senderName} (${teamName})`;
    const feedbackContent = `
Team: ${teamName}
User: ${senderName} (${senderEmail})
Time: ${timeDelivered}

Feedback:
${feedback}
    `.trim();

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
    // Only create if we have a valid team_id, as it is required by schema
    if (admins.length > 0 && teamId) {
      await prismadb.internalMessage.create({
        data: {
          sender_id: userId,
          sender_name: senderName,
          sender_email: senderEmail,
          subject: subject,
          body_text: feedbackContent,
          body_html: feedbackContent.replace(/\n/g, "<br>"),
          status: "SENT",
          priority: "HIGH",
          team_id: teamId,
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
    const resend = await resendHelper();
    const uniqueEmails = ["support@basalthq.com"];

    await resend.emails.send({
      from: process.env.NEXT_PUBLIC_APP_NAME + " <" + process.env.EMAIL_FROM + ">",
      to: uniqueEmails,
      subject: subject,
      text: feedbackContent,
      html: feedbackContent.replace(/\n/g, "<br>"),
    });

    return NextResponse.json({ message: "Feedback sent" }, { status: 200 });

  } catch (error) {
    console.error("[FEEDBACK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
