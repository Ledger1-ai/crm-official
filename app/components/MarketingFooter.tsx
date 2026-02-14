import Link from "next/link";
import Image from "next/image";
import { prismadb } from "@/lib/prisma";

// Social icon components
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
);

const DiscordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 127.14 96.36" fill="currentColor">
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c2.36-24.44-2-47.27-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const FacebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

const TelegramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const RedditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
);

const ThreadsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.146 3.48-1.208 1.026-.046 1.992.04 2.898.258-.06-.597-.197-1.108-.412-1.533-.283-.56-.715-.987-1.29-1.27-.69-.34-1.576-.51-2.633-.51l-.04.001c-1.794.016-3.004.706-3.695 2.115l-1.773-.945c.479-.896 1.17-1.6 2.054-2.094 1.014-.566 2.217-.862 3.574-.88l.05-.001c1.354 0 2.52.238 3.466.707.974.484 1.707 1.19 2.178 2.098.428.824.658 1.81.686 2.936l.003.14c.003.078.002.186-.001.31 1.05.616 1.86 1.457 2.368 2.472.718 1.434.888 3.893-.898 5.635-1.784 1.74-4.097 2.5-7.27 2.52zm.128-8.132c-1.073.05-1.908.326-2.417.8-.407.38-.594.825-.558 1.325.038.539.36 1.015.905 1.34.603.36 1.377.529 2.243.487 1.11-.06 1.97-.472 2.557-1.227.42-.541.737-1.265.936-2.145-.955-.234-1.962-.343-2.99-.343l-.676.007z" />
    </svg>
);

const MastodonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
    </svg>
);

// Social link config
interface SocialLink {
    url: string | null | undefined;
    label: string;
    icon: React.ReactNode;
    hoverColor: string;
}

/**
 * Public marketing footer used across marketing pages.
 * Dynamically displays social icons from SocialSettings.
 */
export default async function MarketingFooter() {
    const footerSettings = await prismadb.footerSetting.findFirst();
    const socialSettings = await prismadb.socialSettings.findFirst();
    const dbSections = await prismadb.footerSection.findMany({
        include: {
            links: {
                orderBy: { order: "asc" },
            },
        },
        orderBy: { order: "asc" },
    });

    // Ensure Documentation link exists in Support section
    const sections = dbSections.map((section) => {
        if (section.title === "Support") {
            const hasDocs = section.links.some((link) => link.url === "/docs");
            if (!hasDocs) {
                return {
                    ...section,
                    links: [
                        ...section.links,
                        { id: "docs-static", text: "Documentation", url: "/docs", order: 999 },
                    ],
                };
            }
        }
        return section;
    });

    // If no sections found (e.g. fresh DB), add a default Support section
    if (sections.length === 0) {
        sections.push({
            id: "default-support",
            title: "Support",
            order: 1,
            // @ts-ignore - simplified structure for fallback
            links: [
                { id: "docs-static", text: "Documentation", url: "/docs", order: 1 }
            ]
        } as any);
    }

    const tagline = footerSettings?.tagline || "Your 24/7 AI workforce. Sales, Support, and Growth on autopilot.";
    const copyrightText = footerSettings?.copyrightText || "© 2025 BasaltHQ. All rights reserved.";

    // Build social links array from SocialSettings with brand colors
    const socialLinks: SocialLink[] = [
        { url: socialSettings?.xTwitterUrl, label: "X (Twitter)", icon: <XIcon />, hoverColor: "hover:text-white" },
        { url: socialSettings?.discordUrl, label: "Discord", icon: <DiscordIcon />, hoverColor: "hover:text-[#5865F2]" },
        { url: socialSettings?.linkedinUrl, label: "LinkedIn", icon: <LinkedInIcon />, hoverColor: "hover:text-[#0A66C2]" },
        { url: socialSettings?.instagramUrl, label: "Instagram", icon: <InstagramIcon />, hoverColor: "hover:text-[#E4405F]" },
        { url: socialSettings?.facebookUrl, label: "Facebook", icon: <FacebookIcon />, hoverColor: "hover:text-[#1877F2]" },
        { url: socialSettings?.youtubeUrl, label: "YouTube", icon: <YouTubeIcon />, hoverColor: "hover:text-[#FF0000]" },
        { url: socialSettings?.tiktokUrl, label: "TikTok", icon: <TikTokIcon />, hoverColor: "hover:text-[#00F2EA]" },
        { url: socialSettings?.githubUrl, label: "GitHub", icon: <GitHubIcon />, hoverColor: "hover:text-[#8B5CF6]" },
        { url: socialSettings?.telegramUrl, label: "Telegram", icon: <TelegramIcon />, hoverColor: "hover:text-[#26A5E4]" },
        { url: socialSettings?.redditUrl, label: "Reddit", icon: <RedditIcon />, hoverColor: "hover:text-[#FF4500]" },
        { url: socialSettings?.threadsUrl, label: "Threads", icon: <ThreadsIcon />, hoverColor: "hover:text-white" },
        { url: socialSettings?.mastodonUrl, label: "Mastodon", icon: <MastodonIcon />, hoverColor: "hover:text-[#6364FF]" },
    ].filter(link => link.url && link.url.trim() !== "");

    // Fallback to footer settings if no social settings exist
    if (socialLinks.length === 0) {
        const fallbackX = footerSettings?.socialXUrl || "https://x.com/BasaltHQ";
        const fallbackDiscord = footerSettings?.socialDiscordUrl || "https://discord.gg/gcgNugyWkg";
        socialLinks.push(
            { url: fallbackX, label: "X (Twitter)", icon: <XIcon />, hoverColor: "hover:text-white" },
            { url: fallbackDiscord, label: "Discord", icon: <DiscordIcon />, hoverColor: "hover:text-[#5865F2]" }
        );
    }

    return (
        <footer className="w-full bg-[#0F0F1A] text-[#94A3B8] font-sans border-t border-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
                {/* Main Footer - Logo left, Nav sections right */}
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-0">

                    {/* Logo & Tagline - Left side */}
                    <div className="flex flex-col items-center lg:items-start space-y-4 lg:w-1/4 lg:pr-8">
                        <Link href="/" className="flex items-center gap-2" aria-label="BasaltHQ Home">
                            <Image
                                src="/BasaltCRMWide.png"
                                alt="BasaltHQ Logo"
                                width={150}
                                height={40}
                                className="object-contain h-12 w-auto brightness-200 contrast-125"
                            />
                        </Link>
                        <p className="text-sm text-center lg:text-left leading-relaxed max-w-[200px]">
                            {tagline}
                        </p>
                    </div>

                    {/* Navigation Sections - Right side, evenly spaced */}
                    <div className="flex flex-wrap sm:flex-nowrap justify-center lg:justify-between lg:flex-1 gap-8 sm:gap-12 lg:gap-8">
                        {sections.map((section) => (
                            <div key={section.id} className="flex flex-col items-center lg:items-start space-y-3 min-w-[100px]">
                                <h3 className="text-white font-semibold text-sm">{section.title}</h3>
                                <ul className="flex flex-col items-center lg:items-start space-y-2 text-sm">
                                    {section.links.map((link) => (
                                        <li key={link.id}>
                                            <Link href={link.url} className="hover:text-white transition-colors">
                                                {link.text}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Socials & Copyright */}
                <div className="mt-10 pt-8 border-t border-gray-800/50 flex flex-col items-center space-y-5">
                    {/* Social Icons */}
                    <div className="flex items-center flex-wrap justify-center gap-5">
                        {socialLinks.map((social, index) => (
                            <a
                                key={index}
                                href={social.url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Follow BasaltHQ on ${social.label}`}
                                className={`text-white/70 ${social.hoverColor} hover:scale-110 transition-all duration-200`}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-[#647084]">
                        {copyrightText}
                    </p>
                </div>
            </div>
        </footer>
    );
}
