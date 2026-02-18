import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LandingPage from './pages/LandingPage';
import { Analytics } from '@vercel/analytics/react';
import CookieConsent from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/" />;
};

function App() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    if (window.location.hostname === 'divviup.vercel.app') {
      window.location.replace(`https://divviup.xyz${window.location.pathname}${window.location.search}`);
    }

    // Initial consent check
    const saved = localStorage.getItem('cookie_consent');
    if (saved) {
      setAnalyticsConsent(JSON.parse(saved).analytics);
    }
  }, []);

  const handleConsentChange = (newConsent) => {
    setAnalyticsConsent(newConsent.analytics);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected App Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="groups/:id" element={<GroupDetails />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pricing" element={<Pricing />} />
          </Route>
        </Routes>
        <CookieConsent onConsentChange={handleConsentChange} />
        {analyticsConsent && <Analytics />}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
