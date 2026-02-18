import React from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { CheckCircle, DollarSign, Users, ShoppingBag, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 overflow-hidden">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <img src="/Divviup-logo.svg" alt="DivviUp Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold text-slate-900 tracking-tight">DivviUp</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-slate-600 font-medium hover:text-indigo-600 transition">Log in</Link>
                    <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-20 pb-32 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 border border-indigo-100">
                            New: AI-Powered Debt Minimization
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-8">
                            Split bills, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">not friendships.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                            The all-in-one group manager for roommates, trips, and friends. Track expenses, split chores, and manage shared inventories effortlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xl shadow-indigo-200">
                                Start for Free <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full text-lg font-bold hover:bg-slate-50 transition">
                                View Dashboard
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Abstract Background Decoration */}
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] sm:w-[800px] h-[500px] sm:h-[800px] bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none" />
            </header>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12">
                        <motion.div
                            className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl transition duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Expense Splitting</h3>
                            <p className="text-slate-600">Split costs equally, by percentage, or by custom shares. Our algorithm finds the simplest way to settle up.</p>
                        </motion.div>

                        <motion.div
                            className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl transition duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <ShoppingBag size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Collaborative Lists</h3>
                            <p className="text-slate-600">Never forget to buy milk again. Shared shopping lists that sync in real-time for the whole household.</p>
                        </motion.div>

                        <motion.div
                            className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl transition duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Task Assignments</h3>
                            <p className="text-slate-600">Delegate chores and tasks fairly. track who did what and keep the group accountable.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="py-20 bg-slate-900 text-white text-center">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold mb-8">Trusted by groups everywhere</h2>
                    <div className="flex flex-wrap justify-center gap-8 opacity-60">
                        <div className="flex items-center gap-2 text-xl font-semibold"><Users size={24} /> Roommates</div>
                        <div className="flex items-center gap-2 text-xl font-semibold"><Users size={24} /> Travel Squads</div>
                        <div className="flex items-center gap-2 text-xl font-semibold"><Users size={24} /> Couples</div>
                        <div className="flex items-center gap-2 text-xl font-semibold"><Users size={24} /> Families</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-50 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <p>© {new Date().getFullYear()} DivviUp. All rights reserved.</p>
                <div className="flex gap-2 text-xs text-slate-400">
                    <Link to="/privacy" className="hover:text-slate-500 transition-colors">Privacy Policy</Link>
                    <span>|</span>
                    <Link to="/terms" className="hover:text-slate-500 transition-colors">Terms & Conditions</Link>
                    <span>|</span>
                    <button
                        onClick={() => window.dispatchEvent(new Event('openCookieSettings'))}
                        className="hover:text-slate-500 transition-colors cursor-pointer"
                    >
                        Cookie Settings
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
