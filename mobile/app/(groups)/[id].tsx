import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, FlatList, Modal, SafeAreaView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Receipt, Plus, DollarSign, CheckSquare, Pencil, Trash2, Paperclip, Filter, Search, ArrowDownUp, Users, Camera, Upload, X, Scale, Star } from 'lucide-react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import api from '../../api';
import { useGroupSocket } from '../../hooks/useGroupSocket';
import AddExpenseBottomSheet from '../../components/AddExpenseBottomSheet';
import { getSymbol } from '../../utils/currencies';
import { useAuth } from '../../context/AuthContext';

export default function GroupDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const [group, setGroup] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'expenses' | 'tasks' | 'balances'>('expenses');
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [expenseToEdit, setExpenseToEdit] = useState<any>(null);
    const { user } = useAuth();

    // Filter & Sort State
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_high, amount_low
    const [filterPayer, setFilterPayer] = useState('all');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    const fetchGroupDetails = useCallback(async () => {
        try {
            // In a real app we'd load these individually or via a composite endpoint
            const groupRes = await api.get(`/groups/${id}`);
            setGroup(groupRes.data);

            const exRes = await api.get(`/groups/${id}/expenses`);
            setExpenses(exRes.data);

            const taskRes = await api.get(`/groups/${id}/tasks`);
            setTasks(taskRes.data);

            const balRes = await api.get(`/groups/${id}/balances`);
            setBalances(balRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchGroupDetails();
    }, [id, fetchGroupDetails]);

    useGroupSocket(id as string, fetchGroupDetails);

    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        // 1. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => (e.title || e.description || '').toLowerCase().includes(query));
        }

        // 2. Filter by Payer
        if (filterPayer !== 'all') {
            result = result.filter(e => String(e.paid_by) === String(filterPayer));
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === 'date_desc') return new Date(b.expense_date || b.created_at).getTime() - new Date(a.expense_date || a.created_at).getTime();
            if (sortBy === 'date_asc') return new Date(a.expense_date || a.created_at).getTime() - new Date(b.expense_date || b.created_at).getTime();
            if (sortBy === 'amount_high') return parseFloat(b.amount) - parseFloat(a.amount);
            if (sortBy === 'amount_low') return parseFloat(a.amount) - parseFloat(b.amount);
            return 0;
        });

        return result;
    }, [expenses, searchQuery, filterPayer, sortBy]);

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!group) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <Text className="text-lg text-slate-500">Group not found.</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-indigo-100 px-4 py-2 rounded-lg">
                    <Text className="text-indigo-700 font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isOwner = group?.members?.find((m: any) => m.id === user?.id)?.role === 'owner';
    const isAdmin = group?.members?.find((m: any) => m.id === user?.id)?.role === 'admin';

    const handleEditExpense = async (expense: any) => {
        try {
            const res = await api.get(`/groups/${id}/expenses/${expense.id}`);
            const fullExpense = res.data;

            let splitsState: any = {};
            if (fullExpense.split_type === 'percentage') {
                fullExpense.splits.forEach((s: any) => {
                    splitsState[s.user_id] = ((parseFloat(s.amount_due) / parseFloat(fullExpense.amount)) * 100).toFixed(0);
                });
            } else if (fullExpense.split_type === 'exact') {
                fullExpense.splits.forEach((s: any) => {
                    splitsState[s.user_id] = parseFloat(s.amount_due).toFixed(2);
                });
            }

            fullExpense.mappedSplits = splitsState;
            setExpenseToEdit(fullExpense);
            bottomSheetModalRef.current?.present();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to load expense details');
        }
    };

    const handleDeleteExpense = (expenseId: number) => {
        Alert.alert(
            'Delete Expense',
            'Are you sure you want to delete this expense? This action cannot be undone and will affect balances.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/groups/${id}/expenses/${expenseId}`);
                            fetchGroupDetails();
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete expense');
                        }
                    }
                }
            ]
        );
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || addingTask) return;

        if (user?.plan === 'free' && tasks.length >= 2) {
            Alert.alert('Upgrade for More Tasks', 'You have reached the limit of 2 tasks per group on the Free plan. Upgrade to Premium for unlimited tasks.');
            return;
        }

        setAddingTask(true);
        try {
            console.log('Sending Add Task payload URL:', `/groups/${id}/tasks`, 'Payload:', { title: newTaskTitle.trim() });
            const res = await api.post(`/groups/${id}/tasks`, { title: newTaskTitle.trim() });
            console.log('Task Create Success:', res.data);
            setTasks([res.data, ...tasks]);
            setNewTaskTitle('');
        } catch (err: any) {
            console.error('Task Create Error:', err?.response?.data || err.message || err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to add task');
        } finally {
            setAddingTask(false);
        }
    };

    const toggleTask = async (taskId: number) => {
        try {
            const res = await api.patch(`/groups/${id}/tasks/${taskId}/toggle`);
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update task');
        }
    };

    const handleClaimTask = async (taskId: number) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            const isAssignedToMe = task.assigned_to === user?.id;
            const payload = { assigned_to: isAssignedToMe ? null : user?.id };
            const res = await api.patch(`/groups/${id}/tasks/${taskId}/assign`, payload);
            setTasks(tasks.map(t => t.id === taskId ? res.data : t));
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to claim task');
        }
    };

    const handleDeleteTask = (taskId: number) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/groups/${id}/tasks/${taskId}`);
                            setTasks(tasks.filter(t => t.id !== taskId));
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete task');
                        }
                    }
                }
            ]
        );
    };

    const ExpenseCard = ({ item }: { item: any }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsExpanded(!isExpanded)}
                className="bg-white p-4 rounded-xl mb-3 flex-row justify-between flex-wrap shadow-sm border border-slate-100"
            >
                <View className="flex-1 mr-4 overflow-hidden">
                    <Text
                        className="font-bold text-slate-800 text-lg mb-1"
                        numberOfLines={isExpanded ? undefined : 1}
                        ellipsizeMode="tail"
                    >
                        {item.title || item.description}
                    </Text>

                    <View className="flex-row items-center flex-wrap mt-1">
                        <Text className="text-slate-500 text-xs">Paid by <Text className="font-medium text-slate-700">{item.paid_by_name}</Text> • {new Date(item.expense_date || item.created_at).toLocaleDateString()}</Text>
                        <View className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 ml-2 mt-1 sm:mt-0">
                            <Text className="text-[10px] text-slate-400 uppercase font-bold">{item.split_type}</Text>
                        </View>
                        {item.receipt_path && (
                            <TouchableOpacity
                                onPress={() => setSelectedReceipt(`${api.defaults.baseURL || 'http://192.168.1.70:5001'}/${item.receipt_path}`)}
                                className="bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 ml-2 mt-1 sm:mt-0 flex-row items-center"
                            >
                                <Paperclip size={10} color="#4f46e5" />
                                <Text className="text-[10px] text-indigo-600 font-bold ml-1">RECEIPT</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View className="items-end justify-center">
                    {String(item.currency || 'USD').trim().toUpperCase() !== String(group?.currency || 'USD').trim().toUpperCase() ? (
                        <>
                            <Text className="font-bold text-lg text-indigo-600">≈ {getSymbol(group?.currency || 'USD')}{parseFloat(item.amount).toFixed(2)}</Text>
                            <Text className="text-slate-400 text-xs font-medium">{getSymbol(item.currency)}{parseFloat(item.original_amount || item.amount).toFixed(2)}</Text>
                        </>
                    ) : (
                        <Text className="font-bold text-lg text-indigo-600">{getSymbol(item.currency)}{parseFloat(item.amount).toFixed(2)}</Text>
                    )}
                </View>

                {isExpanded && (isOwner || isAdmin || item.paid_by === user?.id) && (
                    <View className="w-full mt-3 pt-3 border-t border-slate-100 flex-row justify-end gap-3">
                        <TouchableOpacity
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex-row items-center"
                            onPress={() => handleEditExpense(item)}
                        >
                            <Pencil size={14} color="#64748b" />
                            <Text className="text-slate-600 text-xs font-bold ml-1">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg flex-row items-center"
                            onPress={() => handleDeleteExpense(item.id)}
                        >
                            <Trash2 size={14} color="#ef4444" />
                            <Text className="text-red-600 text-xs font-bold ml-1">Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderTask = ({ item }: { item: any }) => {
        const isAssigned = !!item.assigned_to;
        const isAssignedToMe = item.assigned_to === user?.id;

        return (
            <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm border border-slate-100">
                <View className="flex-row items-center flex-1 pr-2">
                    <TouchableOpacity
                        disabled={isAssigned && !isAssignedToMe}
                        onPress={() => toggleTask(item.id)}
                        className={`w-6 h-6 rounded border mr-3 items-center justify-center transition-colors 
                        ${item.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-300'} 
                        ${(isAssigned && !isAssignedToMe) ? 'opacity-50 bg-slate-100' : ''}`}
                    >
                        {item.is_completed && <CheckSquare color="white" size={14} />}
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className={`font-medium ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {item.title || item.description}
                        </Text>

                        {isAssigned ? (
                            <View className="flex-row items-center mt-1">
                                <Text className="text-xs font-medium text-indigo-600">
                                    {isAssignedToMe ? 'You are on it' : `${item.assigned_to_name} is on it`}
                                </Text>
                                {isAssignedToMe && (
                                    <TouchableOpacity onPress={() => handleClaimTask(item.id)}>
                                        <Text className="text-xs text-slate-400 ml-2 underline">Unclaim</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            !item.is_completed && (
                                <TouchableOpacity onPress={() => handleClaimTask(item.id)} className="mt-1">
                                    <Text className="text-xs text-indigo-600 font-medium">I'm on it</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>
                </View>

                {isOwner && (
                    <TouchableOpacity
                        className="p-2 ml-1"
                        onPress={() => handleDeleteTask(item.id)}
                    >
                        <Trash2 size={16} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderBalance = ({ item }: { item: any }) => {
        const netBalance = parseFloat(item.net_balance) || 0;
        const totalPaid = parseFloat(item.total_paid) || 0;
        const totalShare = parseFloat(item.total_share) || 0;
        const isOwed = netBalance > 0;
        const isOwe = netBalance < 0;

        const colorClass = isOwed ? 'text-green-600' : isOwe ? 'text-red-500' : 'text-slate-500';

        return (
            <View className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-slate-100 flex-col">
                <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 mr-2">
                        <View className="relative">
                            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3 border-2 border-white shadow-sm">
                                <Text className="font-bold text-indigo-700 text-base">{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            {item.plan === 'premium' && (
                                <View className="absolute -top-1 right-2 bg-amber-100 w-4 h-4 rounded-full items-center justify-center border border-white shadow-sm z-10">
                                    <Star color="#f59e0b" fill="#f59e0b" size={8} />
                                </View>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="font-bold text-slate-800 text-base" numberOfLines={1}>{item.name}</Text>
                            <Text className="text-slate-500 text-xs">
                                Paid {getSymbol(group?.currency)}{totalPaid.toFixed(2)} • Share {getSymbol(group?.currency)}{totalShare.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <Text className={`font-bold text-lg ${colorClass}`}>
                        {isOwed ? '+' : isOwe ? '-' : ''}{Math.abs(netBalance).toFixed(2)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="pt-14 pb-4 px-4 bg-indigo-600 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white text-xl font-bold" numberOfLines={1}>{group.name}</Text>
                    <Text className="text-indigo-200 text-sm">
                        {group.default_currency || 'USD'} • {expenses.length} Expenses
                    </Text>
                </View>
                <TouchableOpacity
                    className="p-2 ml-2 bg-indigo-700 rounded-lg justify-center items-center flex-row"
                    onPress={() => router.push({ pathname: '/(groups)/invite', params: { groupId: id } })}
                >
                    <Text className="text-white font-bold mr-1 text-sm">Add</Text>
                    <Plus color="white" size={16} />
                </TouchableOpacity>
            </View>

            {/* Custom Tabs */}
            <View className="bg-white border-b border-slate-200 flex-row">
                <TouchableOpacity
                    className={`flex-1 py-4 items-center justify-center border-b-2 flex-row ${activeTab === 'expenses' ? 'border-indigo-600' : 'border-transparent'}`}
                    onPress={() => setActiveTab('expenses')}
                >
                    <Receipt color={activeTab === 'expenses' ? '#4f46e5' : '#94a3b8'} size={18} />
                    <Text className={`ml-2 font-bold ${activeTab === 'expenses' ? 'text-indigo-600' : 'text-slate-500'}`}>Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-4 items-center justify-center border-b-2 flex-row ${activeTab === 'tasks' ? 'border-indigo-600' : 'border-transparent'}`}
                    onPress={() => setActiveTab('tasks')}
                >
                    <CheckSquare color={activeTab === 'tasks' ? '#4f46e5' : '#94a3b8'} size={18} />
                    <Text className={`ml-2 font-bold ${activeTab === 'tasks' ? 'text-indigo-600' : 'text-slate-500'}`}>Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-4 items-center justify-center border-b-2 flex-row ${activeTab === 'balances' ? 'border-indigo-600' : 'border-transparent'}`}
                    onPress={() => setActiveTab('balances')}
                >
                    <Scale color={activeTab === 'balances' ? '#4f46e5' : '#94a3b8'} size={18} />
                    <Text className={`ml-2 font-bold ${activeTab === 'balances' ? 'text-indigo-600' : 'text-slate-500'}`}>Balances</Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View className="flex-1 pt-4 relative">
                {activeTab === 'expenses' && (
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-4 px-4">
                            <Text className="text-xl font-bold text-slate-800">Expenses</Text>
                            <TouchableOpacity
                                onPress={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg border ${showFilters ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}
                            >
                                <Filter size={20} color={showFilters ? '#4f46e5' : '#64748b'} />
                            </TouchableOpacity>
                        </View>

                        {showFilters && (
                            <View className="bg-slate-50 p-4 border-b border-t border-slate-200 mb-4 animate-in">
                                <View className="bg-white flex-row items-center border border-slate-200 rounded-lg px-3 mb-3">
                                    <Search size={16} color="#94a3b8" />
                                    <TextInput
                                        className="flex-1 py-2 pl-2 text-slate-800"
                                        placeholder="Search expenses..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View className="flex-row gap-3">
                                    <View className="flex-1 bg-white border border-slate-200 rounded-lg flex-row items-center px-3 py-2">
                                        <ArrowDownUp size={14} color="#64748b" />
                                        <Text className="text-slate-700 ml-2 font-medium" onPress={() => {
                                            const options = ['date_desc', 'date_asc', 'amount_high', 'amount_low'];
                                            const nextIdx = (options.indexOf(sortBy) + 1) % options.length;
                                            setSortBy(options[nextIdx]);
                                        }}>
                                            {sortBy === 'date_desc' && 'Newest First'}
                                            {sortBy === 'date_asc' && 'Oldest First'}
                                            {sortBy === 'amount_high' && 'Highest Amount'}
                                            {sortBy === 'amount_low' && 'Lowest Amount'}
                                        </Text>
                                    </View>
                                    <View className="flex-1 bg-white border border-slate-200 rounded-lg flex-row items-center px-3 py-2">
                                        <Users size={14} color="#64748b" />
                                        <Text className="text-slate-700 ml-2 font-medium" numberOfLines={1} onPress={() => {
                                            const members = [{ id: 'all', name: 'All Payers' }, ...(group?.members || [])];
                                            const currentIdx = members.findIndex((m: any) => String(m.id) === String(filterPayer));
                                            const nextIdx = (currentIdx + 1) % members.length;
                                            setFilterPayer(members[nextIdx].id);
                                        }}>
                                            {filterPayer === 'all' ? 'All Payers' : group?.members?.find((m: any) => String(m.id) === String(filterPayer))?.name || 'All Payers'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <FlatList
                            data={filteredExpenses}
                            keyExtractor={e => e.id.toString()}
                            renderItem={({ item }) => <ExpenseCard item={item} />}
                            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={<Text className="text-center mt-10 text-slate-400">No expenses found.</Text>}
                        />
                    </View>
                )}
                {activeTab === 'tasks' && (
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-4 px-4">
                            <Text className="text-xl font-bold text-slate-800">Tasks</Text>
                        </View>

                        <View className="px-4 mb-4 flex-row gap-2">
                            <TextInput
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 min-h-[44px]"
                                placeholder="Add a new task..."
                                value={newTaskTitle}
                                onChangeText={setNewTaskTitle}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity
                                className="bg-indigo-600 px-4 rounded-lg justify-center items-center"
                                onPress={handleAddTask}
                            >
                                <Text className="text-white font-bold">Add</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={tasks}
                            keyExtractor={t => t.id.toString()}
                            renderItem={renderTask}
                            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={<Text className="text-center mt-10 text-slate-400">No tasks yet.</Text>}
                        />
                    </View>
                )}
                {activeTab === 'balances' && (
                    <View className="flex-1 px-4">
                        <View className="bg-slate-800 p-6 rounded-xl shadow-sm mb-6 mt-2">
                            <Text className="text-slate-400 font-medium mb-1">Total Group Spend</Text>
                            <Text className="text-white text-3xl font-bold">
                                {getSymbol(group?.currency)}{expenses.reduce((sum, expense) => sum + Number(expense.amount), 0).toFixed(2)}
                            </Text>
                        </View>

                        <Text className="text-xl font-bold text-slate-800 mb-4">Member Balances</Text>

                        <FlatList
                            data={balances}
                            keyExtractor={(b, index) => index.toString()}
                            renderItem={renderBalance}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={<Text className="text-center mt-10 text-slate-400">No balances available.</Text>}
                        />
                    </View>
                )}
            </View>

            {/* FAB to add item */}
            {activeTab === 'expenses' && (
                <TouchableOpacity
                    className="absolute bottom-8 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg shadow-indigo-400"
                    onPress={() => {
                        if (activeTab === 'expenses') {
                            setExpenseToEdit(null);
                            bottomSheetModalRef.current?.present();
                        } else {
                            // router.push(`/groups/${id}/add-task`);
                        }
                    }}
                >
                    <Plus color="white" size={28} />
                </TouchableOpacity>
            )}

            {/* Receipt Modal */}
            <Modal visible={!!selectedReceipt} transparent={true} animationType="fade">
                <SafeAreaView className="flex-1 bg-black/95 justify-center">
                    <TouchableOpacity
                        className="absolute top-12 right-6 z-50 p-2 bg-white/20 rounded-full"
                        onPress={() => setSelectedReceipt(null)}
                    >
                        <Text className="text-white font-bold text-lg px-2">X</Text>
                    </TouchableOpacity>

                    {selectedReceipt && (
                        <Image
                            source={{ uri: selectedReceipt }}
                            className="w-full h-4/5"
                            resizeMode="contain"
                        />
                    )}
                </SafeAreaView>
            </Modal>

            <AddExpenseBottomSheet
                bottomSheetModalRef={bottomSheetModalRef}
                groupId={id as string}
                group={group}
                expenseToEdit={expenseToEdit}
                setExpenseToEdit={setExpenseToEdit}
                onExpenseAdded={fetchGroupDetails}
            />
        </View>
    );
}
