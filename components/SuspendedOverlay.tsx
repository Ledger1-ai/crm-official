"use client";

import { Ban, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

type Props = {
    reason?: string | null;
};

const SuspendedOverlay = ({ reason }: Props) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border border-destructive/20 shadow-2xl rounded-lg overflow-hidden">
                <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center text-center border-b border-destructive/10">
                    <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Lock className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-destructive">Account Suspended</h1>
                    <p className="text-muted-foreground mt-2">
                        Your access to this workspace has been temporarily suspended.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-muted p-4 rounded-md border text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                        <p className="font-medium text-lg">{reason || "Administrative Action"}</p>
                    </div>

                    <div className="text-sm text-muted-foreground text-center space-y-2">
                        <p>
                            Please contact your workspace administrator or support to resolve this issue.
                        </p>
                        {reason?.toLowerCase().includes("billing") && (
                            <p className="text-green-600 font-medium">
                                * Outstanding invoices may need to be settled.
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-muted/20 flex flex-col gap-3">
                    <Button variant="default" className="w-full" onClick={() => window.location.href = "mailto:support@ledger1.ai"}>
                        Contact Support
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SuspendedOverlay;
