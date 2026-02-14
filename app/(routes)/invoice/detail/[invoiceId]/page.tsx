import React from "react";
import Container from "../../../components/ui/Container";
import { getInvoice } from "@/actions/invoice/get-invoice";

import { SurgeButton } from "./_components/SurgeButton";
import { PaymentSuccessHandler } from "./_components/PaymentSuccessHandler";
import StaticReceipt from "./_components/StaticReceipt";
import { getSurgeReceipt } from "@/actions/invoice/get-surge-receipt";
import { InvoiceHistory } from "./_components/InvoiceHistory";
import { SendInvoiceButton } from "./_components/SendInvoiceButton";
import { getInvoiceActivity } from "@/actions/invoice/get-invoice-activity";
import { History, LayoutGrid, MoreVertical, Share2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface InvoiceDetailProps {
  params: Promise<{ invoiceId: string }>;
}

const InvoiceDetailPage = async (props: InvoiceDetailProps) => {
  const params = await props.params;
  const { invoiceId } = params;
  const invoiceData = await getInvoice(invoiceId);
  const activities = await getInvoiceActivity(invoiceId);

  // Fetch Surge Receipt if PAID
  let surgeReceipt = null;
  if (invoiceData.payment_status === "PAID" && invoiceData.surge_payment_id) {
    surgeReceipt = await getSurgeReceipt(invoiceId);
  }

  return (
    <Container title={`Invoice ${invoiceData.invoice_number || invoiceId}`} description="Advanced Billing Interface" sticky>
      {/* Payment Verification Overlay */}
      <PaymentSuccessHandler invoiceId={invoiceId} />

      <div className="flex flex-col h-full max-w-5xl mx-auto w-full gap-8 py-4">

        {/* Action Center - Refined & Professional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Status</span>
              <span className={`text-sm font-black uppercase ${invoiceData.payment_status === "PAID" ? "text-green-500" : "text-white"}`}>
                {invoiceData.payment_status === "PAID" ? "Settled (PAID)" : (invoiceData.status || "Pending")}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Total Amount</span>
              <span className="text-sm font-black text-white">{invoiceData.invoice_amount} {invoiceData.invoice_currency || "USDC"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Delivery Action (Email/SMS) */}
            <SendInvoiceButton invoice={invoiceData} />

            {/* History Flyout */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                  <History className="w-4 h-4 mr-2" />
                  Activity
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-zinc-950 border-zinc-800 w-full sm:max-w-md">
                <SheetHeader className="pb-8">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    <History className="text-blue-500 w-5 h-5" /> History & Comments
                  </SheetTitle>
                </SheetHeader>
                <InvoiceHistory invoice={invoiceData} activities={activities} />
              </SheetContent>
            </Sheet>

            {/* Primary Pay Action */}
            <SurgeButton
              invoiceId={invoiceData.id}
              paymentLink={invoiceData.surge_payment_link}
              paymentStatus={invoiceData.payment_status}
              amount={invoiceData.invoice_amount}
              currency={invoiceData.invoice_currency}
            />
          </div>
        </div>

        {/* Main Document View - Optimized Width */}
        <div className="flex-1 flex justify-center w-full min-h-[600px]">
          <div className="w-full bg-zinc-900/20 rounded-3xl overflow-hidden border border-zinc-800/50 relative shadow-2xl">
            {invoiceData.payment_status === "PAID" && surgeReceipt ? (
              <StaticReceipt data={surgeReceipt} status="PAID" />
            ) : invoiceData.surge_payment_id ? (
              <StaticReceipt
                data={invoiceData}
                status="PENDING"
                paymentUrl={invoiceData.surge_payment_link || undefined}
              />
            ) : invoiceData.invoice_file_url ? (
              <embed
                className="w-full h-full"
                type="application/pdf"
                src={invoiceData.invoice_file_url}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4 p-20 text-center">
                <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center">
                  <LayoutGrid className="w-10 h-10 opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-400">No Document Detected</h3>
                  <p className="text-sm opacity-50 max-w-xs mx-auto">
                    To see a preview here, generate a Surge payment link or upload an invoice PDF.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtle Footer Debug - Collapsible or small */}
        <div className="mt-4 flex justify-center uppercase tracking-[0.2em] font-bold text-[9px] text-zinc-700 gap-4">
          <span>Invoice ID: {invoiceData.id}</span>
          <span>•</span>
          <span>Managed via Basalt Surge</span>
        </div>

      </div>
    </Container>
  );
};

export default InvoiceDetailPage;
