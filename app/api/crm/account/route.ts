import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

//Create new account route
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    const body = await req.json();
    const {
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    const newAccount = await (prismadb.crm_Accounts as any).create({
      data: {
        v: 0,
        team_id: teamId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        name,
        office_phone,
        website,
        fax,
        company_id,
        vat,
        email,
        billing_street,
        billing_postal_code,
        billing_city,
        billing_state,
        billing_country,
        shipping_street,
        shipping_postal_code,
        shipping_city,
        shipping_state,
        shipping_country,
        description,
        assigned_to,
        status: "Active",
        annual_revenue,
        member_of,
        industry,
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[NEW_ACCOUNT_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//Update account route
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      id,
      name,
      office_phone,
      website,
      fax,
      company_id,
      vat,
      email,
      billing_street,
      billing_postal_code,
      billing_city,
      billing_state,
      billing_country,
      shipping_street,
      shipping_postal_code,
      shipping_city,
      shipping_state,
      shipping_country,
      description,
      assigned_to,
      status,
      annual_revenue,
      member_of,
      industry,
    } = body;

    const newAccount = await (prismadb.crm_Accounts as any).update({
      where: {
        id,
      },
      data: {
        v: 0,
        updatedBy: session.user.id,
        name,
        office_phone,
        website,
        fax,
        company_id,
        vat,
        email,
        billing_street,
        billing_postal_code,
        billing_city,
        billing_state,
        billing_country,
        shipping_street,
        shipping_postal_code,
        shipping_city,
        shipping_state,
        shipping_country,
        description,
        assigned_to,
        status: status,
        annual_revenue,
        member_of,
        industry,
      },
    });

    return NextResponse.json({ newAccount }, { status: 200 });
  } catch (error) {
    console.log("[UPDATE_ACCOUNT_PUT]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}

//GET all accounts route
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }
  try {
    const teamInfo = await getCurrentUserTeamId();
    // If no team, return empty? 
    // Or allow seeing all if System Admin? For now default to strict team isolation.
    const where: any = {};
    if (teamInfo?.teamId) {
      where.team_id = teamInfo.teamId;
    } else {
      // Fallback: If no team, maybe return nothing?
      // Or if admin?
      // Let's return nothing if no team to be safe.
      // Unless admin... let's stick to team_id check.
      // If team_id is missing on user, they see nothing.
      return NextResponse.json([], { status: 200 });
    }

    const accounts = await (prismadb.crm_Accounts as any).findMany({
      where: {
        ...where,
        NOT: [
          { name: { startsWith: "Email -" } },
          { name: { startsWith: "Meeting" } },
          { name: { startsWith: "Call" } },
          { name: { startsWith: "Amazon SES" } },
          { name: { startsWith: "Project Documents" } },
        ]
      }
    });

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.log("[ACCOUNTS_GET]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
