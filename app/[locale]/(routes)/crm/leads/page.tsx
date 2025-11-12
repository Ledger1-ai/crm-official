import { Suspense } from "react";

import SuspenseLoading from "@/components/loadings/suspense";

import Container from "../../components/ui/Container";
import LeadsView from "../components/LeadsView";
import TabsContainer from "./components/TabsContainer";
import LeadGenWizardPage from "./autogen/page";
import LeadPoolsPage from "./pools/page";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";

export const dynamic = "force-dynamic";

type LeadsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const LeadsPage = async ({ searchParams }: LeadsPageProps) => {
  const sp = searchParams ? await searchParams : undefined;
  const crmData = await getAllCrmData();
  const leads = await getLeads();
  const tabParam = sp?.tab;
  const tab = typeof tabParam === "string" ? tabParam : Array.isArray(tabParam) ? tabParam[0] ?? "manager" : "manager";

  return (
    <Container
      title="Leads Manager"
      description={"Everything you need to know about your leads"}
    >
      <TabsContainer
        managerSlot={
          <Suspense fallback={<SuspenseLoading />}>
            <LeadsView crmData={crmData} data={leads} />
          </Suspense>
        }
        wizardSlot={<LeadGenWizardPage />}
        poolsSlot={<LeadPoolsPage />}
      />
    </Container>
  );
};

export default LeadsPage;
