import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import api from '../../api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            Alert.alert('Success', response.data.message || 'If an account exists, a reset link has been sent.', [
                { text: 'Back to Login', onPress: () => router.back() }
            ]);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to send reset email. Please try again later.';
            Alert.alert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-50 justify-center px-6"
        >
            <View className="mb-10 items-center">
                <Text className="text-3xl font-bold text-slate-900">Reset Password</Text>
                <Text className="text-slate-500 mt-2 text-center text-base px-4">
                    Enter your email to receive a password reset link
                </Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Email Address</Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <Mail color="#94a3b8" size={20} />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 text-base"
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    className="w-full bg-indigo-600 py-4 rounded-xl items-center justify-center mt-2 shadow-sm shadow-indigo-300"
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Send Reset Link</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-indigo-600 font-medium">← Back to Login</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
