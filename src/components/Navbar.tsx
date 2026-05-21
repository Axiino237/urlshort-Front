import React from 'react';
import { useApp, Role } from '../context/AppContext';
import { Link2, LogOut, Shield, Award, User, Radio } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, logout, changeUserRole, triggerSimulatedClick, liveVisitors } = useApp();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeUserRole(e.target.value as Role);
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5">
      {/* Platform Logo */}
      <div 
        onClick={() => onNavigate('landing')} 
        className="flex items-center gap-2 cursor-pointer group"
      >
        <div className="bg-gradient-to-tr from-primary-600 to-accent-cyan p-2.5 rounded-xl shadow-neon-purple group-hover:scale-105 transition-all duration-300">
          <Link2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight font-sans text-white group-hover:text-primary-300 transition-colors">
            AXIINO<span className="text-accent-cyan font-light">LINKS</span>
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-emerald"></span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {liveVisitors} active visitors online
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts for public pages */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button 
          onClick={() => onNavigate('landing')}
          className={`hover:text-white transition-colors ${currentPage === 'landing' ? 'text-accent-cyan' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('pricing')}
          className={`hover:text-white transition-colors ${currentPage === 'pricing' ? 'text-accent-cyan' : ''}`}
        >
          Pricing CPM
        </button>
        {user && (
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`hover:text-white transition-colors ${currentPage === 'dashboard' ? 'text-accent-cyan' : ''}`}
          >
            Dashboard
          </button>
        )}
      </div>

      {/* User Details, Role Selector and Live Simulator */}
      {user ? (
        <div className="flex items-center gap-4">
          {/* Quick Simulator Tool */}
          <button
            onClick={() => {
              triggerSimulatedClick();
              // Spark visual prompt that click happened
              const btn = document.getElementById('sim-btn');
              if (btn) {
                btn.classList.add('animate-spin');
                setTimeout(() => btn.classList.remove('animate-spin'), 600);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-950/40 hover:bg-primary-900/50 border border-primary-800/30 text-primary-300 rounded-lg text-xs font-semibold shadow-inner transition-all hover:scale-105 active:scale-95"
            title="Simulate a highly secure real unique visitor click to populate Recharts graphs instantly"
          >
            <Radio id="sim-btn" className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Simulate Traffic</span>
          </button>

          {/* Test Role Switcher (WOW utility) */}
          <div className="flex items-center gap-1.5 bg-background-card border border-white/5 rounded-lg px-2 py-1 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Role View:</span>
            <select
              value={user.role}
              onChange={handleRoleChange}
              className="bg-transparent text-accent-cyan font-bold border-none outline-none cursor-pointer focus:ring-0"
            >
              <option value="USER" className="bg-background-lighter text-slate-100">User Dashboard</option>
              <option value="ADMIN" className="bg-background-lighter text-slate-100">Admin Panel</option>
              <option value="SUPER_ADMIN" className="bg-background-lighter text-slate-100">Super Admin (Global)</option>
            </select>
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 pl-2 border-l border-white/5">
            <div className="hidden lg:flex flex-col text-right">
              <span className="font-semibold text-sm text-slate-200">{user.name}</span>
              <span className="text-[10px] font-bold tracking-wider text-primary-400 uppercase flex items-center gap-0.5 justify-end">
                {user.role === 'SUPER_ADMIN' ? (
                  <Shield className="w-2.5 h-2.5 text-accent-rose" />
                ) : user.role === 'ADMIN' ? (
                  <Award className="w-2.5 h-2.5 text-accent-cyan" />
                ) : (
                  <User className="w-2.5 h-2.5 text-primary-400" />
                )}
                {user.role.replace('_', ' ')}
              </span>
            </div>
            
            {/* Wallet shortcuts */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-primary-950 to-indigo-950 border border-primary-500/20 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Wallet:</span>
              <span className="text-xs font-bold text-accent-emerald">
                ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                onNavigate('login');
              }}
              className="p-2 hover:bg-accent-rose/10 text-slate-400 hover:text-accent-rose rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-sm font-semibold rounded-lg shadow-neon-purple hover:scale-[1.02] active:scale-95 transition-all text-white"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};
