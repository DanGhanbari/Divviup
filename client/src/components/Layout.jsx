import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, PlusCircle, Settings, CreditCard, User } from 'lucide-react';
import pkg from '../../package.json';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        navigate('/');
        logout();
    };

    const isActive = (path) => location.pathname === path;

    // Scroll Detection for Mobile Nav
    const [showMobileNav, setShowMobileNav] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    React.useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) { // Scroll Down > 100px
                    setShowMobileNav(false);
                } else { // Scroll Up
                    setShowMobileNav(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-0">
            {/* Desktop & Tablet Header */}
            <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-sm border-b border-white/20 transition-all duration-200 hidden md:block">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/dashboard" className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-800 hover:text-indigo-600 transition-colors">
                        DivviUp
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Link to="/dashboard" className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all font-medium text-sm ${isActive('/dashboard') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'}`}>
                            <Home size={16} /> Dashboard
                        </Link>
                        <Link to="/dashboard/pricing" className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all font-medium text-sm ${isActive('/dashboard/pricing') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'}`}>
                            <CreditCard size={16} /> Pricing
                        </Link>

                        <div className="pl-4 ml-2 border-l border-slate-200 flex items-center gap-3">
                            <div className="flex items-center gap-2 mr-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold relative ${user?.plan === 'premium' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-indigo-100 text-indigo-700'}`} title={user?.name}>
                                    {user?.name?.charAt(0)}
                                    {user?.plan === 'premium' && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                            </div>

                            <Link
                                to="/dashboard/settings"
                                className={`p-2 rounded-full transition-colors ${isActive('/dashboard/settings') ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'}`}
                                title="Settings"
                            >
                                <Settings size={20} />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Mobile Header (Logo only) */}
            <header className="sticky top-0 z-50 bg-indigo-50/95 backdrop-blur-xl border-b border-indigo-200/50 md:hidden">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/dashboard" className="text-xl font-bold tracking-tight text-slate-800">
                        DivviUp
                    </Link>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold relative ${user?.plan === 'premium' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-indigo-100 text-indigo-700'}`}>
                        {user?.name?.charAt(0)}
                        {user?.plan === 'premium' && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white"></div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-6 md:py-8 md:pt-24">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className={`fixed left-4 right-4 bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg z-50 md:hidden transition-all duration-600 ease-in-out ${showMobileNav ? 'bottom-4 opacity-100' : '-bottom-24 opacity-0'}`}>
                <div className="flex justify-around items-center px-1 py-2">
                    <Link to="/dashboard" className={`flex flex-col items-center p-1.5 rounded-lg ${isActive('/dashboard') ? 'text-indigo-600' : 'text-slate-500'}`}>
                        <Home size={22} strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Home</span>
                    </Link>
                    <Link to="/dashboard/pricing" className={`flex flex-col items-center p-1.5 rounded-lg ${isActive('/dashboard/pricing') ? 'text-indigo-600' : 'text-slate-500'}`}>
                        <CreditCard size={22} strokeWidth={isActive('/dashboard/pricing') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Pricing</span>
                    </Link>
                    <Link to="/dashboard/settings" className={`flex flex-col items-center p-1.5 rounded-lg ${isActive('/dashboard/settings') ? 'text-indigo-600' : 'text-slate-500'}`}>
                        <Settings size={22} strokeWidth={isActive('/dashboard/settings') ? 2.5 : 2} />
                        <span className="text-[10px] font-medium mt-0.5">Settings</span>
                    </Link>
                    <button onClick={handleLogout} className="flex flex-col items-center p-1.5 rounded-lg text-slate-500 hover:text-red-500">
                        <LogOut size={22} />
                        <span className="text-[10px] font-medium mt-0.5">Logout</span>
                    </button>
                </div>
            </nav>

            <footer className="bg-white border-t border-slate-200 mt-auto hidden md:block">
                <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <div className="flex flex-col gap-1 mb-4 md:mb-0">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-700">DivviUp</span>
                            <span>&copy; {new Date().getFullYear()} DivviUp. All rights reserved.</span>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-400">
                            <Link to="/privacy" className="hover:text-slate-500 transition-colors">Privacy Policy</Link>
                            <span>|</span>
                            <Link to="/terms" className="hover:text-slate-500 transition-colors">Terms & Conditions</Link>
                            <span>|</span>
                            <span className="hover:text-slate-500 transition-colors cursor-pointer">Cookie Settings</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <span>v{pkg.version}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
