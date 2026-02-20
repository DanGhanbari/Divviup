import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, FileText, ChevronLeft, Calendar } from 'lucide-react-native';
import api from '../../api';
import CurrencyPickerModal from '../../components/CurrencyPickerModal';

export default function CreateGroupScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter a group name');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/groups', {
                name: name.trim(),
                description: description.trim(),
                is_one_time: false,
                currency: currency
            });

            Alert.alert('Success', 'Group created successfully!', [
                { text: 'OK', onPress: () => router.push(`/(groups)/${response.data.id}`) }
            ]);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="pt-14 pb-4 px-4 bg-indigo-600 flex-row items-center border-b border-indigo-700">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ChevronLeft color="white" size={28} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Create New Group</Text>
            </View>

            <View className="flex-1 px-6 pt-6">
                <Text className="text-2xl font-bold text-slate-800 mb-2">Let's set it up</Text>
                <Text className="text-slate-500 mb-8">Give your group a name and description to get started sharing expenses.</Text>

                <View className="mb-5">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Group Name <Text className="text-red-500">*</Text></Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <Users color="#94a3b8" size={20} />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 text-base"
                            placeholder="Trip to Paris, Apartment..."
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View className="mb-5">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Description (Optional)</Text>
                    <View className="flex-row items-start bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[100px]">
                        <FileText color="#94a3b8" size={20} className="mt-1" />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 text-base"
                            placeholder="What is this group for?"
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor="#94a3b8"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Group Currency</Text>
                    <TouchableOpacity
                        onPress={() => setCurrencyModalVisible(true)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                        <View className="flex-row items-center">
                            <Text className="font-bold text-indigo-700 mr-2 text-lg">
                                {require('currency-symbol-map')(currency) || currency}
                            </Text>
                            <Text className="text-slate-800 text-base">{currency}</Text>
                        </View>
                        <ChevronLeft color="#94a3b8" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
                    </TouchableOpacity>

                    <CurrencyPickerModal
                        visible={currencyModalVisible}
                        onClose={() => setCurrencyModalVisible(false)}
                        selectedCurrency={currency}
                        onSelect={setCurrency}
                    />
                </View>

                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center justify-center shadow-md ${loading || !name.trim() ? 'bg-indigo-300 shadow-indigo-100' : 'bg-indigo-600 shadow-indigo-300'}`}
                    onPress={handleCreate}
                    disabled={loading || !name.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Create Group</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
