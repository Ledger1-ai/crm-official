import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sendEmail from "@/lib/sendmail";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const body = await req.json();
    const userId = session.user.id;

    if (!body) {
      return new NextResponse("No form data", { status: 400 });
    }

    const {
      account,
      assigned_to,
      assign_to_project,
      budget,
      lead_source,
      close_date,
      contact,
      currency,
      description,
      expected_revenue,
      name,
      next_step,
      sales_stage,
      type,
    } = body;

    //console.log(req.body, "req.body");

    const newOpportunity = await (prismadb.crm_Opportunities as any).create({
      data: {
        v: 0,
        team_id: teamId,
        account: account,
        assigned_to: assigned_to,
        project: assign_to_project,
        budget: Number(budget),
        lead_source: lead_source,
        close_date: close_date,
        contact: contact,
        created_by: userId,
        last_activity_by: userId,
        updatedBy: userId,
        currency: currency,
        description: description,
        expected_revenue: Number(expected_revenue),
        name: name,
        next_step: next_step,
        sales_stage: sales_stage,
        status: "ACTIVE",
        type: type,
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
            ? `New opportunity ${name} has been added to the system and assigned to you.`
            : `Nová příležitost ${name} byla přidána do systému a přidělena vám.`,
        text:
          notifyRecipient.userLanguage === "en"
            ? `New opportunity ${name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newOpportunity.id}`
            : `Nová příležitost ${name} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${newOpportunity.id}`,
      });
    }

    return NextResponse.json({ newOpportunity }, { status: 200 });
  } catch (error) {
    console.log("[NEW_OPPORTUNITY_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
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
      account,
      assigned_to,
      assign_to_project,
      budget,
      lead_source,
      close_date,
      contact,
      currency,
      description,
      expected_revenue,
      name,
      next_step,
      sales_stage,
      type,
    } = body;

    //console.log(req.body, "req.body");

    const updatedOpportunity = await (prismadb.crm_Opportunities as any).update({
      where: { id },
      data: {
        account: account,
        assigned_to: assigned_to,
        project: assign_to_project,
        budget: Number(budget),
        lead_source: lead_source,
        close_date: close_date,
        contact: contact,
        updatedBy: userId,
        currency: currency,
        description: description,
        expected_revenue: Number(expected_revenue),
        name: name,
        next_step: next_step,
        sales_stage: sales_stage,
        status: "ACTIVE",
        type: type,
      },
    });

    return NextResponse.json({ updatedOpportunity }, { status: 200 });
  } catch (error) {
    console.log("[UPDATED_OPPORTUNITY_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const teamInfo = await getCurrentUserTeamId();
    const where: any = {};
    if (teamInfo?.teamId) {
      where.team_id = teamInfo.teamId;
    } else {
      return NextResponse.json({
        users: [],
        accounts: [],
        contacts: [],
        saleTypes: [],
        saleStages: [],
        campaigns: [], // Potentially needs team_id too
        industries: []
      }, { status: 200 });
    }

    const users = await (prismadb.users as any).findMany({
      where: { team_id: teamInfo.teamId }
    });
    const accounts = await (prismadb.crm_Accounts as any).findMany({
      where: where
    });
    const contacts = await (prismadb.crm_Contacts as any).findMany({
      where: where
    });
    const saleTypes = await prismadb.crm_Opportunities_Type.findMany({});
    const saleStages = await prismadb.crm_Opportunities_Sales_Stages.findMany(
      {}
    );
    // Assuming campaigns are global for now, or need update. If global, no where.
    const campaigns = await prismadb.crm_campaigns.findMany({});
    const industries = await prismadb.crm_Industry_Type.findMany({});

    const data = {
      users,
      accounts,
      contacts,
      saleTypes,
      saleStages,
      campaigns,
      industries,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log("[GET_OPPORTUNITIES]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
