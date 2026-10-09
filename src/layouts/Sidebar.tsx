import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Megaphone,
  TrendingUp,
  Settings,
  Plus,
  Sparkles,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { experiments, campaigns, setIsCreateModalOpen, userSettings } = useApp();
  const { currentOrganization } = useAuth();

  const activeExperimentsCount = experiments.filter((e) => e.status === 'Active').length;
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'Active').length;

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      matches: (pathname: string) => pathname === '/' || pathname === '/dashboard',
    },
    {
      id: 'experiments',
      path: '/experiments',
      label: 'Experiments',
      icon: <FlaskConical className="w-5 h-5" />,
      badge: activeExperimentsCount,
      matches: (pathname: string) => pathname.startsWith('/experiments'),
    },
    {
      id: 'campaigns',
      path: '/campaigns',
      label: 'Campaigns',
      icon: <Megaphone className="w-5 h-5" />,
      badge: activeCampaignsCount,
      matches: (pathname: string) => pathname.startsWith('/campaigns'),
    },
    {
      id: 'analytics',
      path: '/analytics',
      label: 'Analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      matches: (pathname: string) => pathname.startsWith('/analytics'),
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      matches: (pathname: string) => pathname.startsWith('/settings'),
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b132b] text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => handleNavClick('/dashboard')}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-lg">Funnel Labs</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                D2C
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Growth Experimentation</p>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/30 active:scale-[0.98] group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Platform Menu
        </div>
        {navItems.map((item) => {
          const isActive = item.matches(location.pathname);
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/30 shadow-inner'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Connected Store Context */}
      <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">
              {currentOrganization?.name || userSettings.storeName}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{userSettings.platform}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Active Ad Spend</span>
          <span className="font-semibold text-slate-200">
            ₹{(userSettings.monthlyAdSpend / 1000).toFixed(0)}k/mo
          </span>
        </div>
      </div>

      {/* Sidebar Footer Required Content */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070d1e]/60">
        <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-900/40 text-center">
          <p className="text-xs font-semibold text-indigo-200 mb-0.5">“Turn Data into Growth.”</p>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 tracking-wide">
            <Sparkles className="w-3 h-3" />
            <span>“Test. Learn. Scale.”</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
