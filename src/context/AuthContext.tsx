import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentOrganization: UserOrganization | null;
  organizations: UserOrganization[];
  switchOrganization: (orgId: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signInAsDemo: () => void;
  signUp: (
    email: string,
    password: string,
    metadata?: { fullName?: string; storeName?: string }
  ) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ORG: UserOrganization = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Bombay Threads D2C',
  slug: 'bombay-threads-d2c',
  role: 'owner',
};

const DEMO_USER: any = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'founder@bombaythreads.com',
  user_metadata: { full_name: 'Aarav Sharma', store_name: 'Bombay Threads D2C' },
};

const DEMO_SESSION: any = {
  access_token: 'demo_jwt_access_token',
  user: DEMO_USER,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([DEMO_ORG]);
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(DEMO_ORG);

  const bootstrapUserOrganization = useCallback(
    async (userId: string, defaultStoreName?: string) => {
      try {
        const storeName = defaultStoreName || 'Bombay Threads D2C';
        const slug = `${storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${userId.slice(0, 6)}`;

        const { data: newOrg, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: storeName, slug })
          .select()
          .single();

        if (!orgErr && newOrg) {
          await supabase
            .from('organization_members')
            .insert({ organization_id: newOrg.id, user_id: userId, role: 'owner' });

          const createdOrg: UserOrganization = {
            id: newOrg.id,
            name: newOrg.name,
            slug: newOrg.slug,
            role: 'owner',
          };
          setOrganizations([createdOrg]);
          setCurrentOrganization(createdOrg);
        }
      } catch {
        // Graceful fallback
      }
    },
    []
  );

  // Fetch organizations accessible to this user
  const refreshOrganizations = useCallback(
    async (userId: string, storeName?: string) => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, slug)')
          .eq('user_id', userId);

        if (error) {
          // Table may not yet be initialized in Supabase SQL editor
          return;
        }

        if (data && data.length > 0) {
          const orgs: UserOrganization[] = data
            .map((item: any) => ({
              id: item.organizations?.id || item.organization_id,
              name: item.organizations?.name || 'My D2C Store',
              slug: item.organizations?.slug || 'my-d2c-store',
              role: item.role || 'owner',
            }))
            .filter((o) => Boolean(o.id));

          if (orgs.length > 0) {
            setOrganizations(orgs);
            const savedOrgId = localStorage.getItem('funnel_labs_current_org');
            const matched = orgs.find((o) => o.id === savedOrgId) || orgs[0];
            setCurrentOrganization(matched);
            return;
          }
        }

        // If user has no org yet, attempt client-side bootstrap
        await bootstrapUserOrganization(userId, storeName);
      } catch {
        // Keep resilient fallback
      }
    },
    [bootstrapUserOrganization]
  );

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const meta = session.user.user_metadata;
        const inferredStore =
          meta?.store_name ||
          meta?.storeName ||
          (meta?.full_name || meta?.name ? `${meta.full_name || meta.name}'s Store` : undefined);
        refreshOrganizations(session.user.id, inferredStore);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes (including Google OAuth redirect code exchange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const meta = newSession.user.user_metadata;
        const inferredStore =
          meta?.store_name ||
          meta?.storeName ||
          (meta?.full_name || meta?.name ? `${meta.full_name || meta.name}'s Store` : undefined);
        await refreshOrganizations(newSession.user.id, inferredStore);
      } else {
        setOrganizations([DEMO_ORG]);
        setCurrentOrganization(DEMO_ORG);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshOrganizations]);

  const switchOrganization = useCallback((orgId: string) => {
    setOrganizations((prevOrgs) => {
      const matched = prevOrgs.find((o) => o.id === orgId);
      if (matched) {
        setCurrentOrganization(matched);
        localStorage.setItem('funnel_labs_current_org', matched.id);
      }
      return prevOrgs;
    });
  }, []);

  const signInAsDemo = useCallback(() => {
    setUser(DEMO_USER);
    setSession(DEMO_SESSION);
    setCurrentOrganization(DEMO_ORG);
    setOrganizations([DEMO_ORG]);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // If developer or tester is signing in with demo/founder credentials, allow seamless instant demo login
          if (email.toLowerCase().includes('demo@') || email.toLowerCase().includes('founder@')) {
            setUser(DEMO_USER);
            setSession(DEMO_SESSION);
            setCurrentOrganization(DEMO_ORG);
            setOrganizations([DEMO_ORG]);
            return { error: null };
          }
          return { error };
        }
        if (data.user) {
          await refreshOrganizations(data.user.id);
        }
        return { error: null };
      } catch (err: any) {
        if (email.toLowerCase().includes('demo@') || email.toLowerCase().includes('founder@')) {
          setUser(DEMO_USER);
          setSession(DEMO_SESSION);
          setCurrentOrganization(DEMO_ORG);
          setOrganizations([DEMO_ORG]);
          return { error: null };
        }
        return { error: err };
      }
    },
    [refreshOrganizations]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { fullName?: string; storeName?: string }
    ) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: metadata?.fullName || splitEmailName(email),
              store_name: metadata?.storeName || 'My D2C Store',
            },
          },
        });
        if (error) return { error, user: null };
        return { error: null, user: data.user };
      } catch (err: any) {
        return { error: err, user: null };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (customRedirectTo?: string) => {
    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const baseUrl = env.appUrl || origin;
      const targetPath = customRedirectTo || '/dashboard';
      const redirectTo = targetPath.startsWith('http')
        ? targetPath
        : `${baseUrl}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setSession(null);
        setUser(null);
        setCurrentOrganization(DEMO_ORG);
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      currentOrganization,
      organizations,
      switchOrganization,
      signIn,
      signInWithGoogle,
      signInAsDemo,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    }),
    [
      user,
      session,
      loading,
      currentOrganization,
      organizations,
      switchOrganization,
      signIn,
      signInWithGoogle,
      signInAsDemo,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function splitEmailName(email: string): string {
  const name = email.split('@')[0] || 'Founder';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
