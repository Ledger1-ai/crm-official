
import React from "react";
import Container from "../../components/ui/Container";
import CampaignsView from "../leads/components/CampaignsView";

const CampaignsPage = () => {
    return (
        <Container title="Outreach" description="Track and manage your marketing sequences">
            <CampaignsView />
        </Container>
    );
};

export default CampaignsPage;
