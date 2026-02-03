import React from "react";
import Container from "../components/ui/Container";
import ReportsDashboard from "./components/ReportsDashboard";
import { getUsersByMonth } from "@/actions/get-users";
import { getOpportunitiesByMonth } from "@/actions/crm/get-opportunities";
import { getTasksByMonth } from "@/actions/campaigns/get-tasks";
import { getFinancialsByMonth } from "@/actions/reports/get-financials";

import { getLeadsByMonth } from "@/actions/crm/get-leads";
import { getDepartments } from "@/actions/departments/get-departments";

type Props = {};

const ReportsPage = async (props: Props) => {
  // Fetch initial data (defaults to current year in actions if no dates provided)
  const [usersData, oppsData, tasksData, financialsData, leadsData, deptsResult] = await Promise.all([
    getUsersByMonth(),
    getOpportunitiesByMonth(),
    getTasksByMonth(),
    getFinancialsByMonth(),
    getLeadsByMonth(),
    getDepartments()
  ]);

  const departments = deptsResult.success ? deptsResult.departments || [] : [];

  return (
    <Container
      title="Reports"
      description={
        "Comprehensive analytics overview of your CRM performance."
      }
    >
      <div className="pt-5">
        <ReportsDashboard
          usersInitial={usersData}
          oppsInitial={oppsData}
          tasksInitial={tasksData}
          financialsInitial={financialsData}
          leadsInitial={leadsData}
          departments={departments}
        />
      </div>
    </Container>
  );
};

export default ReportsPage;
