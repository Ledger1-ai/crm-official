import React from "react";
import { getServerSession } from "next-auth";

import { columns } from "./components/Columns";
import { DataTable } from "./components/data-table";
import Container from "../../components/ui/Container";

import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import InitModulesButton from "./components/InitModulesButton";

const AdminModulesPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return (
      <Container
        title="Administration"
        description="You are not admin, access not allowed"
      >
        <div className="flex w-full h-full items-center justify-center">
          Access not allowed
        </div>
      </Container>
    );
  }

  const modules: any = await getModules();
  return (
    <Container
      title="Modules administration"
      description={"Here you can manage your Ledger1CRM modules"}
    >
      {modules && modules.length > 0 ? (
        <DataTable columns={columns} data={modules} search="name" />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div>Modules list is empty. Initialize defaults to enable features.</div>
          <InitModulesButton />
        </div>
      )}
    </Container>
  );
};

export default AdminModulesPage;
