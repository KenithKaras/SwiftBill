import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

import { ThemeCustomization } from '../types/invoice';

export interface BusinessData {
  uid: string;
  email: string;
  businessName: string;
  address: string;
  gstNumber: string;
  businessLogo?: string;
  primaryColor: string;
  accentColor: string;
  letterheadImage: string;
  fontFamily: string;
  headerHeight: number;
  logoPosition: 'left' | 'center' | 'right';
  fontSize: number;
  customization?: ThemeCustomization;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  businessData: BusinessData | null;
  refreshBusinessData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  businessData: null,
  refreshBusinessData: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  const currentUserIdRef = React.useRef<string | null | undefined>(undefined);
  const fetchInProgressRef = React.useRef<string | null>(null);

  const fetchBusinessData = async (userId: string) => {
    console.log('[DEBUG] fetchBusinessData started for userId:', userId);
    let retries = 3;
    const delay = 500;
    
    while (retries > 0) {
      retries--; // Ensure the retry counter is always decremented at the start to prevent infinite loops
      console.log(`[DEBUG] fetchBusinessData attempt. Retries remaining: ${retries}`);
      
      try {
        console.log('[DEBUG] Querying profiles table for user...');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        console.log('[DEBUG] Query profiles response. data:', data, 'error:', error);

        if (error) {
          // If profile row is not found, it might be due to trigger replication lag. Retry if we have attempts left.
          if (error.code === 'PGRST116' && retries > 0) {
            logger.warn(`Profile row not found for user ${userId}, retrying in ${delay}ms... (${retries} left)`);
            console.log(`[DEBUG] Profile row not found (PGRST116). Sleeping ${delay}ms before next retry...`);
            await sleep(delay);
            continue;
          }
          throw error;
        }

        if (data) {
          console.log('[DEBUG] Profile found, setting businessData...');
          // Map snake_case to camelCase for frontend compatibility
          setBusinessData({
            uid: data.id,
            email: data.email,
            businessName: data.business_name || 'My Business',
            address: data.address || '',
            gstNumber: data.gst_number || '',
            businessLogo: data.business_logo || '',
            primaryColor: data.primary_color || '#2563eb',
            accentColor: data.accent_color || '#0f172a',
            letterheadImage: data.letterhead_image || '',
            fontFamily: data.font_family || 'Inter',
            headerHeight: data.header_height || 100,
            logoPosition: (data.logo_position as 'left' | 'center' | 'right') || 'left',
            fontSize: data.font_size || 14,
            customization: data.customization || {}
          });
          console.log('[DEBUG] businessData state successfully updated.');
          return; // Successfully fetched, return
        }

        // If we get here and both data and error are empty, retry if attempts remain
        if (retries > 0) {
          logger.warn(`Empty profile result for user ${userId}, retrying in ${delay}ms... (${retries} left)`);
          console.log(`[DEBUG] Profile result empty. Sleeping ${delay}ms before next retry...`);
          await sleep(delay);
        }
      } catch (error: any) {
        console.error(`[DEBUG] Error occurred during profile fetch iteration (${retries} remaining):`, error);
        logger.error(`Error fetching business data (${retries} left):`, error);
        if (retries > 0) {
          await sleep(delay);
        }
      }
    }

    // Fallback in case of trigger failure or configuration error
    logger.warn(`Failed to fetch profile from DB after retries. Using fallback local profile for user ${userId}.`);
    console.log('[DEBUG] DB profile fetch failed all retries. Using fallback local profile.');
    setBusinessData({
      uid: userId,
      email: '',
      businessName: 'My Business',
      address: '',
      gstNumber: '',
      primaryColor: '#2563eb',
      accentColor: '#0f172a',
      letterheadImage: '',
      fontFamily: 'Inter',
      headerHeight: 100,
      logoPosition: 'left',
      fontSize: 14,
      customization: {}
    });
    console.log('[DEBUG] Fallback local profile state set.');
  };

  const handleSession = async (session: any) => {
    const currentUser = session?.user ?? null;
    const currentUserId = currentUser ? currentUser.id : null;
    console.log('[DEBUG] handleSession called. currentUser:', currentUserId, 'prevUser:', currentUserIdRef.current);

    if (currentUserIdRef.current !== undefined && currentUserIdRef.current === currentUserId) {
      console.log('[DEBUG] Session user matches currentUserIdRef. Skipping duplicate handleSession.');
      return;
    }

    currentUserIdRef.current = currentUserId;
    setUser(currentUser);

    if (currentUser) {
      if (fetchInProgressRef.current !== currentUserId) {
        fetchInProgressRef.current = currentUserId;
        try {
          await fetchBusinessData(currentUserId);
        } catch (err) {
          console.error('[DEBUG] fetchBusinessData failed:', err);
        } finally {
          if (fetchInProgressRef.current === currentUserId) {
            fetchInProgressRef.current = null;
          }
        }
      }
    } else {
      setBusinessData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    // Use a single listener for all auth changes, including the initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[DEBUG] onAuthStateChange event received: ${event}`);
      if (!active) return;
      await handleSession(session);
    });

    // Also run a check immediately in case onAuthStateChange didn't fire INITIAL_SESSION
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[DEBUG] getSession finished.');
      if (!active) return;
      await handleSession(session);
    }).catch((err) => {
      console.error('[DEBUG] getSession failed:', err);
      logger.error('Failed to get initial session', err);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshBusinessData = async () => {
    if (user) await fetchBusinessData(user.id);
  };

  const signOut = async () => {
    console.log('[DEBUG] Centralized signOut invoked.');
    currentUserIdRef.current = null;
    fetchInProgressRef.current = null;
    // 1. Reset user state synchronously so the UI reacts immediately
    setUser(null);
    setBusinessData(null);
    setLoading(false);
    
    // 2. Clear all Supabase auth tokens from localStorage
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') || key.includes('supabase.auth')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('[DEBUG] Failed to clear localStorage during signOut:', e);
    }
    
    // 3. Trigger Supabase signOut in the background without blocking the UI
    try {
      await supabase.auth.signOut();
      console.log('[DEBUG] Supabase signOut completed successfully.');
    } catch (err) {
      console.error('[DEBUG] Supabase signOut error caught:', err);
    }
  };

  // We only stop showing app-wide loader when session and businessData check have fully settled
  const contextValueValue = React.useMemo(() => ({
    user,
    loading,
    businessData,
    refreshBusinessData,
    signOut
  }), [user, loading, businessData]);

  return (
    <AuthContext.Provider value={contextValueValue}>
      {children}
    </AuthContext.Provider>
  );
};

