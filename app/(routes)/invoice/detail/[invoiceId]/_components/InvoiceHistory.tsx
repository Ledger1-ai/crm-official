
import React from 'react';
import { CheckCircle2, Clock, Globe, Link2, Mail, MessageSquare, Plus, Zap, Send } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryItem {
    id: string;
    action: string;
    details: string;
    timestamp: Date;
    status: 'success' | 'pending' | 'info';
    icon: any;
}

interface InvoiceHistoryProps {
    invoice: any;
    activities?: any[];
}

export const InvoiceHistory = ({ invoice, activities = [] }: InvoiceHistoryProps) => {
    // Generate synthetic history based on invoice state
    const syntheticHistory: HistoryItem[] = [
        {
            id: 'create',
            action: 'Invoice Created',
            details: `Invoice #${invoice.invoice_number || invoice.id.substring(0, 8)} was registered.`,
            timestamp: new Date(invoice.date_created),
            status: 'success',
            icon: Plus
        }
    ];

    if (invoice.surge_payment_id) {
        syntheticHistory.push({
            id: 'surge-init',
            action: 'Portal Activated',
            details: 'Surge payment link generated and secured.',
            timestamp: new Date(invoice.last_updated),
            status: 'info',
            icon: Globe
        });
    }

    if (invoice.payment_status === "PAID") {
        syntheticHistory.push({
            id: 'paid',
            action: 'Payment Settled',
            details: 'Confirmed via Apple Pay / Crypto. Settled on Base Mainnet.',
            timestamp: new Date(invoice.last_updated),
            status: 'success',
            icon: Zap
        });
    }

    // Merge with real activities
    const realHistory: HistoryItem[] = activities.map((a: any) => ({
        id: a.id,
        action: a.action,
        details: `${a.user}: ${a.details || ''}`,
        timestamp: new Date(a.timestamp),
        status: 'info',
        icon: a.action.toLowerCase().includes('send') ? Send : Globe
    }));

    const sortedHistory = [...syntheticHistory, ...realHistory]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="space-y-6">
                {sortedHistory.map((item, index) => (
                    <div key={item.id} className="relative pl-8 group">
                        {/* Timeline Line */}
                        {index !== sortedHistory.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-zinc-800" />
                        )}

                        {/* Status Icon */}
                        <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-zinc-950 transition-colors ${item.status === 'success' ? 'border-green-500 text-green-500' :
                            item.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                                'border-blue-500 text-blue-500'
                            }`}>
                            <item.icon className="w-3 h-3" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                    {item.action}
                                </h4>
                                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                                    {format(item.timestamp, 'HH:mm • MMM d, yyyy')}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                {item.details}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State placeholder for actual comments */}
            <div className="mt-8 pt-8 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Internal Discussion</h4>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-8 border border-zinc-800 border-dashed flex flex-col items-center justify-center text-center">
                    <Clock className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">No comments yet. Start a discussion with your team about this invoice.</p>
                </div>
            </div>
        </div>
    );
};
