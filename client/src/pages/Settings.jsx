import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, Star, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import api from '../api';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

const Settings = () => {
    const { user, refreshUser } = useAuth();
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await api.post('/auth/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setMessage('Password updated successfully');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancel Subscription',
            message: 'Are you sure you want to cancel your Premium subscription? You will retain access until the end of your billing period.',
            type: 'danger',
            confirmText: 'Yes, Cancel',
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await api.post('/payments/cancel-subscription');
                    await refreshUser();
                    setMessage('Subscription canceled. You have access until the end of the period.');
                } catch (err) {
                    console.error(err);
                    setError(err.response?.data?.error || 'Failed to cancel subscription');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>

            {/* Subscription Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Subscription</h2>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                            <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                {user?.plan === 'premium' ? (
                                    <>
                                        Premium <Star size={20} className="text-yellow-500 fill-yellow-500" />
                                    </>
                                ) : (
                                    'Free'
                                )}
                            </div>
                        </div>
                        {user?.plan === 'premium' && user?.subscription_status === 'active' ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Active
                            </span>
                        ) : user?.plan === 'premium' && user?.subscription_status === 'canceled' ? (
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Canceled
                            </span>
                        ) : (
                            <Link to="/dashboard/pricing" className="text-indigo-600 font-medium hover:underline text-sm">
                                Upgrade to Premium
                            </Link>
                        )}
                    </div>

                    {user?.plan === 'premium' && (
                        <div className="border-t border-slate-200 pt-4 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-slate-500 mb-1">Member Since</p>
                                    <p className="font-medium text-slate-800">{formatDate(user?.created_at || new Date())}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 mb-1">
                                        {user?.subscription_status === 'canceled' ? 'Expires On' : 'Next Billing Date'}
                                    </p>
                                    <p className="font-medium text-slate-800">{formatDate(user?.current_period_end)}</p>
                                </div>
                            </div>

                            {user?.subscription_status === 'active' && (
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    Cancel Subscription
                                </button>
                            )}

                            {user?.subscription_status === 'canceled' && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                                    <AlertTriangle size={12} />
                                    Your subscription will reset to Free on {formatDate(user?.current_period_end)}.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            name="oldPassword"
                            value={passwords.oldPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            minLength="6"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            minLength="6"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </form>
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

export default Settings;
