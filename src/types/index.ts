export type ExperimentStatus = 'Active' | 'Planned' | 'Completed';

export type ExperimentType =
  'Offer Test' | 'Ad Creative' | 'Message Test' | 'Landing Page' | 'Other';

export interface Variant {
  id: string;
  name: string; // e.g. "Ad A — 20% Off"
  label: string; // "Variant A"
  tagline: string; // "20% Off Today"
  clicks: number;
  purchases: number;
  revenue: number; // in INR
  conversionRate: number; // e.g. 5.0
  costPerConversion: number; // in INR e.g. 200
  isWinner?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  type: ExperimentType;
  status: ExperimentStatus;
  description: string;
  startDate: string;
  endDate: string;
  primaryGoal: 'Purchases' | 'Leads' | 'Clicks' | 'Revenue' | 'Conversion Rate';
  budget: number;
  variants: Variant[];
  winnerName?: string;
  winnerLabel?: string;
  winnerReason?: string;
  recommendation?: string;
  confidenceScore?: number; // e.g. 96.4%
  connectedCampaign?: string;
}

export type CampaignStatus = 'Active' | 'Paused' | 'Completed';
export type CampaignChannel = 'Instagram' | 'Google Search' | 'Facebook' | 'WhatsApp';

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  reach: number;
  clicks: number;
  purchases: number;
  revenue: number;
  spend: number;
  roas: number;
  connectedExperimentId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: 'winner' | 'complete' | 'metric' | 'alert';
}

export interface UserSettings {
  founderName: string;
  founderEmail: string;
  storeName: string;
  storeUrl: string;
  platform: 'Shopify' | 'WooCommerce' | 'Custom D2C' | 'Magento';
  currency: 'INR (₹)' | 'USD ($)' | 'GBP (£)';
  monthlyAdSpend: number;
  notifyWinner: boolean;
  notifyDaily: boolean;
  notifyBudget: boolean;
  confidenceThreshold: number; // e.g. 95%
  minSampleSize: number; // e.g. 1000
  autoPauseLosers: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
