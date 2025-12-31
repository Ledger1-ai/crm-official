// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";

export const metadata = {
    title: "Cookie Policy - BasaltCRM",
    description: "BasaltCRM Cookie Policy.",
};

export default function CookiesPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Cookie Policy</h1>
                        <p className="text-gray-400 mb-12">Last updated: December 1, 2025</p>

                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-12">
                            <section>
                                <p className="lead text-xl text-gray-200">
                                    This Cookie Policy explains how BasaltCRM (&quot;we&quot;, &quot;us&quot;, and &quot;our&quot;) uses cookies and similar technologies to recognize you when you visit our website at https://crm.basalthq.com (&quot;Website&quot;). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. What are cookies?</h2>
                                <p>
                                    Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                                </p>
                                <p className="mt-4">
                                    Cookies set by the website owner (in this case, BasaltCRM) are called &quot;first-party cookies&quot;. Cookies set by parties other than the website owner are called &quot;third-party cookies&quot;. Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. Why do we use cookies?</h2>
                                <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as &quot;essential&quot; or &quot;strictly necessary&quot; cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Website for advertising, analytics, and other purposes.</p>

                                <div className="mt-6 space-y-6">
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-2">Essential Cookies</h3>
                                        <p className="text-sm text-gray-400">These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.</p>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-2">Analytics and Customization Cookies</h3>
                                        <p className="text-sm text-gray-400">These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.</p>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-bold text-white mb-2">Advertising Cookies</h3>
                                        <p className="text-sm text-gray-400">These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. How can I control cookies?</h2>
                                <p>
                                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
                                </p>
                                <p className="mt-4">
                                    You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Updates to this policy</h2>
                                <p>
                                    We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
                                <p>
                                    If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@basalthq.com" className="text-primary hover:underline">privacy@basalthq.com</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
