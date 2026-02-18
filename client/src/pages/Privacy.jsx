import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { SUPPORT_EMAIL } from '../constants';

const Privacy = () => {
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
                        <Lock size={24} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-slate-500 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <div className="prose-none space-y-8 text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">01.</span> Information Collection
                            </h2>
                            <p className="mb-4">
                                We collect information you provide directly to us, such as when you create an account, update your profile, or use our services.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-indigo-300">
                                <li><strong>Images:</strong> We collect photos of receipts you upload for the purpose of AI scanning.</li>
                                <li><strong>Financial Data:</strong> Item names, prices, and tax information extracted from your receipts.</li>
                                <li><strong>Usage Data:</strong> How you interact with the "Advanced Split" and "PDF Export" features.</li>
                                <li><strong>Account Info:</strong> Name, email address, and profile picture.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">02.</span> AI Processing & Data Retention
                            </h2>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">2.1. AI Processing & Third Parties</h3>
                            <p className="mb-4">
                                To provide the scanning service, DivviUp may transmit receipt images to third-party AI/OCR sub-processors. This data is used solely to extract text and is not sold to advertisers. We ensure all sub-processors maintain industry-standard encryption (AES-256).
                            </p>
                            <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2">2.2. Data Retention</h3>
                            <p className="mb-4">
                                We retain your receipt data and PDF reports for as long as your account is active. Users may delete their data at any time through the app settings, which will result in the permanent removal of associated receipt images from our servers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">03.</span> Payment Information
                            </h2>
                            <p className="mb-4">
                                We do not store credit card numbers on our servers. All transactions are handled securely by our payment processors, including Stripe, Apple (App Store), or Google (Play Store).
                            </p>
                            <p>
                                When you purchase a subscription, the payment processor collects the necessary personal information. We only receive a confirmation that the payment was successful and limited information (like the last 4 digits of your card) to help you manage your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">04.</span> Data Security
                            </h2>
                            <p>
                                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. We use industry-standard encryption for data transmission and storage.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="text-indigo-600 text-lg">05.</span> Cookies
                            </h2>
                            <p>
                                We use cookies and similar tracking technologies to track the activity on our Service and hold certain information to improve your experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                            </p>
                        </section>

                        <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Have questions?</h2>
                            <p className="text-sm text-slate-600 mb-4">
                                If you have any questions about this Privacy Policy, please contact us.
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
                        <Link to="/privacy" className="hover:text-indigo-600 transition-colors font-medium text-slate-900">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms & Conditions</Link>
                        <span className="cursor-pointer hover:text-indigo-600 transition-colors">Cookie Settings</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Privacy;
