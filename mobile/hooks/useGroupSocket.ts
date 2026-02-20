import { useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';
import { getItemAsync } from '../utils/storage';

const getSocketUrl = () => {
    const baseURL = api.defaults.baseURL || 'http://localhost:5001/api';
    return baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
}

export function useGroupSocket(groupId: string | string[], onUpdate: () => void) {
    useEffect(() => {
        if (!groupId) return;

        const id = Array.isArray(groupId) ? groupId[0] : groupId;
        const socketUrl = getSocketUrl();

        let socket: any;

        const initSocket = async () => {
            // Note: Since mobile uses Authorization headers instead of cookies, 
            // passing the token down to socket io handshake is best practice
            const token = await getItemAsync('token');

            socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket'], // Force WebSocket instead of HTTP polling for React Native
            });

            socket.emit('join_group', id);

            socket.on('group_updated', (data: any) => {
                if (String(data?.groupId) === String(id)) {
                    onUpdate();
                }
            });
        };

        initSocket();

        return () => {
            if (socket) {
                socket.emit('leave_group', id);
                socket.disconnect();
            }
        };
    }, [groupId]);
}
