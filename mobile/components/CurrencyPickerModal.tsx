import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Search, Check } from 'lucide-react-native';
import currencyCodes from 'currency-codes';
import getSymbolFromCurrency from 'currency-symbol-map';

interface CurrencyPickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedCurrency: string;
    onSelect: (currencyCode: string) => void;
}

export default function CurrencyPickerModal({ visible, onClose, selectedCurrency, onSelect }: CurrencyPickerModalProps) {
    const [search, setSearch] = useState('');

    const currencies = useMemo(() => {
        return currencyCodes.data.map(c => ({
            code: c.code,
            name: c.currency,
            symbol: getSymbolFromCurrency(c.code) || c.code
        }));
    }, []);

    const filteredCurrencies = useMemo(() => {
        const query = search.toLowerCase();
        if (!query) return currencies;
        return currencies.filter(c =>
            c.code.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query)
        );
    }, [search, currencies]);

    const renderItem = ({ item }: { item: any }) => {
        const isSelected = item.code === selectedCurrency;
        return (
            <TouchableOpacity
                className={`flex-row items-center justify-between p-4 border-b border-slate-100 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}
                onPress={() => {
                    onSelect(item.code);
                    onClose();
                }}
            >
                <View className="flex-row items-center flex-1 pr-4">
                    <View className="w-12 items-center justify-center">
                        <Text className={`text-lg font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {item.symbol}
                        </Text>
                    </View>
                    <View className="flex-1 ml-2">
                        <Text className={`font-bold text-base ${isSelected ? 'text-indigo-800' : 'text-slate-800'}`}>
                            {item.code}
                        </Text>
                        <Text className={`text-sm ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </View>
                </View>
                {isSelected && <Check color="#4f46e5" size={20} />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-white">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-200">
                        <Text className="text-xl font-bold text-slate-900">Select Currency</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
                            <X color="#64748b" size={20} />
                        </TouchableOpacity>
                    </View>

                    <View className="p-4 border-b border-slate-100 bg-slate-50">
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-2">
                            <Search color="#94a3b8" size={20} />
                            <TextInput
                                className="flex-1 ml-3 text-slate-900 text-base py-2"
                                placeholder="Search currencies..."
                                value={search}
                                onChangeText={setSearch}
                                placeholderTextColor="#94a3b8"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                            />
                        </View>
                    </View>

                    <FlatList
                        data={filteredCurrencies}
                        keyExtractor={item => item.code}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="handled"
                        initialNumToRender={20}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}
