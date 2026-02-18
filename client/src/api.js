import axios from 'axios';

const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return url;
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
