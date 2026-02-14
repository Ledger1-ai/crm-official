import { Suspense } from "react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import SuspenseLoading from "@/components/loadings/suspense";

import ContactsView from "../components/ContactsView";
import { getContacts } from "@/actions/crm/get-contacts";
import { getAllCrmData } from "@/actions/crm/get-crm-data";

const AccountsPage = async () => {
  const crmData = await getAllCrmData();
  const contacts = await getContacts();
  return (
    <div>
      <div className="p-4 md:px-6 lg:px-8 pb-2">
        <Heading
          title="Contacts"
          description="Everything you need to know about your contacts"
        />
        <Separator className="mt-4" />
      </div>
      <div className="px-4 md:px-6 lg:px-8 pb-20 md:pb-4">
        <Suspense fallback={<SuspenseLoading />}>
          <ContactsView crmData={crmData} data={contacts} />
        </Suspense>
      </div>
    </div>
  );
};

export default AccountsPage;
