import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { Separator } from "@/components/ui/separator";
import { BasicView } from "./components/BasicView";

import { getAccount } from "@/actions/crm/get-account";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunitiesFullByAccountId } from "@/actions/crm/get-opportunities-with-includes-by-accountId";
import { getContactsByAccountId } from "@/actions/crm/get-contacts-by-accountId";
import { getLeadsByAccountId } from "@/actions/crm/get-leads-by-accountId";
import { getDocumentsByAccountId } from "@/actions/documents/get-documents-by-accountId";
import { getContractsByAccountId } from "@/actions/crm/get-contracts";
import { getAccountsTasks } from "@/actions/crm/account/get-tasks";

import OpportunitiesView from "../../components/OpportunitiesView";
import LeadsView from "../../components/LeadsView";
import ContactsView from "../../components/ContactsView";
import DocumentsView from "../../components/DocumentsView";

import {
  Documents,
  crm_Accounts,
  crm_Accounts_Tasks,
  crm_Contacts,
  crm_Contracts,
  crm_Leads,
  crm_Opportunities,
} from "@prisma/client";

import AccountsTasksView from "./components/TasksView";
import ContractsView from "../../components/ContractsView";
import { LeadTimeline } from "../../leads/[leadId]/components/LeadTimeline";
import { History, Info } from "lucide-react";

interface AccountDetailPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

const AccountDetailPage = async (props: AccountDetailPageProps) => {
  const params = await props.params;
  const { accountId } = params;
  const account: crm_Accounts | null = await getAccount(accountId);
  const opportunities: crm_Opportunities[] =
    await getOpportunitiesFullByAccountId(accountId);
  const contacts: crm_Contacts[] = await getContactsByAccountId(accountId);
  const contracts: crm_Contracts[] = await getContractsByAccountId(accountId);
  const leads: crm_Leads[] = await getLeadsByAccountId(accountId);
  const documents: Documents[] = await getDocumentsByAccountId(accountId);
  const tasks: crm_Accounts_Tasks[] = await getAccountsTasks(accountId);
  const crmData = await getAllCrmData();

  if (!account) return <div>Account not found</div>;

  return (
    <Container
      title={`Account: ${account?.name}`}
      description={"Everything you need to know about sales potential"}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Info size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Account Information</h3>
          </div>
          <BasicView data={account} />
          <AccountsTasksView data={tasks} account={account} />
          <ContactsView data={contacts} crmData={crmData} accountId={accountId} />
          <LeadsView data={leads} crmData={crmData} />
          <DocumentsView data={documents} />
        </div>

        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <History size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Account Communication History</h3>
          </div>
          <LeadTimeline
            accountId={accountId}
            leadEmail={account?.email || ""}
            leadName={account?.name || ""}
          />
          <Separator className="bg-white/5 my-8" />
          <OpportunitiesView
            data={opportunities}
            crmData={crmData}
            accountId={accountId}
          />
          <ContractsView
            data={contracts}
            crmData={crmData}
            accountId={accountId}
          />
        </div>
      </div>
    </Container>
  );
};

export default AccountDetailPage;
