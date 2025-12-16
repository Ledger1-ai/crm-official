/**
 * Portal Landing Page - /portal/[slug]
 * Shows portal branding and prompts for phone number to verify identity
 */

import { prismadb } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PortalLanding from "./PortalLanding";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    const portal = await (prismadb.crm_Message_Portal as any).findFirst({
        where: { portal_slug: slug },
        select: { portal_name: true, welcome_message: true, logo_url: true },
    });

    if (!portal) {
        return {
            title: "Portal Not Found",
        };
    }

    return {
        title: portal.portal_name || "Message Portal",
        description: portal.welcome_message || "Secure message viewing portal",
        openGraph: {
            title: portal.portal_name || "Message Portal",
            description: portal.welcome_message || "Secure message viewing portal",
            images: portal.logo_url ? [portal.logo_url] : [],
        },
    };
}

export default async function PortalPage({ params }: Props) {
    const { slug } = await params;

    // Fetch portal configuration
    const portal = await (prismadb.crm_Message_Portal as any).findFirst({
        where: { portal_slug: slug },
        select: {
            id: true,
            portal_name: true,
            portal_slug: true,
            welcome_message: true,
            logo_url: true,
            primary_color: true,
            secondary_color: true,
            accent_color: true,
            theme_mode: true,
            dark_primary_color: true,
            dark_secondary_color: true,
            dark_accent_color: true,
            enable_glass_effect: true,
            background_blur: true,
        },
    });

    if (!portal) {
        notFound();
    }

    return <PortalLanding portal={portal} />;
}
