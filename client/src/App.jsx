import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails'; // Coming soon
import Settings from './pages/Settings';

import LandingPage from './pages/LandingPage';

import { Analytics } from '@vercel/analytics/react';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/" />;
};

function App() {
  useEffect(() => {
    if (window.location.hostname === 'divviup.vercel.app') {
      window.location.replace(`https://divviup.xyz${window.location.pathname}${window.location.search}`);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="groups/:id" element={<GroupDetails />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
