import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Users, DollarSign, CheckSquare, Plus, Send } from 'lucide-react';
import clsx from 'clsx';

const GroupDetails = () => {
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('expenses');
    const [loading, setLoading] = useState(true);

    // Forms
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', split_type: 'equal' });
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const groupRes = await api.get(`/groups/${id}`);
            setGroup(groupRes.data);

            const expensesRes = await api.get(`/groups/${id}/expenses`);
            setExpenses(expensesRes.data);

            const tasksRes = await api.get(`/groups/${id}/tasks`);
            setTasks(tasksRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/expenses`, newExpense);
            setShowExpenseModal(false);
            setNewExpense({ title: '', amount: '', split_type: 'equal' });
            fetchData(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        try {
            await api.post(`/groups/${id}/tasks`, { title: newTaskTitle });
            setNewTaskTitle('');
            fetchData(); // Refresh logic could be optimized
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTask = async (taskId) => {
        try {
            await api.patch(`/groups/${id}/tasks/${taskId}/toggle`);
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !t.is_completed } : t));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!group) return <div className="p-8 text-center text-red-500">Group not found</div>;

    return (
        <div>
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">{group.name}</h1>
                <p className="text-slate-500 mb-4">{group.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{group.members.length} members</span>
                    </div>
                    <div className="flex -space-x-2">
                        {group.members.map((m) => (
                            <div key={m.id} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={m.name}>
                                {m.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={clsx("pb-2 px-4 font-medium flex items-center gap-2 transition", activeTab === 'expenses' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                    <DollarSign size={18} /> Expenses
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={clsx("pb-2 px-4 font-medium flex items-center gap-2 transition", activeTab === 'tasks' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700")}
                >
                    <CheckSquare size={18} /> Tasks
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
                        {expenses.length === 0 ? <p className="text-slate-500">No expenses yet.</p> : expenses.map(expense => (
                            <div key={expense.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{expense.title}</h3>
                                    <p className="text-sm text-slate-500">Paid by <span className="font-medium text-slate-700">{expense.paid_by_name}</span> • {new Date(expense.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-indigo-600">${Number(expense.amount).toFixed(2)}</span>
                                    <span className="text-xs text-slate-400 uppercase">{expense.split_type}</span>
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
                        {tasks.length === 0 ? <p className="text-slate-500">No tasks yet.</p> : tasks.map(task => (
                            <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={clsx("w-6 h-6 rounded border flex items-center justify-center transition", task.is_completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-indigo-500")}
                                >
                                    {task.is_completed && <CheckSquare size={14} />}
                                </button>
                                <span className={clsx("flex-grow", task.is_completed && "text-slate-400 line-through")}>{task.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Expense</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <input
                                type="text"
                                placeholder="What was it for?"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                                value={newExpense.title}
                                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
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
                                <select
                                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    value={newExpense.split_type}
                                    onChange={(e) => setNewExpense({ ...newExpense, split_type: e.target.value })}
                                >
                                    <option value="equal">Equal</option>
                                    {/* Future: <option value="percentage">%</option> */}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetails;
