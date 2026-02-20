import { Tabs } from 'expo-router';
import React from 'react';
import { Home, User, Settings, CreditCard } from 'lucide-react-native';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function TabLayout() {
  usePushNotifications(); // Registers device on auth

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5', // indigo-600
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarStyle: {
          borderTopColor: '#f1f5f9', // slate-100
          borderTopWidth: 1,
          elevation: 0,
          backgroundColor: '#ffffff',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          title: 'Pricing',
          tabBarIcon: ({ color }) => <CreditCard color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
