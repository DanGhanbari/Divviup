import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error;
            setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) || 'Failed to login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 relative">
            <Link to="/" className="absolute top-4 left-4 text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm">
                ← Back to Home
            </Link>
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">Welcome Back</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-600">
                    Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
