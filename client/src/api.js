import axios from 'axios';

const getBaseUrl = () => {
    // In development, use the local backend
    if (import.meta.env.DEV) {
        return 'http://localhost:5001';
    }
    // In production, use the relative /api path which Vercel rewrites to the backend
    return '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true, // Send cookies with requests
});

// Response interceptor to handle 401 (optional, but good for clearing state if needed)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
