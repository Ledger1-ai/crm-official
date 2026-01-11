"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import MaskedKeyDisplay from "@/app/[locale]/cms/(dashboard)/_components/MaskedKeyDisplay";
import { updateSystemResendConfig } from "@/actions/system/update-resend-config";
import { toast } from "react-hot-toast";

interface SystemResendConfigProps {
    resendKeyId: string;
    envKey: string | undefined;
    dbKey: string | undefined;
}

const SystemResendConfig = ({ resendKeyId, envKey, dbKey }: SystemResendConfigProps) => {

    const handleSubmit = async (formData: FormData) => {
        try {
            await updateSystemResendConfig(formData);
            toast.success("System API Key updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update API Key");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">System API Key Status</p>
                    <p className="text-xs text-muted-foreground">
                        {envKey ? "ENV key configured" : dbKey ? "DB key configured" : "Not configured"}
                    </p>
                </div>
                {(envKey || dbKey) && (
                    <MaskedKeyDisplay keyValue={envKey || dbKey || ""} />
                )}
            </div>

            <form action={handleSubmit} className="flex items-center gap-2">
                <input type="hidden" name="id" value={resendKeyId} readOnly />
                <Input
                    type="password"
                    name="serviceKey"
                    placeholder="Enter new System API key"
                    className="bg-background h-9 max-w-sm"
                />
                <Button type="reset" variant="outline" size="sm" className="min-w-[100px]">
                    Reset
                </Button>
                <Button type="submit" size="sm" className="min-w-[120px]">
                    Update Key
                </Button>
            </form>
        </div>
    );
};

export default SystemResendConfig;
