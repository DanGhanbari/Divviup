import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import ConfirmationModal from '../components/ConfirmationModal';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Pricing = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const session = await response.json();

            if (response.ok) {
                window.location.href = session.url;
            } else {
                console.error('Failed to create checkout session');
                alert('Failed to initiate upgrade. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Downgrade',
            message: 'Are you sure you want to downgrade to Free? You will retain Premium access until the end of your billing period.',
            type: 'warning',
            confirmText: 'Yes, Downgrade',
            onConfirm: async () => {
                setLoading(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/cancel-subscription`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (response.ok) {
                        await refreshUser();
                        alert('Subscription canceled. You will be downgraded at the end of the billing period.');
                    } else {
                        alert('Failed to cancel subscription.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred.');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Choose Your Plan</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Free Plan */}
                <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Free</h2>
                    <p className="text-4xl font-bold text-gray-900 mb-6">$0<span className="text-xl text-gray-500 font-normal">/mo</span></p>
                    <ul className="flex-1 space-y-4 mb-8">
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            1 Group
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            1 Member per Group
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Equal Splits
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            2 Tasks per Group
                        </li>
                    </ul>
                    {user?.plan === 'premium' ? (
                        user?.subscription_status === 'active' ? (
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors"
                            >
                                {loading ? 'Processing...' : 'Downgrade to Free'}
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                                Downgrade Scheduled ({formatDate(user?.current_period_end)})
                            </button>
                        )
                    ) : (
                        <button disabled className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                            Current Plan
                        </button>
                    )}
                </div>

                {/* Premium Plan */}
                <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col border-2 border-indigo-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Premium</h2>
                    <p className="text-4xl font-bold text-gray-900 mb-6">$5<span className="text-xl text-gray-500 font-normal">/mo</span></p>
                    <ul className="flex-1 space-y-4 mb-8">
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Unlimited Groups
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Unlimited Members
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Unlimited Tasks
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Export Reports
                        </li>
                        <li className="flex items-center text-gray-600">
                            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Advanced Split Types (Coming Soon)
                        </li>
                    </ul>
                    {user?.plan === 'premium' ? (
                        user?.subscription_status === 'active' ? (
                            <button disabled className="w-full py-3 px-4 bg-indigo-100 text-indigo-700 font-semibold rounded-lg cursor-default">
                                Active Plan
                            </button>
                        ) : (
                            <button disabled className="w-full py-3 px-4 bg-yellow-100 text-yellow-700 font-semibold rounded-lg cursor-default">
                                Expires on {formatDate(user?.current_period_end)}
                            </button>
                        )
                    ) : (
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex justify-center items-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Upgrade Now'}
                        </button>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
};

export default Pricing;
