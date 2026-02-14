
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { SendInvoiceDialog } from "../../../dialogs/SendInvoiceDialog";

interface Props {
    invoice: any;
}

export const SendInvoiceButton = ({ invoice }: Props) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                className="border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10"
                onClick={() => setOpen(true)}
            >
                <Send className="w-4 h-4 mr-2" />
                Deliver link
            </Button>

            <SendInvoiceDialog
                open={open}
                onOpenChange={setOpen}
                invoice={invoice}
            />
        </>
    );
};
