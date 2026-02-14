// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";

export const metadata = {
    title: "Privacy Policy - BasaltCRM",
    description: "BasaltCRM Privacy Policy.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
                        <p className="text-gray-400 mb-12">Last updated: December 1, 2025</p>

                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-12">
                            <section>
                                <p className="lead text-xl text-gray-200">
                                    At BasaltCRM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our software, or engage with our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                                <p>We collect information that you provide directly to us, as well as information collected automatically when you use our services.</p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-2">1.1 Information You Provide</h3>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Account Information:</strong> Name, email address, password, company name, and phone number when you register.</li>
                                    <li><strong>Payment Information:</strong> Credit card details and billing address (processed by our secure payment provider, Stripe).</li>
                                    <li><strong>Customer Data:</strong> Data you input into the CRM, including lead details, contacts, and sales data. You retain full ownership of this data.</li>
                                    <li><strong>Support Communications:</strong> Information you provide when contacting our support team.</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-2">1.2 Information Collected Automatically</h3>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and clickstream data.</li>
                                    <li><strong>Device Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
                                    <li><strong>Cookies:</strong> We use cookies to maintain your session and analyze usage patterns (see our Cookie Policy).</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                                <p>We use the collected information for the following purposes:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>To provide, operate, and maintain our services.</li>
                                    <li>To process transactions and manage your account.</li>
                                    <li>To improve, personalize, and expand our services.</li>
                                    <li>To communicate with you, including for customer service, updates, and marketing (you can opt-out of marketing).</li>
                                    <li>To detect and prevent fraud and abuse.</li>
                                    <li>To comply with legal obligations.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing and Disclosure</h2>
                                <p>We do not sell your personal data. We may share your information in the following circumstances:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., hosting, payment processing, email delivery).</li>
                                    <li><strong>Legal Requirements:</strong> If required to do so by law or in response to valid requests by public authorities.</li>
                                    <li><strong>Business Transfers:</strong> In connection with a merger, sale of assets, or acquisition.</li>
                                    <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                                <p>
                                    We implement robust security measures to protect your data, including AES-256 encryption at rest and TLS 1.3 in transit.
                                    However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">5. Your Data Rights</h2>
                                <p>Depending on your location, you may have the following rights:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                                    <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
                                    <li><strong>Deletion:</strong> Request deletion of your personal data (&quot;Right to be Forgotten&quot;).</li>
                                    <li><strong>Portability:</strong> Request transfer of your data to another service.</li>
                                </ul>
                                <p className="mt-4">To exercise these rights, please contact us at <a href="mailto:legal@basalthq.com" className="text-primary hover:underline">legal@basalthq.com</a>.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">6. International Transfers</h2>
                                <p>
                                    Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ.
                                    We ensure appropriate safeguards are in place for such transfers.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">7. Changes to This Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy, please contact us at:
                                </p>
                                <p className="mt-2">
                                    <strong>Email:</strong> <a href="mailto:legal@basalthq.com" className="text-primary hover:underline">legal@basalthq.com</a><br />
                                    <strong>Address:</strong> 123 AI Boulevard, San Francisco, CA 94105, USA
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
