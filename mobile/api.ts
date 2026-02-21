import axios from 'axios';
import { Platform } from 'react-native';
import { getItemAsync, deleteItemAsync } from './utils/storage';

const getBaseUrl = () => {
    // Android emulator needs 10.0.2.2 to access localhost. iOS simulator can use localhost.
    if (__DEV__) {
        // For physical devices (Expo Go), use your computer's local WiFi IP address.
        // If you are using an Android Emulator, 10.0.2.2 would be used instead.
        return 'http://192.168.1.70:5001';
    }
    // Production URL: Note to replace when deploying
    return 'https://app.divviup.com/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

// Request interceptor to inject Authorization header
api.interceptors.request.use(async (config) => {
    try {
        const token = await getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.error('Error fetching token for request', e);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized, i.e., token expired
            await deleteItemAsync('token');
            // AuthContext will handle state updates or redirects
        }
        return Promise.reject(error);
    }
);

export default api;
