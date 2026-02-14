import React, { Suspense } from "react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import AccountsView from "../components/AccountsView";
import SuspenseLoading from "@/components/loadings/suspense";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getAccounts } from "@/actions/crm/get-accounts";

const AccountsPage = async () => {
  const crmData = await getAllCrmData();
  const accounts = await getAccounts();

  return (
    <div>
      <div className="p-4 md:px-6 lg:px-8 pb-2">
        <Heading
          title="Accounts"
          description="Everything you need to know about your accounts"
        />
        <Separator className="mt-4" />
      </div>
      <div className="px-4 md:px-6 lg:px-8 pb-20 md:pb-4">
        <Suspense fallback={<SuspenseLoading />}>
          <AccountsView crmData={crmData} data={accounts} />
        </Suspense>
      </div>
    </div>
  );
};

export default AccountsPage;
