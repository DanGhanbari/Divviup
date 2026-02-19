import io from 'socket.io-client';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL;
    if (!url) {
        if (import.meta.env.MODE === 'production') {
            url = 'https://divviup-production.up.railway.app';
        } else {
            url = 'http://localhost:5001';
        }
    }
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return url;
};

export const socket = io(getBaseUrl(), {
    autoConnect: false,
    withCredentials: true
});
