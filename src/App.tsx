import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdRedirectPage } from './pages/AdRedirectPage';

const AppContent: React.FC = () => {
  const { user, logout } = useApp();
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [activeTab, setActiveTab] = useState<string>('links');

  // Handle routing navigation
  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Support direct address path routing (/s/code) simulation
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path.startsWith('/s/') || params.has('code')) {
      setCurrentPage('ad-redirect');
    }
  }, []);

  // Security Gate & Automatic Redirect Controls
  useEffect(() => {
    if (user) {
      if (user.role !== 'USER') {
        if (currentPage === 'login' || currentPage === 'landing') {
          setCurrentPage('dashboard');
        }
      } else {
        logout();
        setCurrentPage('landing');
      }
    } else {
      if (currentPage === 'dashboard') {
        setCurrentPage('login');
      }
    }
  }, [user, currentPage, logout]);

  // Update tabs based on role change convenience to prevent layout breaks
  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setActiveTab('super-analytics');
      } else if (user.role === 'ADMIN') {
        setActiveTab('users-manage');
      } else {
        setActiveTab('links');
      }
    }
  }, [user?.role]);

  // Page Routing Switch
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'pricing':
        return <PricingPage />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'ad-redirect':
        return <AdRedirectPage onNavigate={navigate} />;
      case 'dashboard':
        if (!user || user.role === 'USER') {
          return <LoginPage onNavigate={navigate} />;
        }
        return (
          <DashboardPage activeTab={activeTab} setActiveTab={setActiveTab} />
        );
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  // Separate ad-redirect templates from system wrapper layouts
  if (currentPage === 'ad-redirect') {
    return <>{renderPage()}</>;
  }

  // Dashboard layout with Sidebar
  const isDashboardLayout = currentPage === 'dashboard' && user && user.role !== 'USER';

  return (
    <div className="flex flex-col min-h-screen bg-[#08080c] relative">
      {/* Top Navbar */}
      <Navbar onNavigate={navigate} currentPage={currentPage} />

      {/* Main panel layout structure */}
      <div className="flex flex-1">
        {isDashboardLayout && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        
        <main className={`flex-1 ${isDashboardLayout ? 'p-6 lg:p-8' : 'w-full'}`}>
          {renderPage()}
        </main>
      </div>

      {/* Landing Footer */}
      {!isDashboardLayout && (
        <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 font-semibold select-none bg-background-sidebar">
          <p>© 2026 Axiino Links Platform. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <button onClick={() => navigate('landing')} className="hover:text-slate-400">Home</button>
            <button onClick={() => navigate('pricing')} className="hover:text-slate-400">Pricing</button>
            <a href="#privacy" className="hover:text-slate-400">Anti-Fraud Policy</a>
            <a href="#terms" className="hover:text-slate-400">Terms of Payouts</a>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
