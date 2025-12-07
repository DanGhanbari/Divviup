import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, PlusCircle } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-indigo-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        DivviUp
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link to="/" className="hover:text-indigo-200 transition flex items-center gap-1">
                            <Home size={18} /> Dashboard
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium opacity-90">Hi, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded text-sm transition flex items-center gap-1"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </nav>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
