import { getAllCrmData } from "@/actions/crm/get-crm-data";
import Container from "@/app/(routes)/components/ui/Container";
import { NewOpportunityFormWrapper } from "./components/NewOpportunityFormWrapper";

const NewOpportunityPage = async () => {
    const data = await getAllCrmData();

    return (
        <Container
            title="Create New Opportunity"
            description="Add a new sales opportunity to your CRM."
        >
            <div className="bg-card p-6 rounded-lg border shadow-sm max-w-4xl mx-auto">
                <NewOpportunityFormWrapper
                    users={data.users}
                    accounts={data.accounts}
                    contacts={data.contacts}
                    salesType={data.saleTypes}
                    saleStages={data.saleStages}
                    boards={data.boards}
                />
            </div>
        </Container>
    );
};

export default NewOpportunityPage;
