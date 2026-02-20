import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { ChevronLeft, Search, UserPlus, Mail } from 'lucide-react-native';
import api from '../../api';

interface ContactWithEmail {
    id: string;
    name: string;
    email: string;
}

export default function InviteContactScreen() {
    const { groupId } = useLocalSearchParams();
    const router = useRouter();
    const [contacts, setContacts] = useState<ContactWithEmail[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Emails],
                });

                if (data.length > 0) {
                    // Filter contacts to only those with emails since our backend requires email
                    const validContacts: ContactWithEmail[] = [];
                    data.forEach(c => {
                        if (c.emails && c.emails.length > 0 && c.emails[0].email) {
                            validContacts.push({
                                id: c.id,
                                name: c.name || 'Unknown',
                                email: c.emails[0].email
                            });
                        }
                    });
                    setContacts(validContacts);
                }
            } else {
                Alert.alert('Permission Denied', 'We need contacts access to find your friends.');
            }
            setLoading(false);
        })();
    }, []);

    const handleInvite = async (email: string) => {
        setInviting(email);
        try {
            await api.post(`/groups/${groupId}/invite`, { email });
            Alert.alert('Success', `Invitation sent to ${email}`);
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to send invite');
        } finally {
            setInviting(null);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const renderContact = ({ item }: { item: ContactWithEmail }) => (
        <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm border border-slate-100">
            <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-indigo-700 font-bold text-lg">{item.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
                <Text className="font-bold text-slate-800 text-lg">{item.name}</Text>
                <Text className="text-slate-500 text-sm flex-row items-center mt-1">
                    <Mail size={12} color="#94a3b8" /> {item.email}
                </Text>
            </View>
            <TouchableOpacity
                className="bg-indigo-50 p-3 rounded-xl border border-indigo-100"
                onPress={() => handleInvite(item.email)}
                disabled={inviting !== null}
            >
                {inviting === item.email ? (
                    <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                    <UserPlus color="#4f46e5" size={20} />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="pt-14 pb-4 px-4 bg-white border-b border-slate-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
                    <ChevronLeft color="#334155" size={28} />
                </TouchableOpacity>
                <Text className="text-slate-900 text-xl font-bold flex-1">Invite Friends</Text>
            </View>

            <View className="px-5 pt-4 pb-2">
                <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                    <Search color="#94a3b8" size={20} />
                    <TextInput
                        className="flex-1 ml-3 text-slate-900 text-base"
                        placeholder="Search contacts..."
                        value={search}
                        onChangeText={setSearch}
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text className="text-slate-500 mt-4 font-medium">Loading your contacts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={c => c.id}
                    renderItem={renderContact}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 mt-10">
                            <Text className="text-lg font-bold text-slate-700 mb-2">No contacts found</Text>
                            <Text className="text-slate-500 text-center">We couldn't find any contacts with email addresses saved.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
