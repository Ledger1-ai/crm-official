import React from "react";
import Container from "@/app/(routes)/components/ui/Container";

// TODO: Fetch real teams from Prisma
// import prismadb from "@/lib/prismadb";

export const dynamic = "force-dynamic";

const PartnersPage = async () => {

    return (
        <Container
            title="Partners"
            description="Manage your Teams and CRM Instances"
        >
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Teams</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder for Team List */}
                    <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <h3 className="text-lg font-bold">Main Team</h3>
                        <p className="text-sm text-muted-foreground">Default Organization</p>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default PartnersPage;
