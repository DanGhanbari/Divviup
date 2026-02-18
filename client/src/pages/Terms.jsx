import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { SUPPORT_EMAIL } from '../constants';

const Terms = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/Divviup-logo.svg" alt="DivviUp Logo" className="w-8 h-8 object-contain" />
                        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">DivviUp</Link>
                    </div>
                    <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-6">
                        <FileText size={24} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Terms and Conditions</h1>
                    <p className="text-slate-500 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <div className="prose-none space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">01.</span> Introduction
                            </h2>
                            <p className="mb-4">
                                Welcome to DivviUp. By accessing or using our website, mobile application, and related services (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms") and our Privacy Policy. If you disagree with any part of the terms, then you may not access the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">02.</span> Subscription Services & Payments
                            </h2>
                            <p className="mb-4">
                                DivviUp offers premium features via subscription. By subscribing, you agree to recurring billing.
                            </p>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">2.1. Billing and Processing</h3>
                            <p className="mb-4">
                                We use Stripe, a third-party payment processor, to handle financial transactions. Some subscriptions may also be managed via Apple App Store or Google Play Store. Billing cycles are set either on a monthly or annual basis, depending on the plan selected.
                            </p>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">2.2. Cancellations and Refunds</h3>
                            <p>
                                Cancellations must be managed through the platform where the subscription was purchased (e.g., your DivviUp account settings, Apple App Store, or Google Play Store). Cancellation does not entitle the user to pro-rated refunds unless required by local law. You will continue to have access to the Service through the end of your billing period.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">03.</span> AI Services & Data Tools
                            </h2>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">3.1. AI Scanning & Data Accuracy</h3>
                            <p className="mb-4">
                                DivviUp utilizes Optical Character Recognition (OCR) and Artificial Intelligence to process receipts. While we strive for 100% accuracy, we do not guarantee it. Users are responsible for verifying all scanned data before finalizing splits or generating reports. DivviUp is not liable for financial discrepancies resulting from unverified scans.
                            </p>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">3.2. Advanced Split Sharing</h3>
                            <p>
                                The "Advanced Split" feature is a tool for calculation. DivviUp is not a payment processor or a bank. We are not responsible for the failure of third parties to pay their share or for disputes arising between users regarding split amounts.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">04.</span> User Conduct & Accounts
                            </h2>
                            <p className="mb-4">
                                You agree to use the Service only for lawful purposes. You are responsible for maintaining the security of your account and password and for providing accurate information. You agree not to use the Service for any illegal or unauthorized purpose.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">05.</span> Intellectual Property
                            </h2>
                            <p className="mb-4">
                                All generated PDF reports, the DivviUp logo, AI algorithms, and the Service's original content are the exclusive property of DivviUp and its licensors.
                            </p>
                            <p>
                                Users are granted a limited license to download and share their personal reports for non-commercial use. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">06.</span> Termination
                            </h2>
                            <p>
                                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">07.</span> Changes to Terms
                            </h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                            </p>
                        </section>

                        <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Have questions?</h2>
                            <p className="text-sm text-slate-600 mb-4">
                                If you have any questions about these Terms, please contact us.
                            </p>
                            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 font-medium hover:underline text-sm">{SUPPORT_EMAIL}</a>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t border-slate-200 bg-white py-8 mt-12">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} DivviUp. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-indigo-600 transition-colors font-medium text-slate-900">Terms & Conditions</Link>
                        <span className="cursor-pointer hover:text-indigo-600 transition-colors">Cookie Settings</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Terms;
