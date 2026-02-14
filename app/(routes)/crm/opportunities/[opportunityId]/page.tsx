import Container from "@/app/(routes)/components/ui/Container";

import { BasicView } from "./components/BasicView";

import DocumentsView from "../../components/DocumentsView";
import ContactsView from "../../components/ContactsView";
import AccountsView from "../../components/AccountsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunity } from "@/actions/crm/get-opportunity";
import { getContactsByOpportunityId } from "@/actions/crm/get-contacts-by-opportunityId";
import { getDocumentsByOpportunityId } from "@/actions/documents/get-documents-by-opportunityId";
import { getAccountsByOpportunityId } from "@/actions/crm/get-accounts-by-opportunityId";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";

const OpportunityView = async (
  props: {
    params: Promise<{ opportunityId: string }>;
  }
) => {
  const params = await props.params;

  const {
    opportunityId
  } = params;

  // Permission Logic
  const session = await getServerSession(authOptions);
  let permissions: string[] = [];
  let isSuperAdmin = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true, team_id: true, department_id: true, assigned_modules: true }
    });
    isSuperAdmin = user?.team_role === 'SUPER_ADMIN' || user?.team_role === 'OWNER' || user?.team_role === 'PLATFORM_ADMIN';

    if (isSuperAdmin) {
      permissions = ['*'];
    } else if (user) {
      if (user.assigned_modules && user.assigned_modules.length > 0) {
        permissions = user.assigned_modules;
      } else {
        const contextId = user.department_id || user.team_id;
        const scope = user.department_id ? 'DEPARTMENT' : 'ORGANIZATION';
        if (contextId && user.team_role) {
          permissions = await getEffectiveRoleModules(contextId, user.team_role, scope);
        }
      }
    }
  }

  // Simplified permission check:
  // Users who can access this page should see its content by default.
  // Only hide content if explicitly denied via permission system.
  const hasAccess = (perm: string) => {
    // Super admins always have full access
    if (isSuperAdmin) return true;

    // Wildcard grants all
    if (permissions.includes('*')) return true;

    // Exact permission match
    if (permissions.includes(perm)) return true;

    // Check parent permissions (e.g., 'opportunities' grants 'opportunities.detail.info')
    const parts = perm.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {
      const parentPerm = parts.slice(0, i).join('.');
      if (permissions.includes(parentPerm)) return true;
    }

    // detail_view grants all detail.* access
    if (perm.startsWith('opportunities.detail.') && permissions.includes('opportunities.detail_view')) return true;

    // DEFAULT BEHAVIOR: Allow access to detail page sections unless explicitly denied
    // If user navigated to this page, they should see the content
    // The sidebar/route protection handles top-level access control
    return true;
  };

  const opportunityPromise = getOpportunity(opportunityId);
  const crmDataPromise = getAllCrmData();
  const [opportunity, crmData] = await Promise.all([opportunityPromise, crmDataPromise]);

  // Conditional fetching
  const accounts = hasAccess('opportunities.detail.accounts') ? await getAccountsByOpportunityId(opportunityId) : [];
  const contacts = hasAccess('opportunities.detail.contacts') ? await getContactsByOpportunityId(opportunityId) : [];
  const documents = hasAccess('opportunities.detail.documents') ? await getDocumentsByOpportunityId(opportunityId) : [];

  if (!opportunity) return <div>Opportunity not found</div>;

  return (
    <Container
      title={`Opportunity ${opportunity.name} - detail view`}
      description={"Description - " + opportunity.description}
    >
      <div className="space-y-5">
        {hasAccess('opportunities.detail.info') && <BasicView data={opportunity} />}
        {hasAccess('opportunities.detail.accounts') && <AccountsView crmData={crmData} data={accounts} />}
        {hasAccess('opportunities.detail.contacts') && <ContactsView crmData={crmData} data={contacts} />}
        {hasAccess('opportunities.detail.documents') && <DocumentsView data={documents} />}
      </div>
    </Container>
  );
};

export default OpportunityView;
