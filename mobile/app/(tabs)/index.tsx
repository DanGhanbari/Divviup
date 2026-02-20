import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Plus, Calendar, Trash2, Star } from 'lucide-react-native';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? This action cannot be undone and will delete all expenses, tasks, and balances associated with the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/groups/${groupId}`);
              fetchGroups();
            } catch (err: any) {
              console.error(err);
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete group');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderGroupCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 shadow-sm"
      onPress={() => router.push(`/(groups)/${item.id}`)}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center gap-3">
          <View className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <Users color="#4f46e5" size={24} />
          </View>
          {item.members && item.members.length > 0 && (
            <View className="flex-row items-center">
              {(() => {
                const sortedMembers = [...item.members].sort((a: any, b: any) => {
                  if (a.role === 'owner') return -1;
                  if (b.role === 'owner') return 1;
                  if (a.id === user?.id) return -1;
                  if (b.id === user?.id) return 1;
                  return a.name.localeCompare(b.name);
                });

                return (
                  <>
                    {sortedMembers.slice(0, 6).map((member: any, index: number) => {
                      let bgClass = "bg-indigo-100";
                      let textClass = "text-indigo-700";
                      let borderClass = "border-2 border-white";

                      if (member.role === 'owner') {
                        bgClass = "bg-amber-100";
                        textClass = "text-amber-700";
                      } else if (member.id === user?.id) {
                        bgClass = "bg-sky-100";
                        textClass = "text-sky-700";
                        borderClass = "border-2 border-sky-400";
                      }

                      return (
                        <View key={index} className="relative mb-3" style={{ marginLeft: index > 0 ? -12 : 0, zIndex: 100 - index }}>
                          <View
                            className={`w-8 h-8 rounded-full ${bgClass} items-center justify-center shadow-sm ${borderClass}`}
                          >
                            <Text className={`${textClass} text-xs font-bold`}>{member.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          {member.plan === 'premium' && (
                            <View className="absolute -top-1 -right-1 bg-amber-100 w-3.5 h-3.5 rounded-full items-center justify-center border border-white shadow-sm">
                              <Star color="#f59e0b" fill="#f59e0b" size={7} />
                            </View>
                          )}
                        </View>
                      );
                    })}
                    {sortedMembers.length > 6 && (
                      <View
                        className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center border-2 border-white shadow-sm"
                        style={{ marginLeft: -12 }}
                      >
                        <Text className="text-slate-600 text-[10px] font-bold">+{sortedMembers.length - 6}</Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}
        </View>
        <View className={`px-2 py-1 rounded-full flex-row items-center ${item.role === 'owner' ? 'bg-amber-100' : 'bg-slate-100'}`}>
          <Text className={`text-xs font-medium ${item.role === 'owner' ? 'text-amber-700' : 'text-slate-600'}`}>
            {item.role === 'owner' ? 'Owner' : 'Member'}
          </Text>
        </View>
      </View>

      <Text className="text-xl font-bold text-slate-800 mb-2 mt-1">{item.name}</Text>
      <Text className="text-slate-500 text-sm mb-4" numberOfLines={2}>
        {item.description || 'No description'}
      </Text>

      <View className="flex-row justify-between items-center pt-3 border-t border-slate-50">
        <View className="flex-row items-center">
          <Calendar color="#94a3b8" size={14} />
          <Text className="text-slate-400 text-xs ml-1">
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {item.role === 'owner' && (
          <TouchableOpacity
            className="p-1.5 bg-red-50 rounded-lg border border-red-100"
            onPress={() => handleDeleteGroup(item.id, item.name)}
          >
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-6 pt-16 pb-6 bg-white border-b border-slate-100 flex-row justify-between items-center">
        <View className="flex-row items-center gap-4">
          <Logo width={40} height={40} />
          <View>
            <Text className="text-sm font-medium text-slate-500">Welcome back,</Text>
            <Text className="text-2xl font-bold text-slate-900">{user?.name?.split(' ')[0] || 'User'}</Text>
          </View>
        </View>
        <View className="relative">
          <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center border-2 border-white shadow-sm">
            <Text className="text-indigo-700 font-bold text-lg">{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          {user?.plan === 'premium' && (
            <View className="absolute -top-1 -right-1 bg-amber-100 w-5 h-5 rounded-full items-center justify-center border-2 border-white shadow-sm z-10">
              <Star color="#f59e0b" fill="#f59e0b" size={10} />
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id.toString()}
          renderItem={renderGroupCard}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="bg-indigo-50 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Users color="#4f46e5" size={40} />
              </View>
              <Text className="text-lg font-bold text-slate-800 mb-2">No groups yet</Text>
              <Text className="text-slate-500 text-center mb-6">Create a group to start sharing expenses and tasks.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-md shadow-indigo-300"
        onPress={() => router.push('/(groups)/create')}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </View>
  );
}
