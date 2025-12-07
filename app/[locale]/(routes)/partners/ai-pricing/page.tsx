
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
// import { Button } from "@/components/ui/button"; // Moved
// import { Input } from "@/components/ui/input"; // Moved
// import { Switch } from "@/components/ui/switch"; // Moved
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { revalidatePath } from "next/cache";

import { AiModelRow } from "./_components/AiModelRow";

const AiPricingPage = async () => {
    const models = await prismadb.aiModel.findMany({
        orderBy: [{ provider: 'asc' }, { name: 'asc' }]
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">AI Model Pricing & Configuration</h1>
                {/* Sync button could go here */}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Model Name</TableHead>
                            <TableHead>Model ID</TableHead>
                            <TableHead>Input Price ($/1k)</TableHead>
                            <TableHead>Output Price ($/1k)</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {models.map((model) => (
                            <AiModelRow key={model.id} model={model} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AiPricingPage;
