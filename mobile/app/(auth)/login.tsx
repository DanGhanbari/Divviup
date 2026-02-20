import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import Logo from '../../components/Logo';

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            // Router automatically handles redirecting to (tabs) due to RootLayoutNav logic
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to login. Please check your credentials.';
            Alert.alert('Login Failed', errorMsg);
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
                <View className="mb-2">
                    <Logo width={72} height={72} />
                </View>
                <Text className="text-3xl font-bold text-slate-900">Welcome Back</Text>
                <Text className="text-slate-500 mt-2 text-center">Enter your details to access your account</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Email</Text>
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

                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Password</Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <Lock color="#94a3b8" size={20} />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 text-base"
                            placeholder="••••••••"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <TouchableOpacity
                        className="mt-2 self-end"
                        onPress={() => router.push('/(auth)/forgot-password')}
                    >
                        <Text className="text-sm font-medium text-indigo-600">Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className="w-full bg-indigo-600 py-4 rounded-xl items-center justify-center mt-2 shadow-sm shadow-indigo-300"
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-slate-500">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text className="text-indigo-600 font-bold">Sign up</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
