import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import api from '../api';

import Constants, { ExecutionEnvironment } from 'expo-constants';

// Do not require globally - this causes a crash on Android Expo Go SDK 53 during module initialization.
let isPushSupported = true;

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const [notification, setNotification] = useState<any | undefined>(undefined);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        if (!isPushSupported || Platform.OS === 'web') return;

        // Skip completely in Android Expo Go to avoid the module's loud internal console.error
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        if (isExpoGo && Platform.OS === 'android') {
            console.warn('Push notifications are completely bypassed in Expo Go on Android.');
            return;
        }

        let Notifications: any;
        try {
            Notifications = require('expo-notifications');
        } catch (e) {
            isPushSupported = false;
            console.warn('Push notifications are not supported in this environment.');
            return;
        }

        registerForPushNotificationsAsync(Notifications).then(token => {
            if (token) {
                setExpoPushToken(token);
                // Send token to our backend to associate with the user
                api.post('/users/push-token', { token })
                    .catch(err => console.error('Failed to save push token', err));
            }
        });

        if (Notifications.addNotificationReceivedListener) {
            notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
                setNotification(notification);
            });
        }

        if (Notifications.addNotificationResponseReceivedListener) {
            responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
                console.log('Notification response:', response);
            });
        }

        return () => {
            if (notificationListener.current?.remove) notificationListener.current.remove();
            if (responseListener.current?.remove) responseListener.current.remove();
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
}

async function registerForPushNotificationsAsync(Notifications: any) {
    if (!Notifications) return null;
    let token;

    if (Platform.OS === 'web') {
        return null;
    }

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (e) {
            console.warn('Failed to set notification channel (likely unsupported in Expo Go).');
            return null;
        }
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return null;
        }

        try {
            const projectId = 'your-project-id-here'; // Replace with EAS projectId in real app
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        } catch (e) {
            console.warn('Could not fetch push token. Make sure projectId is setup if using EAS.', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
