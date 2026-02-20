import React, { createContext, useState, useEffect, useContext } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../api';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const token = await getItemAsync('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Apply Biometric Security Check
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const authResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Unlock DivviUp',
                    fallbackLabel: 'Use Password'
                });

                if (!authResult.success) {
                    // Failed biometrics or cancelled -> force manual login
                    await deleteItemAsync('token');
                    setUser(null);
                    setLoading(false);
                    return;
                }
            }

            const res = await api.get('/auth/me');
            setUser(res.data || null);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.token) {
            await setItemAsync('token', res.data.token);
        }
        setUser(res.data.user);
        return res.data;
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await api.post('/auth/register', { name, email, password });
        if (res.data.token) {
            await setItemAsync('token', res.data.token);
        }
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed on backend, clearing locally', err);
        } finally {
            await deleteItemAsync('token');
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to refresh user', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
