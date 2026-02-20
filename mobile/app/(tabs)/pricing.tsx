import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Star, Shield, Zap, TrendingUp, Download, CheckSquare } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function PricingScreen() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // For the React Native implementation, instead of window.location,
    // we would ideally use a WebView or Linking to open Stripe Checkout.
    // We'll simulate it for now with an alert if we don't have Linking set up.
    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const response = await api.post('/payments/create-checkout-session');
            if (response.data && response.data.url) {
                // Fallback alert pointing users to the web.
                Alert.alert('Upgrade', `Please visit our website to complete the upgrade process. Link: ${response.data.url}`);
            } else {
                Alert.alert('Error', 'Failed to initiate upgrade. No URL returned.');
            }
        } catch (error: any) {
            console.error('Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Confirm Downgrade',
            'Are you sure you want to downgrade to Free? You will retain Premium access until the end of your billing period.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Downgrade',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.post('/payments/cancel-subscription');
                            await refreshUser();
                            Alert.alert('Success', 'Subscription canceled. You will be downgraded at the end of the billing period.');
                        } catch (error: any) {
                            console.error('Error:', error);
                            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel subscription.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                <View className="items-center mb-8 pt-8">
                    <View className="bg-indigo-100 p-4 rounded-full mb-4">
                        <Star color="#4f46e5" size={32} />
                    </View>
                    <Text className="text-3xl font-bold text-slate-800 text-center mb-2">Choose Your Plan</Text>
                    <Text className="text-slate-500 text-center">Upgrade to Premium to unlock unlimited groups, members, and advanced features.</Text>
                </View>

                {/* Free Plan */}
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-2xl font-bold text-slate-800">Free</Text>
                        <View className="bg-slate-100 px-3 py-1 rounded-full">
                            <Text className="text-slate-600 font-medium text-xs">Basic</Text>
                        </View>
                    </View>

                    <View className="flex-row items-end mb-6">
                        <Text className="text-4xl font-black text-slate-900">$0</Text>
                        <Text className="text-slate-500 mb-1 ml-1 font-medium">/mo</Text>
                    </View>

                    <View className="space-y-4 mb-8">
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-1 rounded-full mr-3"><Check color="#16a34a" size={14} strokeWidth={3} /></View>
                            <Text className="text-slate-600 font-medium">1 Group</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-1 rounded-full mr-3"><Check color="#16a34a" size={14} strokeWidth={3} /></View>
                            <Text className="text-slate-600 font-medium">1 Member per Group</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-1 rounded-full mr-3"><Check color="#16a34a" size={14} strokeWidth={3} /></View>
                            <Text className="text-slate-600 font-medium">Equal Splits</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-1 rounded-full mr-3"><Check color="#16a34a" size={14} strokeWidth={3} /></View>
                            <Text className="text-slate-600 font-medium">2 Tasks per Group</Text>
                        </View>
                    </View>

                    {user?.plan === 'premium' ? (
                        user?.subscription_status === 'active' ? (
                            <TouchableOpacity
                                onPress={handleCancel}
                                disabled={loading}
                                className="w-full py-4 bg-red-50 rounded-xl items-center"
                            >
                                <Text className="text-red-600 font-bold text-lg">{loading ? 'Processing...' : 'Downgrade to Free'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="w-full py-4 bg-slate-100 rounded-xl items-center opacity-70">
                                <Text className="text-slate-500 font-bold">Downgrade Scheduled ({formatDate(user?.current_period_end)})</Text>
                            </View>
                        )
                    ) : (
                        <View className="w-full py-4 bg-slate-100 rounded-xl items-center border border-slate-200">
                            <Text className="text-slate-400 font-bold text-lg">Current Plan</Text>
                        </View>
                    )}
                </View>

                {/* Premium Plan */}
                <View className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 relative overflow-hidden">
                    {/* Background elements */}
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full opacity-50" />
                    <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-700 rounded-full opacity-50" />

                    <View className="absolute top-0 right-0 bg-amber-400 px-4 py-1.5 rounded-bl-xl z-10">
                        <Text className="text-amber-900 text-xs font-black tracking-wider border-0">POPULAR</Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-4 z-10">
                        <Text className="text-2xl font-bold text-white">Premium</Text>
                    </View>

                    <View className="flex-row items-end mb-6 z-10">
                        <Text className="text-5xl font-black text-white">$5</Text>
                        <Text className="text-indigo-200 mb-1.5 ml-1 font-medium text-lg">/mo</Text>
                    </View>

                    <View className="space-y-4 mb-8 z-10">
                        <View className="flex-row items-center">
                            <View className="bg-indigo-400 p-1.5 rounded-full mr-3"><Check color="#ffffff" size={14} strokeWidth={3} /></View>
                            <Text className="text-indigo-50 font-medium text-base">Unlimited Groups</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-indigo-400 p-1.5 rounded-full mr-3"><Check color="#ffffff" size={14} strokeWidth={3} /></View>
                            <Text className="text-indigo-50 font-medium text-base">Unlimited Members</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-indigo-400 p-1.5 rounded-full mr-3"><CheckSquare color="#ffffff" size={14} strokeWidth={3} /></View>
                            <Text className="text-indigo-50 font-medium text-base">Unlimited Tasks</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-indigo-400 p-1.5 rounded-full mr-3"><Download color="#ffffff" size={14} strokeWidth={3} /></View>
                            <Text className="text-indigo-50 font-medium text-base">Export PDF Reports</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="bg-indigo-400 p-1.5 rounded-full mr-3"><TrendingUp color="#ffffff" size={14} strokeWidth={3} /></View>
                            <Text className="text-indigo-200 font-medium text-sm">Advanced Split Types (Soon)</Text>
                        </View>
                    </View>

                    {user?.plan === 'premium' ? (
                        user?.subscription_status === 'active' ? (
                            <View className="w-full py-4 bg-indigo-500 rounded-xl items-center z-10 border border-indigo-400">
                                <Text className="text-white font-bold text-lg">Active Plan</Text>
                            </View>
                        ) : (
                            <View className="w-full py-4 bg-amber-500 rounded-xl items-center z-10">
                                <Text className="text-amber-50 font-bold">Expires on {formatDate(user?.current_period_end)}</Text>
                            </View>
                        )
                    ) : (
                        <TouchableOpacity
                            onPress={handleUpgrade}
                            disabled={loading}
                            className="w-full py-4 bg-white rounded-xl flex-row justify-center items-center z-10 shadow-sm"
                        >
                            {loading ? (
                                <ActivityIndicator color="#4f46e5" />
                            ) : (
                                <Text className="text-indigo-600 font-black text-lg">Upgrade Now</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
