import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

// GET /api/crm/leads/:leadId/activities
// Returns recent lead activities (latest first). Non-admins are restricted to their assigned leads.
type Params = { params: Promise<{ leadId: string }> };
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { leadId: rawLeadId } = await params;
    if (!rawLeadId) return new NextResponse("Missing leadId", { status: 400 });

    let leadId = rawLeadId;

    // If the provided ID is not a lead, but a contact, find the lead
    const contact = await prismadb.crm_Contacts.findUnique({
      where: { id: rawLeadId },
      select: { tags: true, email: true }
    });

    if (contact) {
      const leadIdTag = contact.tags.find(t => t.startsWith("leadId:"));
      if (leadIdTag) {
        leadId = leadIdTag.split(":")[1];
      } else if (contact.email) {
        // Fallback: finding lead by email
        const leadByEmail = await prismadb.crm_Leads.findFirst({
          where: { email: contact.email },
          select: { id: true }
        });
        if (leadByEmail) leadId = leadByEmail.id;
      }
    } else {
      // Check if it's an account
      const account = await prismadb.crm_Accounts.findUnique({
        where: { id: rawLeadId },
        select: { email: true }
      });
      if (account && account.email) {
        const leadByEmail = await prismadb.crm_Leads.findFirst({
          where: { email: account.email },
          select: { id: true }
        });
        if (leadByEmail) leadId = leadByEmail.id;
      }
    }

    // Determine admin privileges
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { is_admin: true, is_account_admin: true },
    });
    const isAdmin = !!(user?.is_admin || user?.is_account_admin);

    // If not admin, verify the lead belongs to current user
    if (!isAdmin) {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: leadId },
        select: { assigned_to: true },
      });
      if (!lead || lead.assigned_to !== session.user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const activities = await prismadb.crm_Lead_Activities.findMany({
      where: { lead: leadId },
      orderBy: { createdAt: "desc" as const },
      take: 50,
      include: {
        assigned_user: {
          select: {
            name: true,
            avatar: true,
          }
        }
      }
    });

    // Fetch associated outreach items for email tracking details
    const trackingTokens = activities
      .filter(a => a.type === "EMAIL" && (a.metadata as any)?.trackingToken)
      .map(a => (a.metadata as any).trackingToken);

    const outreachItems = await prismadb.crm_Outreach_Items.findMany({
      where: { tracking_token: { in: trackingTokens } },
    });

    // Merge activities with outreach items
    const mergedActivities = activities.map(activity => {
      if (activity.type === "EMAIL") {
        const token = (activity.metadata as any)?.trackingToken;
        const outreach = outreachItems.find(o => o.tracking_token === token);
        return {
          ...activity,
          outreach
        };
      }
      return activity;
    });

    return NextResponse.json({ activities: mergedActivities }, { status: 200 });
  } catch (error) {

    console.error("[LEAD_ACTIVITIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
