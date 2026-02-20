import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import CookiePreferencesModal from '../../components/CookiePreferencesModal';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Lock, Save, Star, CreditCard, Calendar, AlertTriangle, LogOut, Settings as SettingsIcon, Shield } from 'lucide-react-native';
import api from '../../api';

export default function SettingsScreen() {
    const { user, refreshUser, logout } = useAuth();
    const router = useRouter();
    const [isCookiesModalVisible, setCookiesModalVisible] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (name: string, value: string) => {
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = async () => {
        if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await api.post('/auth/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            Alert.alert('Success', 'Password updated successfully');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel your Premium subscription? You will retain access until the end of your billing period.',
            [
                { text: 'No, Keep It', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.post('/payments/cancel-subscription');
                            await refreshUser();
                            Alert.alert('Canceled', 'Subscription canceled. You have access until the end of the period.');
                        } catch (err: any) {
                            console.error(err);
                            Alert.alert('Error', err.response?.data?.error || 'Failed to cancel subscription');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24, paddingBottom: 60, paddingTop: 60 }}>
            <Text className="text-3xl font-bold text-slate-800 mb-8">Settings</Text>

            {/* Profile Info Summary */}
            <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm items-center mb-8">
                <View className="relative mb-4">
                    <View className="bg-indigo-100 w-20 h-20 rounded-full items-center justify-center border-4 border-white shadow-sm">
                        <Text className="text-indigo-700 font-bold text-2xl">{user?.name?.charAt(0) || 'U'}</Text>
                    </View>
                    {user?.plan === 'premium' && (
                        <View className="absolute -top-1 -right-1 bg-amber-100 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm z-10">
                            <Star color="#f59e0b" fill="#f59e0b" size={12} />
                        </View>
                    )}
                </View>
                <Text className="text-xl font-bold text-slate-900 mb-1">{user?.name}</Text>
                <Text className="text-slate-500">{user?.email}</Text>
            </View>

            {/* Subscription Section */}
            <View className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
                <View className="flex-row items-center gap-3 mb-5">
                    <View className="bg-indigo-100 p-2 rounded-lg">
                        <CreditCard color="#4f46e5" size={20} />
                    </View>
                    <Text className="text-lg font-bold text-slate-800">Subscription</Text>
                </View>

                <View className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-sm text-slate-500 mb-1">Current Plan</Text>
                            <View className="flex-row items-center gap-2">
                                <Text className="font-bold text-lg text-slate-800">
                                    {user?.plan === 'premium' ? 'Premium' : 'Free'}
                                </Text>
                                {user?.plan === 'premium' && (
                                    <Star color="#eab308" fill="#eab308" size={16} />
                                )}
                            </View>
                        </View>
                        {user?.plan === 'premium' && user?.subscription_status === 'active' ? (
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                <Text className="text-green-700 text-xs font-bold uppercase tracking-wide">Active</Text>
                            </View>
                        ) : user?.plan === 'premium' && user?.subscription_status === 'canceled' ? (
                            <View className="bg-yellow-100 px-3 py-1 rounded-full">
                                <Text className="text-yellow-700 text-xs font-bold uppercase tracking-wide">Canceled</Text>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => router.push('/(tabs)/pricing')}>
                                <Text className="text-indigo-600 font-medium text-sm">Upgrade to Premium</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {user?.plan === 'premium' && (
                        <View className="border-t border-slate-200 pt-4 mt-2">
                            <View className="flex-row justify-between mb-4">
                                <View className="flex-1 mr-2">
                                    <Text className="text-slate-500 text-xs mb-1">Member Since</Text>
                                    <Text className="font-medium text-slate-800 text-sm">{formatDate(user?.created_at)}</Text>
                                </View>
                                <View className="flex-1 ml-2">
                                    <Text className="text-slate-500 text-xs mb-1">
                                        {user?.subscription_status === 'canceled' ? 'Expires On' : 'Next Billing Date'}
                                    </Text>
                                    <Text className="font-medium text-slate-800 text-sm">{formatDate(user?.current_period_end)}</Text>
                                </View>
                            </View>

                            {user?.subscription_status === 'active' && (
                                <TouchableOpacity
                                    onPress={handleCancelSubscription}
                                    disabled={loading}
                                    className="flex-row items-center mt-2"
                                >
                                    <Text className="text-red-600 font-medium text-sm">Cancel Subscription</Text>
                                </TouchableOpacity>
                            )}

                            {user?.subscription_status === 'canceled' && (
                                <View className="flex-row gap-2 mt-2 items-center">
                                    <AlertTriangle color="#64748b" size={14} />
                                    <Text className="text-xs text-slate-500 flex-1">
                                        Your subscription will reset to Free on {formatDate(user?.current_period_end)}.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Password Section */}
            <View className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-8">
                <View className="flex-row items-center gap-3 mb-5">
                    <View className="bg-indigo-100 p-2 rounded-lg">
                        <Lock color="#4f46e5" size={20} />
                    </View>
                    <Text className="text-lg font-bold text-slate-800">Change Password</Text>
                </View>

                <View className="space-y-4">
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-700 mb-2">Current Password</Text>
                        <TextInput
                            secureTextEntry
                            value={passwords.oldPassword}
                            onChangeText={(text) => handleChange('oldPassword', text)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                            placeholder="Enter current password"
                        />
                    </View>
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-700 mb-2">New Password</Text>
                        <TextInput
                            secureTextEntry
                            value={passwords.newPassword}
                            onChangeText={(text) => handleChange('newPassword', text)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                            placeholder="Enter new password (min. 6 characters)"
                        />
                    </View>
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-slate-700 mb-2">Confirm New Password</Text>
                        <TextInput
                            secureTextEntry
                            value={passwords.confirmPassword}
                            onChangeText={(text) => handleChange('confirmPassword', text)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800"
                            placeholder="Confirm new password"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handlePasswordChange}
                        disabled={loading}
                        className={`bg-indigo-600 py-3 rounded-xl flex-row justify-center items-center shadow-sm ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Save color="white" size={18} />
                                <Text className="text-white font-bold ml-2">Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Legal & Privacy Section */}
            <View className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-8">
                <View className="flex-row items-center gap-3 mb-5">
                    <View className="bg-indigo-100 p-2 rounded-lg">
                        <Shield color="#4f46e5" size={20} />
                    </View>
                    <Text className="text-lg font-bold text-slate-800">Legal & Privacy</Text>
                </View>

                <View className="space-y-1">
                    <TouchableOpacity
                        onPress={() => Linking.openURL('https://divviup.xyz/terms')}
                        className="flex-row items-center justify-between py-3 border-b border-slate-100"
                    >
                        <Text className="text-slate-700 font-medium">Terms & Conditions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => Linking.openURL('https://divviup.xyz/privacy')}
                        className="flex-row items-center justify-between py-3 border-b border-slate-100"
                    >
                        <Text className="text-slate-700 font-medium">Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setCookiesModalVisible(true)}
                        className="flex-row items-center justify-between py-3"
                    >
                        <Text className="text-slate-700 font-medium">Cookies Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout Action */}
            <TouchableOpacity
                className="bg-red-50 flex-row justify-center items-center py-4 rounded-xl border border-red-100 shadow-sm"
                onPress={logout}
            >
                <LogOut color="#ef4444" size={20} />
                <Text className="ml-2 font-bold text-red-600">Log Out</Text>
            </TouchableOpacity>

            <CookiePreferencesModal visible={isCookiesModalVisible} onClose={() => setCookiesModalVisible(false)} />
        </ScrollView>
    );
}
