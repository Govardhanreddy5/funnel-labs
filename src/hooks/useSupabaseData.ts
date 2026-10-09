import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Experiment, Campaign, NotificationItem, UserSettings } from '../types';
import {
  initialExperiments,
  initialCampaigns,
  initialNotifications,
  initialUserSettings,
} from '../data/mockData';

export function useSupabaseData(orgId?: string) {
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperiments);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [userSettings, setUserSettings] = useState<UserSettings>(initialUserSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Experiments and their Variants
      const { data: expData, error: expError } = await supabase
        .from('experiments')
        .select(
          `
          id,
          name,
          type,
          status,
          description,
          start_date,
          end_date,
          primary_goal,
          budget,
          connected_campaign,
          confidence_score,
          winner_name,
          winner_label,
          winner_reason,
          recommendation,
          variants (
            id,
            label,
            name,
            tagline,
            clicks,
            purchases,
            revenue,
            conversion_rate,
            cost_per_conversion,
            is_winner
          )
        `
        )
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!expError && expData) {
        if (expData.length > 0 || orgId !== 'a0000000-0000-0000-0000-000000000001') {
          const mappedExperiments: Experiment[] = expData.map((e: any) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            status: e.status,
            description: e.description,
            startDate: e.start_date,
            endDate: e.end_date,
            primaryGoal: e.primary_goal,
            budget: Number(e.budget),
            connectedCampaign: e.connected_campaign,
            confidenceScore: e.confidence_score ? Number(e.confidence_score) : undefined,
            winnerName: e.winner_name || undefined,
            winnerLabel: e.winner_label || undefined,
            winnerReason: e.winner_reason || undefined,
            recommendation: e.recommendation || undefined,
            variants: (e.variants || []).map((v: any) => ({
              id: v.id,
              label: v.label,
              name: v.name,
              tagline: v.tagline,
              clicks: Number(v.clicks),
              purchases: Number(v.purchases),
              revenue: Number(v.revenue),
              conversionRate: Number(v.conversion_rate),
              costPerConversion: Number(v.cost_per_conversion),
              isWinner: Boolean(v.is_winner),
            })),
          }));
          setExperiments(mappedExperiments);
        }
      }

      // 2. Fetch Campaigns
      const { data: campData, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!campError && campData) {
        if (campData.length > 0 || orgId !== 'a0000000-0000-0000-0000-000000000001') {
          const mappedCampaigns: Campaign[] = campData.map((c: any) => ({
            id: c.id,
            name: c.name,
            channel: c.channel,
            status: c.status,
            reach: Number(c.reach),
            clicks: Number(c.clicks),
            purchases: Number(c.purchases),
            revenue: Number(c.revenue),
            spend: Number(c.spend),
            connectedExperimentId: c.connected_experiment_id || undefined,
          }));
          setCampaigns(mappedCampaigns);
        }
      }

      // 3. Fetch Notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (!notifError && notifData) {
        if (notifData.length > 0 || orgId !== 'a0000000-0000-0000-0000-000000000001') {
          const mappedNotifs: NotificationItem[] = notifData.map((n: any) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            time: n.time_label || 'Just now',
            isRead: Boolean(n.is_read),
            type: n.type || 'alert',
          }));
          setNotifications(mappedNotifs);
        }
      }

      // 4. Fetch User Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!settingsError && settingsData) {
        setUserSettings({
          founderName: settingsData.founder_name,
          founderEmail: settingsData.founder_email,
          storeName: settingsData.store_name,
          storeUrl: settingsData.store_url,
          platform: settingsData.platform,
          currency: settingsData.currency,
          monthlyAdSpend: Number(settingsData.monthly_ad_spend),
          notifyWinner: Boolean(settingsData.notify_winner),
          notifyDaily: Boolean(settingsData.notify_daily),
          notifyBudget: Boolean(settingsData.notify_budget),
          confidenceThreshold: Number(settingsData.confidence_threshold),
          minSampleSize: Number(settingsData.min_sample_size),
          autoPauseLosers: Boolean(settingsData.auto_pause_losers),
        });
      }
    } catch (err: any) {
      console.warn('Supabase data query fallback to local cache:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mutations backed by Supabase
  const createExperimentInDb = async (newExp: Experiment, organizationId: string) => {
    try {
      // 1. Insert experiment
      const { error: expErr } = await supabase.from('experiments').insert({
        id: newExp.id,
        organization_id: organizationId,
        name: newExp.name,
        type: newExp.type,
        status: newExp.status,
        description: newExp.description,
        start_date: newExp.startDate,
        end_date: newExp.endDate,
        primary_goal: newExp.primaryGoal,
        budget: newExp.budget,
        connected_campaign: newExp.connectedCampaign,
        confidence_score: newExp.confidenceScore,
        winner_name: newExp.winnerName,
        winner_label: newExp.winnerLabel,
        winner_reason: newExp.winnerReason,
        recommendation: newExp.recommendation,
      });

      if (expErr) throw expErr;

      // 2. Insert variants
      if (newExp.variants && newExp.variants.length > 0) {
        const variantsPayload = newExp.variants.map((v) => ({
          id: v.id,
          experiment_id: newExp.id,
          organization_id: organizationId,
          label: v.label,
          name: v.name,
          tagline: v.tagline,
          clicks: v.clicks,
          purchases: v.purchases,
          revenue: v.revenue,
          conversion_rate: v.conversionRate,
          cost_per_conversion: v.costPerConversion,
          is_winner: v.isWinner,
        }));
        await supabase.from('variants').insert(variantsPayload);
      }
    } catch (e: any) {
      console.warn(
        'Supabase createExperiment persisted locally (database offline or migration pending):',
        e.message
      );
    }
  };

  const updateExperimentStatusInDb = async (expId: string, status: Experiment['status']) => {
    try {
      let query = supabase.from('experiments').update({ status }).eq('id', expId);
      if (orgId) query = query.eq('organization_id', orgId);
      await query;
    } catch (e: any) {
      console.warn('Supabase updateExperimentStatus sync failed:', e.message);
    }
  };

  const toggleCampaignStatusInDb = async (campId: string, nextStatus: Campaign['status']) => {
    try {
      let query = supabase.from('campaigns').update({ status: nextStatus }).eq('id', campId);
      if (orgId) query = query.eq('organization_id', orgId);
      await query;
    } catch (e: any) {
      console.warn('Supabase toggleCampaignStatus sync failed:', e.message);
    }
  };

  const updateUserSettingsInDb = async (
    newSettings: Partial<UserSettings>,
    organizationId: string
  ) => {
    try {
      await supabase
        .from('user_settings')
        .update({
          founder_name: newSettings.founderName,
          founder_email: newSettings.founderEmail,
          store_name: newSettings.storeName,
          store_url: newSettings.storeUrl,
          platform: newSettings.platform,
          currency: newSettings.currency,
          monthly_ad_spend: newSettings.monthlyAdSpend,
          notify_winner: newSettings.notifyWinner,
          notify_daily: newSettings.notifyDaily,
          notify_budget: newSettings.notifyBudget,
          confidence_threshold: newSettings.confidenceThreshold,
          min_sample_size: newSettings.minSampleSize,
          auto_pause_losers: newSettings.autoPauseLosers,
        })
        .eq('organization_id', organizationId);
    } catch (e: any) {
      console.warn('Supabase updateUserSettings sync failed:', e.message);
    }
  };

  const markNotificationReadInDb = async (notifId: string) => {
    try {
      let query = supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      if (orgId) query = query.eq('organization_id', orgId);
      await query;
    } catch (e: any) {
      console.warn('Supabase markNotificationRead sync failed:', e.message);
    }
  };

  return {
    experiments,
    setExperiments,
    campaigns,
    setCampaigns,
    notifications,
    setNotifications,
    userSettings,
    setUserSettings,
    loading,
    error,
    refreshData: fetchData,
    createExperimentInDb,
    updateExperimentStatusInDb,
    toggleCampaignStatusInDb,
    updateUserSettingsInDb,
    markNotificationReadInDb,
  };
}
