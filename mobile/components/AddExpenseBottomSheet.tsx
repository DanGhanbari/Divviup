import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Image, ScrollView, KeyboardAvoidingView, SafeAreaView, TouchableWithoutFeedback, Keyboard, StyleSheet, BackHandler, Switch } from 'react-native';
import { Camera, FileText, Check, Calendar as CalendarIcon, Users, DollarSign, Percent as PercentIcon, ChevronDown, X, Upload, Paperclip } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';
import { getItemAsync } from '../utils/storage';
import CurrencyPickerModal from './CurrencyPickerModal';
import { useAuth } from '../context/AuthContext';

interface AddExpenseBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    groupId: string;
    group: any;
    onExpenseAdded?: () => void;
    expenseToEdit?: any;
    setExpenseToEdit?: (e: any) => void;
}

export default function AddExpenseBottomSheet({ visible, onClose, groupId, group, onExpenseAdded, expenseToEdit, setExpenseToEdit }: AddExpenseBottomSheetProps) {
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
    const [attachReceipt, setAttachReceipt] = useState(true);
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
            setAttachReceipt(true);
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

            if (receipt && attachReceipt) {
                formData.append('receipt', {
                    uri: receipt.uri,
                    type: receipt.type,
                    name: receipt.name,
                } as any);
            }

            const token = await getItemAsync('token');
            const baseUrl = api.defaults.baseURL || 'http://192.168.1.70:5001';

            if (expenseToEdit) {
                const res = await fetch(`${baseUrl}/groups/${groupId}/expenses/${expenseToEdit.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(`${baseUrl}/groups/${groupId}/expenses`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!res.ok) throw new Error(await res.text());
            }

            // Reset Form on Success
            setTitle('');
            setAmount('');
            setSplitType('equal');
            setSplits({});
            setReceipt(null);
            setAttachReceipt(true);
            setDate(new Date());
            setPaidBy(user?.id?.toString() || '');

            if (setExpenseToEdit) setExpenseToEdit(null);
            onClose();
            onExpenseAdded?.();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to add expense');
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

            const token = await getItemAsync('token');
            const baseUrl = api.defaults.baseURL || 'http://192.168.1.70:5001';

            const response = await fetch(`${baseUrl}/receipts/scan`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                throw new Error('AI Scan failed: ' + await response.text());
            }

            const data = await response.json();

            if (data) {
                if (data.title && !title) setTitle(data.title);
                if (data.amount && !amount) setAmount(data.amount.toString());
                if (data.date) setDate(new Date(data.date));
                if (data.currency) setCurrency(data.currency);

                // If AI scan succeeds, default to keeping the image attached
                setAttachReceipt(true);
            }
        } catch (err: any) {
            console.error('AI Scan Error', err);
            Alert.alert('Scanning Issue', 'Could not read receipt correctly, but the image is attached. Please enter manually.');
        } finally {
            setScanning(false);
        }
    };

    const promptScanChoice = (mode: 'ai' | 'manual' = 'ai') => {
        if (mode === 'ai') {
            Alert.alert(
                'AI Scan',
                'Choose image source',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Take Photo', onPress: () => handleReceiptAction('camera', true) },
                    { text: 'Choose from Gallery', onPress: () => handleReceiptAction('gallery', true) },
                ]
            );
        } else {
            Alert.alert(
                'Attach Image',
                'Choose image source',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Take Photo', onPress: () => handleReceiptAction('camera', false) },
                    { text: 'Choose from Gallery', onPress: () => handleReceiptAction('gallery', false) },
                ]
            );
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) setDate(selectedDate);
    };

    useEffect(() => {
        if (!visible) return;
        const onBackPress = () => {
            onClose();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 100 }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10, width: '100%', height: '95%' }}
                    >
                        <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                            <View style={{ width: 48, height: 6, backgroundColor: '#cbd5e1', borderRadius: 9999 }} />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 9999 }}>
                                <X color="#64748b" size={20} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: Platform.OS === 'ios' ? 100 : 100 }}>

                            {/* Receipt Section */}
                            <View style={{ marginBottom: 32 }}>
                                {receipt ? (
                                    <View style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                                        <View style={{ height: 160, width: '100%', position: 'relative' }}>
                                            <Image source={{ uri: receipt.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                                            {scanning ? (
                                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                                                    <ActivityIndicator color="white" size="large" />
                                                    <Text style={{ color: 'white', marginTop: 12, fontWeight: 'bold', textAlign: 'center' }}>Analyzing with AI...</Text>
                                                    <Text style={{ color: '#c7d2fe', fontSize: 12, marginTop: 4, textAlign: 'center' }}>Reading merchant, total, and date</Text>
                                                </View>
                                            ) : null}
                                        </View>

                                        {!scanning && (
                                            <View style={{ padding: 12, backgroundColor: 'white', flexDirection: 'column', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ backgroundColor: attachReceipt ? '#eef2ff' : '#f1f5f9', padding: 8, borderRadius: 8, marginRight: 12 }}>
                                                            <Paperclip color={attachReceipt ? '#4f46e5' : '#94a3b8'} size={20} />
                                                        </View>
                                                        <View>
                                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: attachReceipt ? '#1e293b' : '#64748b' }}>
                                                                Attach to Expense
                                                            </Text>
                                                            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                                                                {attachReceipt ? 'Receipt will be saved securely' : 'Image used for scan only'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Switch
                                                        value={attachReceipt}
                                                        onValueChange={setAttachReceipt}
                                                        trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
                                                        thumbColor={attachReceipt ? '#4f46e5' : '#f8fafc'}
                                                    />
                                                </View>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#f1f5f9' }}
                                                        onPress={() => promptScanChoice('ai')}
                                                    >
                                                        <Camera color="#64748b" size={16} />
                                                        <Text style={{ color: '#475569', fontWeight: '500', marginLeft: 8, fontSize: 14 }}>Rescan</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
                                                        onPress={() => setReceipt(null)}
                                                    >
                                                        <X color="#ef4444" size={16} />
                                                        <Text style={{ color: '#ef4444', fontWeight: '500', marginLeft: 8, fontSize: 14 }}>Remove</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={{ width: '100%' }}>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            {/* Auto Scan Button */}
                                            <TouchableOpacity
                                                style={{ flex: 1, borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 16, padding: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}
                                                onPress={() => handleReceiptAction('camera', true)}
                                            >
                                                <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 12, marginBottom: 12 }}>
                                                    <Camera color="#4f46e5" size={24} />
                                                </View>
                                                <Text style={{ color: '#312e81', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>AI Scan</Text>
                                                <Text style={{ color: 'rgba(79, 70, 229, 0.7)', fontSize: 12, textAlign: 'center', lineHeight: 16 }}>
                                                    Autofill details
                                                    {'\n'}from receipt
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Manual Attach Button */}
                                            <TouchableOpacity
                                                style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}
                                                onPress={() => handleReceiptAction('gallery', false)}
                                            >
                                                <View style={{ backgroundColor: 'white', padding: 10, borderRadius: 12, marginBottom: 12 }}>
                                                    <Upload color="#64748b" size={24} />
                                                </View>
                                                <Text style={{ color: '#334155', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Attach Image</Text>
                                                <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 16 }}>
                                                    Manually enter
                                                    {'\n'}expense details
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Title & Amount */}
                            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 4 }}>Description <Text style={{ color: '#ef4444' }}>*</Text></Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 48 }}>
                                        <TextInput
                                            style={{ flex: 1, fontSize: 16, color: '#0f172a', height: '100%', paddingVertical: 0 }}
                                            placeholder="Dinner, Taxi..."
                                            value={title}
                                            onChangeText={setTitle}
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 4 }}>Amount <Text style={{ color: '#ef4444' }}>*</Text></Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 48 }}>
                                        <TouchableOpacity onPress={() => setCurrencyModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 12 }}>{currency}</Text>
                                            <ChevronDown color="#64748b" size={12} style={{ marginLeft: 4 }} />
                                        </TouchableOpacity>
                                        <TextInput
                                            style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#0f172a', height: '100%', paddingVertical: 0 }}
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
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 4 }}>Date</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <Text style={{ color: '#0f172a' }}>{date.toLocaleDateString()}</Text>
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
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 }}>Paid By</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                                    {validMembers.map((m: any) => (
                                        <TouchableOpacity
                                            key={m.id}
                                            onPress={() => setPaidBy(m.id.toString())}
                                            style={[
                                                { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, marginRight: 8, borderWidth: 1 },
                                                paidBy === m.id.toString() ? { backgroundColor: '#4f46e5', borderColor: '#4f46e5' } : { backgroundColor: 'white', borderColor: '#e2e8f0' }
                                            ]}
                                        >
                                            <Text style={[{ fontWeight: '600' }, paidBy === m.id.toString() ? { color: 'white' } : { color: '#475569' }]}>
                                                {m.id.toString() === user?.id.toString() ? 'You' : m.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Split Type */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 }}>Split Method</Text>
                                <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, borderRadius: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => setSplitType('equal')}
                                        style={[{ flex: 1, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, splitType === 'equal' ? { backgroundColor: 'white' } : { backgroundColor: 'transparent' }]}
                                    >
                                        <Users color={splitType === 'equal' ? '#4f46e5' : '#64748b'} size={14} />
                                        <Text style={[{ fontWeight: 'bold', marginLeft: 4 }, splitType === 'equal' ? { color: '#4f46e5' } : { color: '#64748b' }]}>
                                            =
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => setSplitType('percentage')}
                                        style={[{ flex: 1, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, splitType === 'percentage' ? { backgroundColor: 'white' } : { backgroundColor: 'transparent' }]}
                                    >
                                        <PercentIcon color={splitType === 'percentage' ? '#4f46e5' : '#64748b'} size={14} />
                                        <Text style={[{ fontWeight: 'bold', marginLeft: 4 }, splitType === 'percentage' ? { color: '#4f46e5' } : { color: '#64748b' }]}>
                                            %
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Custom Splits UI */}
                            {splitType !== 'equal' && (
                                <View style={{ marginBottom: 24, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', padding: 8 }}>
                                    {validMembers.map((m: any, index: number) => (
                                        <View key={m.id} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }, index !== validMembers.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' } : {}]}>
                                            <Text style={{ fontWeight: '500', color: '#1e293b', flex: 1 }} numberOfLines={1}>{m.name}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', width: 96, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, height: 40 }}>
                                                <TextInput
                                                    style={{ flex: 1, textAlign: 'right', fontWeight: '500', color: '#0f172a', height: '100%', minHeight: 40, paddingVertical: 0 }}
                                                    placeholder="0"
                                                    keyboardType="decimal-pad"
                                                    value={splits[m.id] || ''}
                                                    onChangeText={(v) => setSplits(prev => ({ ...prev, [m.id]: v }))}
                                                    placeholderTextColor="#94a3b8"
                                                />
                                                {splitType === 'percentage' && <Text style={{ color: '#94a3b8', marginLeft: 4 }}>%</Text>}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[{ width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexDirection: 'row' }, loading || scanning ? { backgroundColor: '#818cf8' } : { backgroundColor: '#4f46e5' }]}
                                onPress={handleAddExpense}
                                disabled={loading || scanning}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Check color="white" size={20} />
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 8 }}>{expenseToEdit ? 'Update Expense' : 'Save Expense'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>

                        <CurrencyPickerModal
                            visible={currencyModalVisible}
                            onClose={() => setCurrencyModalVisible(false)}
                            selectedCurrency={currency}
                            onSelect={setCurrency}
                        />
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
}
