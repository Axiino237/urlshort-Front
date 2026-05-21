import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, Link, CreditCard, ShieldAlert, Settings, 
  Users, Layers, Globe, Activity, UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, hasUserPermission } = useApp();
  if (!user) return null;

  // Sections list with category titles, item targets, icons, permission gates, and styles
  const sections = [
    {
      title: 'Publisher Studio',
      themeClass: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-neon-purple',
      items: [
        { id: 'links', label: 'My Links', icon: Link, permission: 'create_link' },
        { id: 'analytics', label: 'Link Analytics', icon: BarChart3, permission: 'create_link' },
        { id: 'withdraw', label: 'Withdraw Earnings', icon: CreditCard, permission: 'withdraw_funds' },
      ]
    },
    {
      title: 'Admin Controls',
      themeClass: 'bg-gradient-to-r from-accent-cyan to-indigo-600 text-white shadow-neon-cyan',
      items: [
        { id: 'users-manage', label: 'Manage Users', icon: Users, permission: 'manage_publishers' },
        { id: 'admin-links', label: 'All User Links', icon: Layers, permission: 'manage_publishers' },
      ]
    },
    {
      title: 'Global Platform Engine',
      themeClass: 'bg-gradient-to-r from-accent-rose to-purple-700 text-white shadow-glass-glow',
      items: [
        { id: 'super-analytics', label: 'Global Analytics', icon: Globe, permission: 'approve_payouts' },
        { id: 'super-withdrawals', label: 'Withdrawal Approvals', icon: CreditCard, permission: 'approve_payouts' },
        { id: 'super-uam', label: 'User Access Control', icon: UserCheck, permission: 'uam_control' },
        { id: 'super-settings', label: 'Ad & Platform Config', icon: Settings, permission: 'global_settings' },
        { id: 'super-fraud', label: 'Fraud & VPN Monitoring', icon: ShieldAlert, permission: 'fraud_shield' },
        { id: 'super-logs', label: 'System Activity Logs', icon: Activity, permission: 'uam_control' },
      ]
    }
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col min-h-[calc(100vh-80px)] p-4 select-none shrink-0">
      <div className="flex-1 space-y-6">
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => hasUserPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="animate-fadeIn">
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                {section.title}
              </span>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isSelected 
                          ? section.themeClass 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 mt-auto text-xs text-slate-500">
        <div className="flex items-center gap-2 px-3 py-1">
          <Activity className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-semibold text-slate-400">Axiino Security Shield</span>
        </div>
        <p className="px-3 mt-1 leading-relaxed text-[10px]">
          VPN protection & Emulator honey-pot filters active. All visits undergo deep analytical inspection.
        </p>
      </div>
    </aside>
  );
};
