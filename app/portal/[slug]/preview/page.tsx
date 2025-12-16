/**
 * Portal Preview Page
 * Shows a demo/preview of the portal with sample data for testing branding
 */

import { Metadata } from 'next';
import { prismadb } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MessageViewer from '../m/[token]/MessageViewer';

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return {
        title: 'Portal Preview',
        description: 'Preview your message portal design',
        robots: 'noindex, nofollow',
    };
}

export default async function PortalPreviewPage({ params }: PageProps) {
    const { slug } = params;

    // Find the portal
    const portal = await prismadb.crm_Message_Portal.findUnique({
        where: { portal_slug: slug },
    });

    if (!portal) {
        notFound();
    }

    // Create sample data for preview
    const samplePortal = {
        id: portal.id,
        portal_name: portal.portal_name,
        portal_slug: portal.portal_slug,
        logo_url: portal.logo_url,
        primary_color: portal.primary_color,
        secondary_color: portal.secondary_color,
        welcome_message: portal.welcome_message,
        show_sender_info: portal.show_sender_info,
    };

    const sampleMessage = {
        id: 'preview-msg-001',
        subject: 'Welcome to Your Message Portal',
        body_text: `Thank you for checking out your new message portal! This is a sample message to help you preview how your portal will look to recipients.

Your branding settings are being applied to this preview, including:
• Your portal name and logo
• Primary and secondary colors  
• Welcome message

When you send actual messages via SMS, recipients will click a link that brings them to a page just like this one, styled with your custom branding.

Feel free to adjust your settings and refresh this preview to see changes in real-time.`,
        body_html: `<div>
<p>Thank you for checking out your new message portal! This is a sample message to help you preview how your portal will look to recipients.</p>

<p>Your branding settings are being applied to this preview, including:</p>
<ul>
<li>Your portal name and logo</li>
<li>Primary and secondary colors</li>
<li>Welcome message</li>
</ul>

<p>When you send actual messages via SMS, recipients will click a link that brings them to a page just like this one, styled with your custom branding.</p>

<p>Feel free to adjust your settings and refresh this preview to see changes in real-time.</p>
</div>`,
        mobile_html: null,
        sender_name: 'Your Team',
        sender_email: 'team@example.com',
        sender_avatar: null,
        sentAt: new Date(),
    };

    const sampleRecipient = {
        id: 'preview-recipient-001',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
    };

    return (
        <div className="relative">
            {/* Preview Banner */}
            <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Mode — This is how your portal will appear to message recipients
                </span>
            </div>

            {/* Actual Portal View */}
            <MessageViewer
                portal={samplePortal}
                message={sampleMessage}
                recipient={sampleRecipient}
                deviceType="mobile"
            />
        </div>
    );
}
