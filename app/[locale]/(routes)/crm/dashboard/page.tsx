import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import DashboardRoleManager from "./_components/DashboardRoleManager";
import SuspenseLoading from "@/components/loadings/suspense";

const CrmDashboardPage = async () => {
  return (
    <Container>
      <Suspense fallback={<SuspenseLoading />}>
        <DashboardRoleManager />
      </Suspense>
    </Container>
  );
};

export default CrmDashboardPage;
