import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, Modal, SafeAreaView } from 'react-native';
import { Shield, BarChart2, X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COOKIE_CONSENT_KEY = '@divviup_cookie_consent';

interface CookiePreferencesModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function CookiePreferencesModal({ visible, onClose }: CookiePreferencesModalProps) {
    const [consent, setConsent] = useState({ necessary: true, analytics: false });

    useEffect(() => {
        const loadConsent = async () => {
            try {
                const saved = await AsyncStorage.getItem(COOKIE_CONSENT_KEY);
                if (saved) {
                    setConsent(JSON.parse(saved));
                }
            } catch (e) {
                console.error('Failed to load cookie consent from AsyncStorage', e);
            }
        };
        if (visible) {
            loadConsent();
        }
    }, [visible]);

    const saveConsent = async (newConsent: { necessary: boolean; analytics: boolean }) => {
        try {
            await AsyncStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
            setConsent(newConsent);
            onClose();
        } catch (e) {
            console.error('Failed to save cookie consent to AsyncStorage', e);
        }
    };

    const handleRejectOptional = () => {
        saveConsent({ necessary: true, analytics: false });
    };

    const handleSavePreferences = () => {
        saveConsent(consent);
    };

    const toggleAnalytics = () => {
        setConsent(prev => ({ ...prev, analytics: !prev.analytics }));
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
            transparent={false}
        >
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1">
                    {/* Header */}
                    <View className="p-6 pt-2 border-b border-slate-100 flex-row justify-between items-center bg-white">
                        <Text className="text-xl font-bold text-slate-800">Cookie Preferences</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="p-1 rounded-full bg-slate-100"
                        >
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View className="p-6 flex-1">
                        <Text className="text-sm text-slate-600 mb-6">
                            Make it yours. Select which cookies you allow us to use. You can change these settings at any time.
                        </Text>

                        <View className="space-y-4">
                            {/* Strictly Necessary */}
                            <View className="flex-row items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                                <View className="flex-row flex-1 pr-4">
                                    <View className="mt-0.5 mr-3">
                                        <Shield size={20} color="#4f46e5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-slate-800 text-base mb-1">Strictly Necessary</Text>
                                        <Text className="text-xs text-slate-500 leading-tight">
                                            Required for authentication and security. These cannot be disabled.
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={consent.necessary}
                                    disabled={true}
                                    trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                                    thumbColor="#ffffff"
                                    ios_backgroundColor="#cbd5e1"
                                />
                            </View>

                            {/* Analytics */}
                            <View className="flex-row items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <View className="flex-row flex-1 pr-4">
                                    <View className="mt-0.5 mr-3">
                                        <BarChart2 size={20} color="#3b82f6" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-slate-800 text-base mb-1">Analytics</Text>
                                        <Text className="text-xs text-slate-500 leading-tight">
                                            Help us improve by allowing us to collect anonymous usage data via Vercel Analytics.
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={consent.analytics}
                                    onValueChange={toggleAnalytics}
                                    trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                                    thumbColor="#ffffff"
                                    ios_backgroundColor="#cbd5e1"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="p-6 border-t border-slate-100 bg-slate-50 flex-row justify-end space-x-3 gap-3">
                        <TouchableOpacity
                            className="py-3 px-4 rounded-lg bg-slate-200 flex-1 items-center justify-center"
                            onPress={handleRejectOptional}
                        >
                            <Text className="font-semibold text-slate-700">Reject Optional</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="py-3 px-4 rounded-lg bg-indigo-600 flex-1 flex-row items-center justify-center gap-2"
                            onPress={handleSavePreferences}
                        >
                            <Check size={18} color="#ffffff" />
                            <Text className="font-semibold text-white ml-2">Save Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
