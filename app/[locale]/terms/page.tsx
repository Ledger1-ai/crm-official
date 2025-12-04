import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

export const metadata = {
    title: "Terms of Service - Ledger1CRM",
    description: "Ledger1CRM Terms of Service.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main className="py-20 md:py-32">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-gray-400 mb-12">Last updated: December 1, 2025</p>

                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-12">
                        <section>
                            <p className="lead text-xl text-gray-200">
                                Please read these Terms of Service (&quot;Terms&quot;) carefully before using the Ledger1CRM website and services operated by Ledger1CRM (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;). By accessing or using our Service, you agree to be bound by these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Accounts</h2>
                            <p>
                                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                            <p className="mt-4">
                                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Subscriptions and Payments</h2>
                            <h3 className="text-xl font-semibold text-white mt-6 mb-2">2.1 Fees</h3>
                            <p>
                                Some parts of the Service are billed on a subscription basis (&quot;Subscription(s)&quot;). You will be billed in advance on a recurring and periodic basis (such as monthly or annually).
                            </p>
                            <h3 className="text-xl font-semibold text-white mt-6 mb-2">2.2 Free Trial</h3>
                            <p>
                                We may, at our sole discretion, offer a Subscription with a free trial for a limited period of time. You may be required to enter your billing information in order to sign up for the free trial.
                            </p>
                            <h3 className="text-xl font-semibold text-white mt-6 mb-2">2.3 Cancellation</h3>
                            <p>
                                You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Intellectual Property</h2>
                            <p>
                                The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Ledger1CRM and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. User Content</h2>
                            <p>
                                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (&quot;Content&quot;). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                            </p>
                            <p className="mt-4">
                                By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use</h2>
                            <p>You agree not to use the Service:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>In any way that violates any applicable national or international law or regulation.</li>
                                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                                <li>To transmit, or procure the sending of, any advertising or promotional material, including any &quot;junk mail&quot;, &quot;chain letter,&quot; &quot;spam,&quot; or any other similar solicitation.</li>
                                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                            <p>
                                In no event shall Ledger1CRM, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. Termination</h2>
                            <p>
                                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of California, United States, without regard to its conflict of law provisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">9. Changes</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at <a href="mailto:legal@ledger1crm.com" className="text-primary hover:underline">legal@ledger1crm.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
