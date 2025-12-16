/**
 * Public Message Portal - Magic Link Message View
 * Accessed via SMS link: /portal/{slug}/m/{token}
 * Shows the message content in a mobile-optimized, responsive view
 */

import { Metadata } from 'next';
import { prismadb } from '@/lib/prisma';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import crypto from 'crypto';
import MessageViewer from './MessageViewer';

interface PageProps {
    params: { slug: string; token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const portal = await prismadb.crm_Message_Portal.findUnique({
        where: { portal_slug: params.slug },
        select: { portal_name: true },
    });

    return {
        title: portal?.portal_name || 'Message Portal',
        description: 'View your secure message',
        robots: 'noindex, nofollow', // Don't index private messages
    };
}

export default async function MessagePortalPage({ params }: PageProps) {
    const { slug, token } = params;

    // Find the recipient by access token
    const recipient = await prismadb.crm_Portal_Recipient.findUnique({
        where: { access_token: token },
        include: {
            assigned_portal: true,
        },
    });

    if (!recipient || recipient.assigned_portal.portal_slug !== slug) {
        notFound();
    }

    // Check if opted out
    if (recipient.is_opted_out) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md text-center">
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">
                        You've Opted Out
                    </h1>
                    <p className="text-gray-600">
                        You have previously opted out of receiving messages from this portal.
                        If you'd like to re-subscribe, please contact the sender.
                    </p>
                </div>
            </div>
        );
    }

    const portal = recipient.assigned_portal;

    // Get the most recent message for this recipient
    const messageLink = await prismadb.crm_Portal_Message_Recipient.findFirst({
        where: { recipient: recipient.id },
        orderBy: { createdAt: 'desc' },
        include: {
            assigned_message: true,
        },
    });

    if (!messageLink) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md text-center">
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">
                        No Messages Yet
                    </h1>
                    <p className="text-gray-600">
                        You don't have any messages in your {portal.portal_name || 'Message Portal'} inbox yet.
                    </p>
                </div>
            </div>
        );
    }

    const message = messageLink.assigned_message;

    // Track this view
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for') || '';
    const ipHash = forwardedFor
        ? crypto.createHash('sha256').update(forwardedFor.split(',')[0]).digest('hex').substring(0, 16)
        : null;

    // Detect device type
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Record the view
    await prismadb.crm_Portal_Message_View.create({
        data: {
            message: message.id,
            recipient_email: recipient.email,
            access_token: token,
            device_type: deviceType,
            user_agent: userAgent.substring(0, 500),
            ip_hash: ipHash,
        },
    });

    // Update recipient stats
    await prismadb.crm_Portal_Recipient.update({
        where: { id: recipient.id },
        data: {
            last_accessed: new Date(),
            access_count: { increment: 1 },
        },
    });

    // Update message-recipient link
    const now = new Date();
    await prismadb.crm_Portal_Message_Recipient.update({
        where: { id: messageLink.id },
        data: {
            first_viewed_at: messageLink.first_viewed_at || now,
            view_count: { increment: 1 },
        },
    });

    return (
        <MessageViewer
            portal={portal}
            message={message}
            recipient={recipient}
            deviceType={deviceType}
        />
    );
}
