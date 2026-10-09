import React, { createContext, useContext, useState, useMemo } from 'react';
import { Experiment, Campaign, NotificationItem, UserSettings, ToastMessage } from '../types';
import { useAuth } from './AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';

// We import useAuth from AuthContext
export { useAuth } from './AuthContext';

export type NavTab =
  'dashboard' | 'experiments' | 'experiment-detail' | 'campaigns' | 'analytics' | 'settings';
export type DateRange = 'Last 7 days' | 'Last 30 days' | 'Last 90 days';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedExperimentId: string;
  setSelectedExperimentId: (id: string) => void;
  viewExperimentDetails: (id: string) => void;

  experiments: Experiment[];
  selectedExperiment: Experiment | undefined;
  createExperiment: (data: Partial<Experiment>) => void;
  updateExperimentStatus: (id: string, status: Experiment['status']) => void;

  campaigns: Campaign[];
  toggleCampaignStatus: (id: string) => void;

  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;

  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;

  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  exportExperimentData: (experiment: Experiment, format?: 'csv' | 'json') => void;
  isLoadingData: boolean;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrganization } = useAuth();
  const orgId = currentOrganization?.id;

  const {
    experiments,
    setExperiments,
    campaigns,
    setCampaigns,
    notifications,
    setNotifications,
    userSettings,
    setUserSettings,
    loading: isLoadingData,
    refreshData,
    createExperimentInDb,
    updateExperimentStatusInDb,
    toggleCampaignStatusInDb,
    updateUserSettingsInDb,
    markNotificationReadInDb,
  } = useSupabaseData(orgId);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('exp-1');
  const [dateRange, setDateRange] = useState<DateRange>('Last 7 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const viewExperimentDetails = (id: string) => {
    setSelectedExperimentId(id);
    setActiveTab('experiment-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedExperiment = useMemo(() => {
    return experiments.find((exp) => exp.id === selectedExperimentId) || experiments[0];
  }, [experiments, selectedExperimentId]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markNotificationReadInDb(id);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notifications.forEach((n) => markNotificationReadInDb(n.id));
    addToast({
      title: 'Notifications Cleared',
      message: 'All notifications marked as read',
      type: 'info',
    });
  };

  const createExperiment = (newExpData: Partial<Experiment>) => {
    const newId = `exp-${Date.now()}`;
    const fullExperiment: Experiment = {
      id: newId,
      name: newExpData.name || 'Untitled Experiment',
      type: newExpData.type || 'Offer Test',
      status: (newExpData.status as any) || 'Active',
      description: newExpData.description || 'Marketing comparison test',
      startDate: newExpData.startDate || new Date().toISOString().split('T')[0],
      endDate:
        newExpData.endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      primaryGoal: newExpData.primaryGoal || 'Purchases',
      budget: Number(newExpData.budget) || 15000,
      connectedCampaign: newExpData.connectedCampaign || 'Instagram — T-Shirt Offer',
      confidenceScore: 50,
      winnerName: 'Gathering data',
      winnerLabel: undefined,
      winnerReason: 'Early phase: data currently being recorded across variants.',
      recommendation: 'Allow variants to reach at least 500 visitors before scaling.',
      variants:
        newExpData.variants && newExpData.variants.length > 0
          ? newExpData.variants
          : [
              {
                id: `var-${newId}-a`,
                label: 'Variant A',
                name: 'Control Version',
                tagline: 'Standard marketing message',
                clicks: 140,
                purchases: 6,
                revenue: 1200,
                conversionRate: 4.2,
                costPerConversion: 210,
                isWinner: false,
              },
              {
                id: `var-${newId}-b`,
                label: 'Variant B',
                name: 'Challenger Version',
                tagline: 'New offer experiment',
                clicks: 165,
                purchases: 11,
                revenue: 2350,
                conversionRate: 6.6,
                costPerConversion: 145,
                isWinner: true,
              },
            ],
    };

    setExperiments((prev) => [fullExperiment, ...prev]);
    setIsCreateModalOpen(false);

    // Save to Supabase
    if (orgId) {
      createExperimentInDb(fullExperiment, orgId);
    }

    addToast({
      title: 'Experiment Created Successfully!',
      message: `"${fullExperiment.name}" is now live and tracking data in Supabase.`,
      type: 'success',
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `New experiment started: ${fullExperiment.name}`,
        description: `Tracking ${fullExperiment.variants.length} variants with goal: ${fullExperiment.primaryGoal}`,
        time: 'Just now',
        isRead: false,
        type: 'alert',
      },
      ...prev,
    ]);
  };

  const updateExperimentStatus = (id: string, status: Experiment['status']) => {
    setExperiments((prev) => prev.map((exp) => (exp.id === id ? { ...exp, status } : exp)));
    updateExperimentStatusInDb(id, status);
    addToast({
      title: 'Status Updated',
      message: `Experiment status changed to ${status}`,
      type: 'info',
    });
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
          toggleCampaignStatusInDb(id, nextStatus);
          addToast({
            title: `Campaign ${nextStatus}`,
            message: `${c.name} is now ${nextStatus.toLowerCase()}`,
            type: nextStatus === 'Active' ? 'success' : 'warning',
          });
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const updateUserSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...newSettings }));
    if (orgId) {
      updateUserSettingsInDb(newSettings, orgId);
    }
    addToast({
      title: 'Settings Saved',
      message: 'Your preferences and store configuration have been synced to Supabase.',
      type: 'success',
    });
  };

  const exportExperimentData = (experiment: Experiment, format: 'csv' | 'json' = 'csv') => {
    if (format === 'json') {
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(experiment, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `${experiment.name.replace(/\s+/g, '_')}_funnel_labs_report.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const headers = [
        'Variant',
        'Name',
        'Tagline',
        'Clicks',
        'Purchases',
        'Revenue (INR)',
        'Conversion Rate (%)',
        'Cost per Conv (INR)',
        'Status',
      ];
      const rows = experiment.variants.map((v) => [
        `"${v.label}"`,
        `"${v.name}"`,
        `"${v.tagline}"`,
        v.clicks,
        v.purchases,
        v.revenue,
        `${v.conversionRate}%`,
        v.costPerConversion,
        v.isWinner ? 'WINNER' : 'CONTROL',
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${experiment.name.replace(/\s+/g, '_')}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    addToast({
      title: 'Report Exported!',
      message: `Downloaded ${experiment.name} data file to your device.`,
      type: 'success',
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedExperimentId,
        setSelectedExperimentId,
        viewExperimentDetails,
        experiments,
        selectedExperiment,
        createExperiment,
        updateExperimentStatus,
        campaigns,
        toggleCampaignStatus,
        dateRange,
        setDateRange,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        searchQuery,
        setSearchQuery,
        isCreateModalOpen,
        setIsCreateModalOpen,
        userSettings,
        updateUserSettings,
        toasts,
        addToast,
        removeToast,
        exportExperimentData,
        isLoadingData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
