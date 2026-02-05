import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Users, DollarSign, CheckSquare, Plus, Send, UserPlus, Scale, Trash2, Euro, PoundSterling, Pencil, FileText, Camera, Paperclip, X, Upload } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('expenses');
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

    // Refs for file inputs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Forms
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', split_type: 'equal', splits: {}, receipt: null, existingReceipt: null });
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const fetchData = async () => {
        try {
            const groupRes = await api.get(`/groups/${id}`);
            setGroup(groupRes.data);

            const expensesRes = await api.get(`/groups/${id}/expenses`);
            setExpenses(expensesRes.data);

            const tasksRes = await api.get(`/groups/${id}/tasks`);
            setTasks(tasksRes.data);

            const balancesRes = await api.get(`/groups/${id}/balances`);
            setBalances(balancesRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [viewReceiptUrl, setViewReceiptUrl] = useState(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        init();

        // Connect to socket
        socket.connect();
        socket.emit('join_group', id);

        // Listen for updates
        socket.on('group_updated', (data) => {
            if (data.groupId == id) {
                console.log('Received group update:', data);
                fetchData();
            }
        });

        return () => {
            socket.emit('leave_group', id);
            socket.off('group_updated');
            socket.disconnect();
        };
    }, [id]);

    const [editingExpenseId, setEditingExpenseId] = useState(null);

    // ... (fetchData and useEffect remain same)

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        try {
            // Format splits
            let formattedSplits = [];
            if (newExpense.split_type === 'percentage') {
                const totalPercentage = Object.values(newExpense.splits).reduce((a, b) => a + (parseFloat(b) || 0), 0);
                if (Math.abs(totalPercentage - 100) > 0.1) {
                    alert(`Percentages must sum to 100%. Current sum: ${totalPercentage}%`);
                    return;
                }

                formattedSplits = group.members.map(m => ({
                    user_id: m.id,
                    amount: (newExpense.amount * ((newExpense.splits[m.id] || 0) / 100)).toFixed(2)
                }));
            }

            // Create FormData
            const formData = new FormData();
            formData.append('title', newExpense.title);
            formData.append('amount', newExpense.amount);
            formData.append('split_type', newExpense.split_type);
            if (newExpense.paid_by) formData.append('paid_by', newExpense.paid_by);
            if (newExpense.receipt) formData.append('receipt', newExpense.receipt);

            // Append splits as JSON string
            if (formattedSplits.length > 0) {
                formData.append('splits', JSON.stringify(formattedSplits));
            }

            // Important: api client should let browser set Content-Type header for FormData

            if (editingExpenseId) {
                await api.put(`/groups/${id}/expenses/${editingExpenseId}`, formData);
            } else {
                await api.post(`/groups/${id}/expenses`, formData);
            }

            setShowExpenseModal(false);
            setNewExpense({ title: '', amount: '', split_type: 'equal', splits: {}, receipt: null, existingReceipt: null });
            setEditingExpenseId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to save expense');
        }
    };

    const handleEditExpense = async (expense) => {
        try {
            // 1. Set ID immediately so UI reacts
            setEditingExpenseId(expense.id);

            // 2. Fetch full details (including splits)
            const res = await api.get(`/groups/${id}/expenses/${expense.id}`);
            const fullExpense = res.data;

            // 3. Map splits to the format expected by state
            let splitsState = {};
            if (fullExpense.split_type === 'percentage') {
                // Convert amounts back to percentages
                // Formula: (split_amount / total_amount) * 100
                fullExpense.splits.forEach(s => {
                    splitsState[s.user_id] = ((parseFloat(s.amount_due) / parseFloat(fullExpense.amount)) * 100).toFixed(0);
                    // Using toFixed(0) for cleaner UI, or (2) if precise. start with 0.
                });
            }

            setNewExpense({
                title: fullExpense.title,
                amount: fullExpense.amount,
                split_type: fullExpense.split_type,
                paid_by: fullExpense.paid_by, // Preserve the original payer
                splits: splitsState,
                receipt: null, // Reset file input
                existingReceipt: fullExpense.receipt_path // Store path for display
            });

            setShowExpenseModal(true);
        } catch (err) {
            console.error(err);
            alert("Failed to load expense details");
            setEditingExpenseId(null);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        try {
            const res = await api.post(`/groups/${id}/tasks`, { title: newTaskTitle });
            setTasks([res.data, ...tasks]);
            setNewTaskTitle('');
        } catch (err) {
            console.error(err);
            alert('Failed to add task');
        }
    };

    const toggleTask = async (taskId) => {
        try {
            const res = await api.patch(`/groups/${id}/tasks/${taskId}/toggle`);
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
        } catch (err) {
            console.error(err);
            alert('Failed to update task');
        }
    };

    const handleClaimTask = async (taskId) => {
        try {
            // If already assigned to current user, unclaim (assigned_to = null)
            // If not assigned, claim (assigned_to = user.id)
            // Logic: Find task, check assignment.
            const task = tasks.find(t => t.id === taskId);
            const isAssignedToMe = task.assigned_to === user.id;

            const payload = {
                assigned_to: isAssignedToMe ? null : user.id
            };

            const res = await api.patch(`/groups/${id}/tasks/${taskId}/assign`, payload);

            // Backend returns the updated task with assigned_to_name
            // We need to update the state
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));

        } catch (err) {
            console.error(err);
            alert('Failed to claim/unclaim task');
        }
    };

    const handleSendInvitation = async () => {
        try {
            const emailToSend = newMemberEmail;
            await api.post(`/groups/${id}/invite`, { email: emailToSend });
            setShowAddMemberModal(false);
            setNewMemberEmail('');

            setConfirmModal({
                isOpen: true,
                title: 'Invitation Sent',
                message: `An email invitation has been successfully sent to ${emailToSend}.`,
                type: 'success',
                confirmText: 'OK',
                onConfirm: () => { } // Just close
            });
            fetchData(); // Refresh to show pending member
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to send invitation');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();

        const performAddMember = async () => {
            try {
                await api.post(`/groups/${id}/members`, { email: newMemberEmail });
                setShowAddMemberModal(false);
                setNewMemberEmail('');
                fetchData(); // Refresh to show new member
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 404 && err.response.data.error === 'User not found') {
                    // User doesn't exist, prompt to invite
                    setConfirmModal({
                        isOpen: true,
                        title: 'User Not Found',
                        message: 'This user has not signed up for DivviUp yet. Would you like to send them an email invitation?',
                        type: 'info',
                        confirmText: 'Send Invitation',
                        onConfirm: handleSendInvitation
                    });
                    // Don't close the add member modal yet in case they cancel
                    return;
                }
                alert(err.response?.data?.error || 'Failed to add member');
            }
        };

        if (expenses.length > 0) {
            setConfirmModal({
                isOpen: true,
                title: 'Add New Member?',
                message: 'Warning: Adding a new member will automatically recalculate shares for all existing "Equal" split expenses to include them. Expenses with "Percentage" splits will remain unchanged and may need manual adjustment.',
                type: 'warning',
                confirmText: 'Add Member & Recalculate',
                onConfirm: performAddMember
            });
        } else {
            performAddMember();
        }
    };

    const handleExportReport = async () => {
        try {
            const response = await api.get(`/groups/${id}/report`, {
                responseType: 'blob', // Important for download
            });

            // Create a blob link to download
            // Axios returns a Blob if responseType is blob, so we can use it directly or wrap it.
            // Explicitly setting type to zip or letting it default.
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GroupReport_${group.name.replace(/\s+/g, '_')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to generate report');
        }
    };


    const handleDeleteExpense = (expenseId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Expense',
            message: 'Are you sure you want to delete this expense? This action cannot be undone and will affect balances.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${id}/expenses/${expenseId}`);
                    setExpenses(expenses.filter(e => e.id !== expenseId));
                    fetchData(); // Refresh balances
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete expense');
                }
            }
        });
    };

    const handleDeleteTask = (taskId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Task',
            message: 'Are you sure you want to delete this task?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${id}/tasks/${taskId}`);
                    setTasks(tasks.filter(t => t.id !== taskId));
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete task');
                }
            }
        });
    };

    const handleDeleteGroup = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Group',
            message: 'WARNING: This will permanently delete the group and ALL associated data (members, expenses, tasks). This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Group',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${id}`);
                    navigate('/'); // Root is the dashboard
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete group');
                }
            }
        });
    };

    const isOwner = group?.members.find(m => m.id === user?.id)?.role === 'owner';
    const isAdmin = group?.members.find(m => m.id === user?.id)?.role === 'admin';
    const canExport = isOwner || isAdmin;

    const handleRemoveMember = (memberId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Member',
            message: 'Are you sure you want to remove this member? They will lose access to the group.',
            type: 'danger',
            confirmText: 'Remove',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${id}/members/${memberId}`);
                    setGroup({ ...group, members: group.members.filter(m => m.id !== memberId) });
                } catch (err) {
                    console.error(err);
                    alert('Failed to remove member');
                }
            }
        });
    };

    const currencySymbol = {
        'USD': '$',
        'GBP': '£',
        'EUR': '€'
    }[group?.currency] || '$';

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!group) return <div className="p-8 text-center text-red-500">Group not found</div>;

    return (
        <div>
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 mb-4 sm:mb-6 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">{group.name}</h1>
                        <p className="text-slate-500 mb-4">{group.description}</p>
                    </div>


                    {canExport && (
                        <button
                            onClick={handleExportReport}
                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-lg transition flex items-center gap-1 font-medium text-sm ml-2"
                            title="Export Group Report"
                        >
                            <FileText size={16} /> Export Report
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{group.members.length} members</span>
                    </div>
                    <div className="flex -space-x-2">
                        {group.members.map((m) => (
                            <div key={m.id} className="relative group/avatar">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={m.name}>
                                    {m.name.charAt(0)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expanded Member List for Owner to Manage */}
                {isOwner && (
                    <div className="mt-4 border-t pt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Manage Members</p>
                        <div className="flex flex-wrap gap-2">
                            {group.members.map(m => (
                                <div key={m.id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                                    <span className="text-sm text-slate-700">{m.name}</span>
                                    {m.role === 'owner' ? (
                                        <span className="text-xs text-indigo-600 font-bold px-1">Owner</span>
                                    ) : m.role === 'pending' ? (
                                        <span className="text-xs text-orange-500 font-bold px-1 bg-orange-50 rounded border border-orange-100">Pending</span>
                                    ) : (
                                        <button
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="text-slate-400 hover:text-red-500 transition"
                                            title="Remove Member"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>

                    {isOwner && (
                        <button
                            onClick={handleDeleteGroup}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition flex items-center gap-1 font-medium text-sm"
                        >
                            <Trash2 size={16} /> Delete Group
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={clsx("pb-2 px-2 sm:px-4 font-medium flex items-center gap-1 sm:gap-2 transition whitespace-nowrap", activeTab === 'expenses' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                    {(() => {
                        const Icon = {
                            'USD': DollarSign,
                            'GBP': PoundSterling,
                            'EUR': Euro
                        }[group?.currency] || DollarSign;
                        return <Icon size={18} />;
                    })()} Expenses
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={clsx("pb-2 px-2 sm:px-4 font-medium flex items-center gap-1 sm:gap-2 transition whitespace-nowrap", activeTab === 'tasks' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                    <CheckSquare size={18} /> Tasks
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={clsx("pb-2 px-2 sm:px-4 font-medium flex items-center gap-1 sm:gap-2 transition whitespace-nowrap", activeTab === 'balances' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                    <Scale size={18} /> Balances
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'expenses' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
                        <button onClick={() => setShowExpenseModal(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700">
                            <Plus size={16} /> Add Expense
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(!expenses || expenses.length === 0) ? <p className="text-slate-500">No expenses yet.</p> : expenses.map(expense => (
                            <div key={expense.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-semibold text-slate-800 truncate" title={expense.title}>{expense.title}</h3>
                                    <p className="text-sm text-slate-500 truncate">Paid by <span className="font-medium text-slate-700">{expense.paid_by_name}</span> • {new Date(expense.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                                    <div className="text-right mr-2">
                                        <span className="block text-lg font-bold text-indigo-600">{currencySymbol}{Number(expense.amount).toFixed(2)}</span>
                                        <div className="flex items-center justify-end gap-2">
                                            {expense.receipt_path && (
                                                <button
                                                    onClick={() => setViewReceiptUrl(`${api.defaults.baseURL}/${expense.receipt_path}`)}
                                                    className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
                                                    title="View Receipt"
                                                >
                                                    <Paperclip size={12} />
                                                    View
                                                </button>
                                            )}
                                            <span className="text-xs text-slate-400 uppercase">{expense.split_type}</span>
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditExpense(expense)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition"
                                                title="Edit Expense"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition"
                                                title="Delete Expense"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Tasks</h2>

                    <form onSubmit={handleAddTask} className="mb-6 flex gap-2">
                        <input
                            type="text"
                            placeholder="Add a new task..."
                            className="flex-grow px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Add</button>
                    </form>

                    <div className="space-y-2">
                        {(!tasks || tasks.length === 0) ? <p className="text-slate-500">No tasks yet.</p> : tasks.map(task => {
                            const isAssigned = !!task.assigned_to;
                            const isAssignedToMe = task.assigned_to === user.id;

                            return (
                                <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        disabled={isAssigned && !isAssignedToMe}
                                        className={clsx(
                                            "w-6 h-6 rounded border flex items-center justify-center transition",
                                            task.is_completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300",
                                            (isAssigned && !isAssignedToMe) ? "opacity-50 cursor-not-allowed bg-slate-100" : "hover:border-indigo-500"
                                        )}
                                        title={isAssigned && !isAssignedToMe ? `Assigned to ${task.assigned_to_name}` : "Mark as completed"}
                                    >
                                        {task.is_completed && <CheckSquare size={14} />}
                                    </button>
                                    <div className="flex-grow">
                                        <span className={clsx("block", task.is_completed && "text-slate-400 line-through")}>{task.title}</span>
                                        {isAssigned ? (
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <span className="font-medium text-indigo-600">
                                                    {isAssignedToMe ? "You are on it" : `${task.assigned_to_name} is on it`}
                                                </span>
                                                {isAssignedToMe && (
                                                    <button onClick={() => handleClaimTask(task.id)} className="text-xs text-slate-400 hover:text-slate-600 underline ml-2">
                                                        Unclaim
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            !task.is_completed && (
                                                <button
                                                    onClick={() => handleClaimTask(task.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-0.5 flex items-center gap-1"
                                                >
                                                    I'm on it
                                                </button>
                                            )
                                        )}
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition"
                                            title="Delete Task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'balances' && (
                <div>
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-sm mb-6">
                        <p className="text-slate-400 font-medium mb-1">Total Group Spend</p>
                        <h2 className="text-3xl font-bold">
                            {currencySymbol}{expenses.reduce((sum, expense) => sum + Number(expense.amount), 0).toFixed(2)}
                        </h2>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-4">Member Balances</h2>
                    <div className="space-y-3">
                        {balances.map(member => (
                            <div key={member.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-slate-800">{member.name}</h3>
                                        <p className="text-sm text-slate-500">Paid {currencySymbol}{member.total_paid.toFixed(2)} • Share {currencySymbol}{member.total_share.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className={clsx("text-right font-bold text-lg", member.net_balance > 0 ? "text-green-600" : member.net_balance < 0 ? "text-red-500" : "text-slate-500")}>
                                    {member.net_balance > 0 ? '+' : member.net_balance < 0 ? '-' : ''}
                                    {currencySymbol}{Math.abs(member.net_balance).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h2>
                        <form onSubmit={handleSaveExpense} className="space-y-6">
                            {/* Section: Main Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title</label>
                                    <input
                                        type="text"
                                        placeholder="What was it for?"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                        value={newExpense.title}
                                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-slate-400">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                className="w-full pl-7 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                required
                                                value={newExpense.amount}
                                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Paid By</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            value={newExpense.paid_by || ''}
                                            onChange={(e) => setNewExpense({ ...newExpense, paid_by: e.target.value })}
                                        >
                                            <option value="">Select Payer ({user?.name})</option>
                                            {group.members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} {member.id === user?.id ? '(You)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Split Options */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Split Method</label>
                                <div className="flex gap-2">
                                    {['equal', 'percentage'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewExpense({ ...newExpense, split_type: type })}
                                            className={clsx(
                                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border",
                                                newExpense.split_type === type
                                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {newExpense.split_type === 'percentage' && (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Adjust Percentages</p>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                            {group.members.map(member => (
                                                <div key={member.id} className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-700 w-24 truncate flex-shrink-0" title={member.name}>{member.name}</span>
                                                    <div className="relative flex-grow">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none pr-6"
                                                            value={newExpense.splits[member.id] || ''}
                                                            onChange={(e) => setNewExpense({
                                                                ...newExpense,
                                                                splits: { ...newExpense.splits, [member.id]: parseFloat(e.target.value) }
                                                            })}
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-slate-400 text-xs">%</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-600 min-w-[70px] text-right tabular-nums">
                                                        {currencySymbol}{((newExpense.amount || 0) * ((newExpense.splits[member.id] || 0) / 100)).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Section: Receipt */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Receipt / Attachment</label>

                                {newExpense.existingReceipt && !newExpense.receipt && (
                                    <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckSquare size={16} />
                                            <span className="text-sm font-medium">Receipt Attached</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setViewReceiptUrl(`${api.defaults.baseURL}/${newExpense.existingReceipt}`)}
                                            className="text-xs text-green-700 hover:text-green-800 underline font-medium"
                                        >
                                            View
                                        </button>
                                    </div>
                                )}

                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                                    {/* Hidden Inputs */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/heic,image/heif,application/pdf"
                                        onChange={(e) => setNewExpense({ ...newExpense, receipt: e.target.files[0] })}
                                    />
                                    <input
                                        type="file"
                                        ref={cameraInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setNewExpense({ ...newExpense, receipt: e.target.files[0] })}
                                    />

                                    {newExpense.receipt ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                                                <CheckSquare size={20} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 break-all px-4">
                                                {newExpense.receipt.name}
                                            </span>
                                            <span className="text-xs text-green-600 font-medium">Ready to upload</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <span className="text-sm font-medium text-slate-600">
                                                {newExpense.existingReceipt ? 'Replace existing receipt:' : 'Attach receipt:'}
                                            </span>

                                            <div className="flex gap-3 w-full justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => cameraInputRef.current?.click()}
                                                    className="flex-1 max-w-[140px] flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
                                                >
                                                    <Camera size={24} className="text-slate-400" />
                                                    <span className="text-xs font-medium">Take Photo</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex-1 max-w-[140px] flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition shadow-sm"
                                                >
                                                    <Upload size={24} className="text-slate-400" />
                                                    <span className="text-xs font-medium">Upload File</span>
                                                </button>
                                            </div>

                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">PDF • JPG • PNG • HEIC</span>
                                        </div>
                                    )}
                                </div>

                                {newExpense.receipt && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setNewExpense({ ...newExpense, receipt: null })}
                                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
                                        >
                                            <X size={12} /> Cancel Upload
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Member</h2>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="friend@example.com"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />

            {/* Receipt Modal */}
            {/* Receipt Modal */}
            {viewReceiptUrl && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setViewReceiptUrl(null)}>
                    <div className="bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-auto relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-lg text-slate-800">Receipt</h3>
                            <div className="flex gap-2">
                                <a
                                    href={viewReceiptUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                    title="Download"
                                >
                                    <FileText size={20} />
                                </a>
                                <button
                                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition"
                                    onClick={() => setViewReceiptUrl(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center bg-slate-50 rounded-lg overflow-hidden min-h-[300px] items-center">
                            {viewReceiptUrl.toLowerCase().includes('.pdf') ? (
                                <iframe src={viewReceiptUrl} className="w-full h-[70vh]" title="Receipt PDF"></iframe>
                            ) : /\.(jpeg|jpg|png|gif|webp)$/i.test(viewReceiptUrl) ? (
                                <img src={viewReceiptUrl} alt="Receipt" className="max-w-full max-h-[70vh] object-contain" />
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="mb-4 flex justify-center text-slate-300">
                                        <FileText size={64} />
                                    </div>
                                    <p className="mb-4">This file format cannot be previewed in the browser.</p>
                                    <a href={viewReceiptUrl} download className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium">
                                        Download File to View
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetails;
