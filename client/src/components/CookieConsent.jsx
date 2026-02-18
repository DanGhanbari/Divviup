import React, { useState, useEffect } from 'react';
import { X, Shield, BarChart2, Check } from 'lucide-react';
import clsx from 'clsx';

const CookieConsent = ({ onConsentChange }) => {
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Default consent: Necessary is always true, Analytics is false until accepted
    const [consent, setConsent] = useState(() => {
        const saved = localStorage.getItem('cookie_consent');
        return saved ? JSON.parse(saved) : { necessary: true, analytics: false };
    });

    useEffect(() => {
        const saved = localStorage.getItem('cookie_consent');
        if (!saved) {
            // Show banner if no consent choice has been made yet
            setShowBanner(true);
        } else {
            // Notify parent of initial saved consent
            if (onConsentChange) onConsentChange(JSON.parse(saved));
        }

        // Listen for open settings event
        const handleOpenSettings = () => setShowModal(true);
        window.addEventListener('openCookieSettings', handleOpenSettings);

        return () => window.removeEventListener('openCookieSettings', handleOpenSettings);
    }, [onConsentChange]);

    const saveConsent = (newConsent) => {
        localStorage.setItem('cookie_consent', JSON.stringify(newConsent));
        setConsent(newConsent);
        setShowBanner(false);
        setShowModal(false);
        if (onConsentChange) onConsentChange(newConsent);
    };

    const handleAcceptAll = () => {
        saveConsent({ necessary: true, analytics: true });
    };

    const handleRejectAll = () => {
        saveConsent({ necessary: true, analytics: false });
    };

    const handleSavePreferences = () => {
        saveConsent(consent); // Save current state of toggles
    };

    // Modal Toggles (local state before saving)
    const toggleAnalytics = () => {
        setConsent(prev => ({ ...prev, analytics: !prev.analytics }));
    };

    if (!showBanner && !showModal) return null;

    return (
        <>
            {/* Banner */}
            {showBanner && !showModal && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-[100] animate-in slide-in-from-bottom duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600 flex-1">
                            <p className="font-semibold text-slate-800 mb-1">We value your privacy</p>
                            <p>
                                We use cookies to enhance your browsing experience and analyze our traffic.
                                "Strictly Necessary" cookies are essential for the website to function.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-sm text-slate-600 hover:text-indigo-600 font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                            >
                                Customize
                            </button>
                            <button
                                onClick={handleRejectAll}
                                className="text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg transition"
                            >
                                Reject All
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-4 py-2 rounded-lg transition shadow-sm shadow-indigo-200"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Cookie Preferences</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-sm text-slate-600">
                                Make it yours. Select which cookies you allow us to use. You can change these settings at any time.
                            </p>

                            <div className="space-y-4">
                                {/* Necessary - Always On */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 text-indigo-600">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 text-sm">Strictly Necessary</h3>
                                            <p className="text-xs text-slate-500 mt-1">Required for authentication and security. These cannot be disabled.</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" checked disabled className="sr-only peer" />
                                        <div className="w-11 h-6 bg-indigo-200 peer-checked:bg-indigo-600 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-not-allowed opacity-80"></div>
                                    </div>
                                </div>

                                {/* Analytics - Toggleable */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5 text-blue-500">
                                            <BarChart2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 text-sm">Analytics</h3>
                                            <p className="text-xs text-slate-500 mt-1">Help us improve by allowing us to collect anonymous usage data via Vercel Analytics.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={consent.analytics} onChange={toggleAnalytics} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button
                                onClick={handleRejectAll}
                                className="text-sm text-slate-600 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-200/50 transition"
                            >
                                Reject Optional
                            </button>
                            <button
                                onClick={handleSavePreferences}
                                className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-6 py-2 rounded-lg transition shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CookieConsent;
