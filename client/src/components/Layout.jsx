import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, PlusCircle } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate('/');
        logout();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="sticky top-0 z-50 bg-indigo-50/80 backdrop-blur-xl border-b border-indigo-200/50 transition-all duration-200">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/dashboard" className="text-2xl font-bold tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                        DivviUp
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 hover:shadow-sm transition-all font-medium text-sm">
                            <Home size={16} /> Dashboard
                        </Link>
                        <div className="pl-4 ml-2 border-l border-slate-200 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm" title={user?.name}>
                                {user?.name?.charAt(0)}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </nav>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
                <Outlet />
            </main>
            <footer className="bg-white border-t border-slate-200 mt-auto">
                <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <span className="font-bold text-slate-700">DivviUp</span>
                        <span>&copy; {new Date().getFullYear()} DivviUp. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span>v1.0.0</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
