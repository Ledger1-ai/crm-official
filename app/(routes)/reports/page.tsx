import React from "react";
import Container from "../components/ui/Container";
import ReportsDashboard from "./components/ReportsDashboard";
import { getUsersByMonth } from "@/actions/get-users";
import { getOpportunitiesByMonth } from "@/actions/crm/get-opportunities";
import { getTasksByMonth } from "@/actions/projects/get-tasks";
import { getFinancialsByMonth } from "@/actions/reports/get-financials";

import { getLeadsByMonth } from "@/actions/crm/get-leads";
import { getDepartments } from "@/actions/departments/get-departments";
import { getSavedReports } from "@/actions/reports/get-saved-reports";

type Props = {};

const ReportsPage = async (props: Props) => {
  // Fetch initial data (defaults to current year in actions if no dates provided)
  const [usersData, oppsData, tasksData, financialsData, leadsData, deptsResult, savedReports] = await Promise.all([
    getUsersByMonth(),
    getOpportunitiesByMonth(),
    getTasksByMonth(),
    getFinancialsByMonth(),
    getLeadsByMonth(),
    getDepartments(),
    getSavedReports()
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
          savedReports={savedReports || []}
        />
      </div>
    </Container>
  );
};

export default ReportsPage;
