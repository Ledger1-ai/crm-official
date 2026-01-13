
import React from "react";
import Container from "../../components/ui/Container";
import CampaignsView from "../leads/components/CampaignsView";

const CampaignsPage = () => {
    return (
        <Container title="Campaigns" description="Track and manage your marketing campaigns">
            <CampaignsView />
        </Container>
    );
};

export default CampaignsPage;
