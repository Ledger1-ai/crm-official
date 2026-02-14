import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getValidationRules } from "@/actions/crm/validation-rules";
import { ValidationRulesClient } from "./components/ValidationRulesClient";
import { Shield } from "lucide-react";

export const metadata = {
    title: "Guard Rules | CRM Settings",
    description: "Define formula-based guard rules to enforce data quality"
};

export default async function ValidationRulesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as { team_id?: string }).team_id;
    const rules = await getValidationRules(teamId || "");

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Guard Rules</h1>
                        <p className="text-sm text-muted-foreground">
                            Enforce data quality with formula-based field validation
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <Suspense fallback={<div>Loading rules...</div>}>
                    <ValidationRulesClient rules={rules} teamId={teamId || ""} />
                </Suspense>
            </div>
        </div>
    );
}
