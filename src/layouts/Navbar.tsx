import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Bell,
  Plus,
  Menu,
  Check,
  ArrowUpRight,
  Sparkles,
  FlaskConical,
  Megaphone,
  User,
  ExternalLink,
  ChevronDown,
  LogOut,
  Building2,
} from 'lucide-react';
import { useApp, DateRange } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const navigate = useNavigate();
  const {
    dateRange,
    setDateRange,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    experiments,
    campaigns,
    viewExperimentDetails,
    userSettings,
    addToast,
  } = useApp();
  const { user, signOut, currentOrganization } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results across experiments, campaigns, and insights
  const matchingExperiments = searchQuery.trim()
    ? experiments.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const matchingCampaigns = searchQuery.trim()
    ? campaigns.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.channel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const insightResults = searchQuery.trim()
    ? [
        { text: 'Buy 2 Get 1 offers convert 80% better than 20% discount', expId: 'exp-1' },
        { text: 'Ad B generated 35% more purchases at ₹120 CPA', expId: 'exp-1' },
        { text: 'UGC Reel creative beat studio flatlay by 2.2x', expId: 'exp-3' },
      ].filter((i) => i.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const hasSearchResults =
    matchingExperiments.length > 0 || matchingCampaigns.length > 0 || insightResults.length > 0;

  const dateOptions: DateRange[] = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input with live dropdown */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search experiments, campaigns, insights..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 max-h-[80vh] overflow-y-auto divide-y divide-slate-100">
              {!hasSearchResults ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No matching experiments, campaigns, or insights found for "{searchQuery}".
                </div>
              ) : (
                <>
                  {/* Experiments matches */}
                  {matchingExperiments.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FlaskConical className="w-3 h-3 text-indigo-500" />
                        <span>Experiments</span>
                      </div>
                      {matchingExperiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => {
                            viewExperimentDetails(exp.id);
                            navigate(`/experiments/${exp.id}`);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-600">
                              {exp.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {exp.type} • Status: {exp.status}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600">
                            View →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Campaigns matches */}
                  {matchingCampaigns.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Megaphone className="w-3 h-3 text-pink-500" />
                        <span>Campaigns</span>
                      </div>
                      {matchingCampaigns.map((camp) => (
                        <button
                          key={camp.id}
                          onClick={() => {
                            navigate('/campaigns');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">{camp.name}</p>
                            <p className="text-xs text-slate-500">
                              {camp.channel} • Spend: ₹{(camp.spend / 1000).toFixed(0)}k
                            </p>
                          </div>
                          <span className="text-xs text-emerald-600 font-medium">
                            ₹{camp.revenue.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Insights matches */}
                  {insightResults.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Learnings & Recommendations</span>
                      </div>
                      {insightResults.map((insight, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            viewExperimentDetails(insight.expId);
                            navigate(`/experiments/${insight.expId}`);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50/60 transition-colors flex items-center justify-between group"
                        >
                          <p className="text-xs text-slate-700 italic">“{insight.text}”</p>
                          <span className="text-[11px] font-bold text-amber-600">Open Test →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Date Range, Notifications, Quick Create, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date Range Selector Dropdown */}
        <div ref={dateRef} className="relative hidden sm:block">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateRange(opt);
                    setIsDateOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    dateRange === opt
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt}</span>
                  {dateRange === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Quick Action Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Test</span>
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      notif.isRead
                        ? 'bg-white hover:bg-slate-50/60'
                        : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center"></span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    navigate('/experiments');
                    setIsNotifOpen(false);
                  }}
                  className="text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  View all active experiments →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User / Profile Avatar Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              AS
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">
                {userSettings.founderName}
              </p>
              <p className="text-[10px] text-slate-500">{userSettings.storeName}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">
                  {userSettings.founderName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || userSettings.founderEmail}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] font-medium text-indigo-700">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  <span className="truncate max-w-[130px]">
                    {currentOrganization?.name || userSettings.storeName}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & Preferences</span>
                </button>
                <a
                  href={userSettings.storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    Visit Live Store
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={async () => {
                      setIsProfileOpen(false);
                      await signOut();
                      addToast({
                        title: 'Signed Out',
                        message: 'You have been safely signed out of Funnel Labs.',
                        type: 'info',
                      });
                      navigate('/login');
                    }}
                    className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
