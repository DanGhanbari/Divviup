import React, { useEffect, useState } from 'react';
import CurrencyPicker from '../components/CurrencyPicker';
import api from '../api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import ConfirmationModal from '../components/ConfirmationModal';

const Dashboard = () => {
    const { refreshUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', confirmText: 'Confirm', onConfirm: null });
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newGroupCurrency, setNewGroupCurrency] = useState('USD');

    const fetchGroups = async () => {
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();

        if (searchParams.get('success') === 'true') {
            refreshUser();
            // Clean up URL
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, refreshUser, navigate]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups', {
                name: newGroupName,
                description: newGroupDesc,
                currency: newGroupCurrency
            });
            setShowModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            setNewGroupCurrency('USD');
            fetchGroups();
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 403 && err.response.data.error.includes('Free plan limit')) {
                setShowModal(false);
                setConfirmModal({
                    isOpen: true,
                    title: 'Free Plan Limit Reached',
                    message: 'You have reached the maximum number of groups allowed on the Free plan. Upgrade to Premium to create unlimited groups.',
                    confirmText: 'Upgrade now',
                    type: 'warning',
                    onConfirm: () => window.location.href = '/dashboard/pricing'
                });
            } else {
                alert('Failed to create group. Please try again.');
            }
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Group',
            message: `Are you sure you want to delete "${groupName}"? This action cannot be undone and will delete all associated expenses and tasks.`,
            confirmText: 'Delete Group',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${groupId}`);
                    fetchGroups();
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete group');
                }
            }
        });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading groups...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Your Groups</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                    <Plus size={20} /> Create Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No groups yet</h3>
                    <p className="text-slate-500 mb-6">Create a group to start sharing expenses and tasks.</p>
                    <button onClick={() => setShowModal(true)} className="text-indigo-600 font-medium hover:underline">
                        Create your first group
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="relative group block h-full">
                            <Link to={`groups/${group.id}`} className="block h-full">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition h-full flex flex-col relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
                                            <Users size={24} />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${group.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {group.role}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition">{group.name}</h3>
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow">{group.description || 'No description'}</p>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <div className="flex items-center text-slate-400 text-sm gap-2">
                                            <Calendar size={14} /> Created {new Date(group.created_at).toLocaleDateString()}
                                        </div>
                                        {group.role === 'owner' && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteGroup(group.id, group.name);
                                                }}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition flex items-center gap-1 font-medium text-xs sm:text-sm z-10"
                                                title="Delete Group"
                                            >
                                                <Trash2 size={16} /> Delete Group
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Basic Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Group Name"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                            <textarea
                                placeholder="Description (optional)"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows="3"
                                value={newGroupDesc}
                                onChange={(e) => setNewGroupDesc(e.target.value)}
                            />
                            <div>
                                <CurrencyPicker
                                    selectedCurrency={newGroupCurrency}
                                    onSelect={setNewGroupCurrency}
                                    label="Group Currency"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
};

export default Dashboard;
