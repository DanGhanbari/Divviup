import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Image, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Camera, FileText, Check, Calendar as CalendarIcon, Users, DollarSign, Percent as PercentIcon, ChevronDown, X, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';
import CurrencyPickerModal from './CurrencyPickerModal';
import { useAuth } from '../context/AuthContext';

interface AddExpenseBottomSheetProps {
    bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
    groupId: string;
    group: any;
    onExpenseAdded?: () => void;
    expenseToEdit?: any;
    setExpenseToEdit?: (e: any) => void;
}

export default function AddExpenseBottomSheet({ bottomSheetModalRef, groupId, group, onExpenseAdded, expenseToEdit, setExpenseToEdit }: AddExpenseBottomSheetProps) {
    const snapPoints = useMemo(() => ['90%', '95%'], []);
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [paidBy, setPaidBy] = useState('');
    const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal');
    const [splits, setSplits] = useState<Record<string, string>>({});

    const [receipt, setReceipt] = useState<{ uri: string, type: string, name: string } | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);

    const validMembers = useMemo(() => {
        return group?.members?.filter((m: any) => m.role !== 'pending') || [];
    }, [group]);

    useEffect(() => {
        if (expenseToEdit) {
            setTitle(expenseToEdit.title || '');
            setAmount(expenseToEdit.amount?.toString() || '');
            setCurrency(expenseToEdit.currency || group?.currency || 'USD');
            setSplitType(expenseToEdit.split_type || 'equal');
            if (expenseToEdit.expense_date) setDate(new Date(expenseToEdit.expense_date));
            if (expenseToEdit.paid_by) setPaidBy(expenseToEdit.paid_by.toString());
            if (expenseToEdit.mappedSplits) setSplits(expenseToEdit.mappedSplits);
        } else {
            // Initialize defaults when group loads or bottom sheet opens without edit
            if (group) setCurrency(group.default_currency || group.currency || 'USD');
            if (user) setPaidBy(user.id.toString());
            setTitle('');
            setAmount('');
            setSplitType('equal');
            setSplits({});
            setReceipt(null);
            setDate(new Date());
        }
    }, [expenseToEdit, group, user]);

    // Handle Split Type Change Reset
    useEffect(() => {
        // setSplits({}); // Clear exact/percentage splits when switching types
    }, [splitType]);

    const handleAddExpense = async () => {
        if (!title.trim() || !amount) {
            Alert.alert('Required', 'Please enter a description and amount');
            return;
        }

        // Validate splits if not equal
        let formattedSplits: any[] = [];
        if (splitType === 'percentage') {
            const totalPercentage = Object.values(splits).reduce((a, b) => a + (parseFloat(b) || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.1) {
                Alert.alert('Invalid Splits', `Percentages must sum to 100%. Current sum: ${totalPercentage.toFixed(1)}%`);
                return;
            }
            formattedSplits = validMembers.map((m: any) => ({
                user_id: m.id,
                amount: ((parseFloat(amount) || 0) * ((parseFloat(splits[m.id]) || 0) / 100)).toFixed(2)
            }));
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('amount', amount);
            formData.append('split_type', splitType);
            formData.append('expense_date', date.toISOString().split('T')[0]);
            formData.append('currency', currency);
            if (paidBy) formData.append('paid_by', paidBy);

            if (formattedSplits.length > 0) {
                formData.append('splits', JSON.stringify(formattedSplits));
            }

            if (receipt) {
                formData.append('receipt', {
                    uri: receipt.uri,
                    type: receipt.type,
                    name: receipt.name,
                } as any);
            }

            if (expenseToEdit) {
                await api.put(`/groups/${groupId}/expenses/${expenseToEdit.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post(`/groups/${groupId}/expenses`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // Reset Form on Success
            setTitle('');
            setAmount('');
            setSplitType('equal');
            setSplits({});
            setReceipt(null);
            setDate(new Date());
            setPaidBy(user?.id?.toString() || '');

            if (setExpenseToEdit) setExpenseToEdit(null);
            bottomSheetModalRef.current?.dismiss();
            onExpenseAdded?.();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiptAction = async (action: 'camera' | 'gallery', withAi: boolean) => {
        try {
            let result;
            if (action === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need camera access to scan receipts.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'We need gallery access to upload receipts.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileObj = {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || 'receipt.jpg',
                };
                setReceipt(fileObj);

                if (withAi) {
                    await uploadAndAnalyze(fileObj);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to open camera/gallery.');
        }
    };

    const uploadAndAnalyze = async (fileObj: any) => {
        setScanning(true);
        try {
            const formData = new FormData();
            formData.append('receipt', fileObj as any);

            const response = await api.post('/ai/analyze-receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data) {
                if (response.data.merchantName && !title) setTitle(response.data.merchantName);
                if (response.data.totalAmount && !amount) setAmount(response.data.totalAmount.toString());
            }
        } catch (err: any) {
            console.error('AI Scan Error', err);
            Alert.alert('Scanning Issue', 'Could not read receipt correctly, but the image is attached. Please enter manually.');
        } finally {
            setScanning(false);
        }
    };

    const promptScanChoice = () => {
        Alert.alert(
            'Add Receipt',
            'Choose an option',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Scan with AI (Camera)', onPress: () => handleReceiptAction('camera', true) },
                { text: 'Upload & Scan (Gallery)', onPress: () => handleReceiptAction('gallery', true) },
                { text: 'Just Attach Image', onPress: () => handleReceiptAction('gallery', false) },
            ]
        );
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    const renderBackdrop = useCallback(
        (props: any) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
        []
    );

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: '#f8fafc' }}
            handleIndicatorStyle={{ backgroundColor: '#cbd5e1' }}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                <Text className="text-2xl font-bold text-slate-900 mb-6">{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</Text>

                {/* Receipt Section */}
                <View className="mb-6">
                    {receipt ? (
                        <View className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                            <Image source={{ uri: receipt.uri }} className="w-full h-full" resizeMode="cover" />
                            {scanning ? (
                                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                                    <ActivityIndicator color="white" size="large" />
                                    <Text className="text-white mt-2 font-bold">Analyzing with Vertex AI...</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
                                    onPress={() => setReceipt(null)}
                                >
                                    <X color="white" size={16} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl items-center justify-center bg-indigo-50"
                            onPress={promptScanChoice}
                        >
                            <Camera color="#6366f1" size={24} />
                            <Text className="text-indigo-700 font-bold mt-2">Scan or Attach Receipt</Text>
                            <Text className="text-indigo-400 text-xs mt-1">Vertex AI will autofill details</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Title & Amount */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Description <Text className="text-red-500">*</Text></Text>
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 h-12">
                            <TextInput
                                className="flex-1 text-base text-slate-900"
                                style={{ height: '100%', minHeight: 48, paddingVertical: 0 }}
                                placeholder="Dinner, Taxi..."
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Amount <Text className="text-red-500">*</Text></Text>
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 h-12">
                            <TouchableOpacity onPress={() => setCurrencyModalVisible(true)} className="flex-row items-center mr-2 bg-slate-100 px-2 py-1 rounded-md">
                                <Text className="text-slate-600 font-bold text-xs">{currency}</Text>
                                <ChevronDown color="#64748b" size={12} className="ml-1" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 text-lg font-bold text-slate-900"
                                style={{ height: '100%', minHeight: 48, paddingVertical: 0 }}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor="#cbd5e1"
                            />
                        </View>
                    </View>
                </View>

                {/* Date */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Date</Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 h-12 flex-row items-center justify-between"
                    >
                        <Text className="text-slate-900">{date.toLocaleDateString()}</Text>
                        <CalendarIcon color="#94a3b8" size={16} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'default' : 'default'}
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Paid By */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Paid By</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {validMembers.map((m: any) => (
                            <TouchableOpacity
                                key={m.id}
                                onPress={() => setPaidBy(m.id.toString())}
                                className={`px-4 py-2 rounded-full mr-2 border ${paidBy === m.id.toString() ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-semibold ${paidBy === m.id.toString() ? 'text-white' : 'text-slate-600'}`}>
                                    {m.id.toString() === user?.id.toString() ? 'You' : m.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Split Type */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Split Method</Text>
                    <View className="flex-row bg-slate-200 p-1 rounded-xl">
                        <TouchableOpacity
                            onPress={() => setSplitType('equal')}
                            className={`flex-1 py-2 flex-row items-center justify-center rounded-lg ${splitType === 'equal' ? 'bg-white' : 'bg-transparent'}`}
                        >
                            <Users color={splitType === 'equal' ? '#4f46e5' : '#64748b'} size={14} />
                            <Text className={`font-bold ml-1 ${splitType === 'equal' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                =
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSplitType('percentage')}
                            className={`flex-1 py-2 flex-row items-center justify-center rounded-lg ${splitType === 'percentage' ? 'bg-white' : 'bg-transparent'}`}
                        >
                            <PercentIcon color={splitType === 'percentage' ? '#4f46e5' : '#64748b'} size={14} />
                            <Text className={`font-bold ml-1 ${splitType === 'percentage' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                %
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Custom Splits UI */}
                {splitType !== 'equal' && (
                    <View className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden p-2">
                        {validMembers.map((m: any, index: number) => (
                            <View key={m.id} className={`flex-row items-center justify-between p-3 ${index !== validMembers.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                <Text className="font-medium text-slate-800 flex-1" numberOfLines={1}>{m.name}</Text>
                                <View className="flex-row items-center w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 h-10">
                                    <TextInput
                                        className="flex-1 text-right font-medium text-slate-900"
                                        style={{ height: '100%', minHeight: 40, paddingVertical: 0 }}
                                        placeholder="0"
                                        keyboardType="decimal-pad"
                                        value={splits[m.id] || ''}
                                        onChangeText={(v) => setSplits(prev => ({ ...prev, [m.id]: v }))}
                                        placeholderTextColor="#94a3b8"
                                    />
                                    {splitType === 'percentage' && <Text className="text-slate-400 ml-1">%</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center justify-center mt-2 flex-row ${loading || scanning ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                    onPress={handleAddExpense}
                    disabled={loading || scanning}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Check color="white" size={20} />
                            <Text className="text-white font-bold text-lg ml-2">{expenseToEdit ? 'Update Expense' : 'Save Expense'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </BottomSheetScrollView>

            <CurrencyPickerModal
                visible={currencyModalVisible}
                onClose={() => setCurrencyModalVisible(false)}
                selectedCurrency={currency}
                onSelect={setCurrency}
            />
        </BottomSheetModal>
    );
}
