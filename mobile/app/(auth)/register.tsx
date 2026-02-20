import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { User, Lock, Mail } from 'lucide-react-native';
import Logo from '../../components/Logo';

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            // Router automatically handles redirecting to (tabs) due to RootLayoutNav logic
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
            Alert.alert('Sign Up Failed', errorMsg);
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
                <View className="mb-4">
                    <Logo width={72} height={72} />
                </View>
                <Text className="text-3xl font-bold text-slate-900">Create Account</Text>
                <Text className="text-slate-500 mt-2 text-center">Start splitting expenses instantly</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Full Name</Text>
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <User color="#94a3b8" size={20} />
                        <TextInput
                            className="flex-1 ml-3 text-slate-900 text-base"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

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
                </View>

                <TouchableOpacity
                    className="w-full bg-indigo-600 py-4 rounded-xl items-center justify-center mt-2 shadow-sm shadow-indigo-300"
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign Up</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-slate-500">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-indigo-600 font-bold">Sign in</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
