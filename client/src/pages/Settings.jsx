import React, { useState } from 'react';
import api from '../api';
import { Lock, Save } from 'lucide-react';

const Settings = () => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 6) {
            setStatus({ type: 'error', message: 'New password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            setStatus({ type: 'success', message: 'Password updated successfully!' });
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Lock size={20} className="text-indigo-600" />
                        Change Password
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Update your password to keep your account secure.</p>
                </div>

                <div className="p-6">
                    {status.message && (
                        <div className={`p-4 rounded-lg mb-6 ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.oldPassword}
                                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Update Password</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
