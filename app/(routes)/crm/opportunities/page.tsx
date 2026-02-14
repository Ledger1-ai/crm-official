import { Suspense } from "react";

import SuspenseLoading from "@/components/loadings/suspense";

import Container from "../../components/ui/Container";
import OpportunitiesView from "../components/OpportunitiesView";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getOpportunitiesFull } from "@/actions/crm/get-opportunities-with-includes";
import ProjectOpportunitiesPanel from "../dashboard/_components/ProjectOpportunitiesPanel";

const AccountsPage = async () => {
  const crmData = await getAllCrmData();
  const opportunities = await getOpportunitiesFull();

  return (
    <Container
      title="Opportunities"
      description={"Everything you need to know about your opportinities"}
    >
      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Project Feature Requests</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Sales can post feature buildouts or commissioned work tied to a specific project. These can be referenced from project tasks.
          </p>
          <div className="mt-2">
            <ProjectOpportunitiesPanel />
          </div>
        </div>

        <Suspense fallback={<SuspenseLoading />}>
          <OpportunitiesView crmData={crmData} data={opportunities} />
        </Suspense>
      </div>
    </Container>
  );
};

export default AccountsPage;
