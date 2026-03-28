/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ListingGenerator } from './components/generator/ListingGenerator';
import { VirtualStaging } from './components/generator/VirtualStaging';
import { MarketReport } from './components/generator/MarketReport';
import { LeadBot } from './components/bot/LeadBot';
import { LeadsDashboard } from './components/leads/LeadsDashboard';
import ReelGenerator from './components/generator/ReelGenerator';
import { SignIn, SignUp } from './components/auth/AuthPages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Settings } from './components/Settings';
import PropertyLandingPage from './components/public/PropertyLandingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      <Toaster position="top-center" richColors />
      
      {token && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}

      {/* Mobile Header */}
      {token && (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="font-black text-black text-xs">EF</span>
            </div>
            <span className="font-bold tracking-tight">EstateFlow<span className="text-orange-500">AI</span></span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className={token ? "lg:pl-72 min-h-screen" : "min-h-screen"}>
        <div className={token ? "max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12" : ""}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><ReelGenerator /></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute><ListingGenerator /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><LeadsDashboard /></ProtectedRoute>} />
            <Route path="/staging" element={<ProtectedRoute><VirtualStaging /></ProtectedRoute>} />
            <Route path="/lead-bot" element={<ProtectedRoute><LeadBot /></ProtectedRoute>} />
            <Route path="/market-report" element={<ProtectedRoute><MarketReport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/property/:id" element={<PropertyLandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
