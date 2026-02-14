import Container from "@/app/(routes)/components/ui/Container";

import { BasicView } from "./components/BasicView";

import { getContact } from "@/actions/crm/get-contact";
import { getOpportunitiesFullByContactId } from "@/actions/crm/get-opportunities-with-includes-by-contactId";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getDocumentsByContactId } from "@/actions/documents/get-documents-by-contactId";
import { getAccountsByContactId } from "@/actions/crm/get-accounts-by-contactId";

import AccountsView from "../../components/AccountsView";
import OpportunitiesView from "../../components/OpportunitiesView";
import DocumentsView from "../../components/DocumentsView";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";

const ContactViewPage = async (props: any) => {
  const params = await props.params;
  const { contactId } = params;

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

  const hasAccess = (perm: string) => isSuperAdmin || permissions.includes('*') || permissions.includes(perm);

  const contact = await getContact(contactId);
  const crmDataPromise = getAllCrmData();

  // Conditionally fetch data
  const opportunities = hasAccess('contacts.detail.opportunities') ? await getOpportunitiesFullByContactId(contactId) : [];
  const documents = hasAccess('contacts.detail.documents') ? await getDocumentsByContactId(contactId) : [];
  const accounts = hasAccess('contacts.view') ? await getAccountsByContactId(contactId) : [];

  const crmData = await crmDataPromise;

  if (!contact) return <div>Contact not found</div>;

  return (
    <Container
      title={`Contact detail view: ${contact?.first_name} ${contact?.last_name}`}
      description={"Everything you need to know about sales potential"}
    >
      <div className="space-y-5">
        {hasAccess('contacts.detail.info') && <BasicView data={contact} />}

        {hasAccess('accounts.view') && <AccountsView data={accounts} crmData={crmData} />}

        {hasAccess('contacts.detail.opportunities') && <OpportunitiesView data={opportunities} crmData={crmData} />}
        {hasAccess('contacts.detail.documents') && <DocumentsView data={documents} />}
      </div>
    </Container>
  );
};

export default ContactViewPage;
