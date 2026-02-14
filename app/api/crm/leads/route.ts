import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// Get leads for current team
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const leads = await prismadb.crm_Leads.findMany({
      where: {
        team_id: teamId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.log("[LEADS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

//Create a new lead route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      first_name,
      last_name,
      company,
      jobTitle,
      email,
      phone,
      description,
      lead_source,
      refered_by,
      //campaign, // Replaced by social profiles
      social_twitter,
      social_facebook,
      social_linkedin,
      assigned_to,
      accountIDs,
    } = body;

    //console.log(req.body, "req.body");

    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // Check for duplicate email in the same team
    if (email) {
      const existingLead = await (prismadb.crm_Leads as any).findFirst({
        where: {
          email: email,
          team_id: teamId,
        },
      });

      if (existingLead) {
        return new NextResponse(
          JSON.stringify({ message: "Lead already exists", leadId: existingLead.id }),
          { status: 409 }
        );
      }
    }

    const newLead = await (prismadb.crm_Leads as any).create({
      data: {
        v: 1,
        team_id: teamId, // Assign team
        createdBy: userId,
        updatedBy: userId,
        firstName: first_name,
        lastName: last_name,
        company,
        jobTitle,
        email,
        phone,
        description,
        lead_source,
        refered_by,
        campaign: "", // Deprecated
        social_twitter,
        social_facebook,
        social_linkedin,
        assigned_to: assigned_to || userId,
        accountsIDs: accountIDs || undefined,
        status: "NEW",
        type: "DEMO",
        project: body.project || undefined,
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject:
          notifyRecipient.userLanguage === "en"
            ? `New lead ${first_name} ${last_name} has been added to the system and assigned to you.`
            : `Nová příležitost ${first_name} ${last_name} byla přidána do systému a přidělena vám.`,
        text:
          notifyRecipient.userLanguage === "en"
            ? `New lead ${first_name} ${last_name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newLead.id}`
            : `Nová příležitost ${first_name} ${last_name} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newLead.id}`,
      });
    }

    return NextResponse.json({ newLead }, { status: 200 });
  } catch (error) {
    console.log("[NEW_LEAD_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//UPdate a lead route
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      id,
      firstName,
      lastName,
      company,
      jobTitle,
      email,
      phone,
      description,
      lead_source,
      refered_by,
      campaign,
      assigned_to,
      accountIDs,
      status,
      type,
      social_twitter,
      social_facebook,
      social_linkedin,
      project,
    } = body;

    const updatedLead = await prismadb.crm_Leads.update({
      where: {
        id,
      },
      data: {
        v: 1,
        updatedBy: userId,
        firstName,
        lastName,
        company,
        jobTitle,
        email,
        phone,
        description,
        lead_source,
        refered_by,
        campaign,
        social_twitter,
        social_facebook,
        social_linkedin,
        assigned_to: assigned_to || userId,
        accountsIDs: accountIDs,
        status,
        type,
        project,
      },
    });

    if (assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: {
          id: assigned_to,
        },
      });

      if (!notifyRecipient) {
        return new NextResponse("No user found", { status: 400 });
      }

      await sendEmail({
        from: process.env.EMAIL_FROM as string,
        to: notifyRecipient.email || "info@softbase.com",
        subject:
          notifyRecipient.userLanguage === "en"
            ? `New lead ${firstName} ${lastName} has been added to the system and assigned to you.`
            : `Nová příležitost ${firstName} ${lastName} byla přidána do systému a přidělena vám.`,
        text:
          notifyRecipient.userLanguage === "en"
            ? `New lead ${firstName} ${lastName} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${updatedLead.id}`
            : `Nová příležitost ${firstName} ${lastName} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${updatedLead.id}`,
      });
    }

    return NextResponse.json({ updatedLead }, { status: 200 });
  } catch (error) {
    console.log("[UPDATED_LEAD_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
