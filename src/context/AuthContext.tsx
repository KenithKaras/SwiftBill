import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  businessData: any | null;
  refreshBusinessData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  businessData: null,
  refreshBusinessData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any | null>(null);

  const fetchBusinessData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Init profile if not exists
        const { data: userData } = await supabase.auth.getUser();
        const newData = {
          id: userId,
          email: userData.user?.email || '',
          business_name: 'My Business',
          address: '',
          gst_number: '',
          primary_color: '#2563eb',
          accent_color: '#0f172a',
          letterhead_image: '',
          font_family: 'Inter',
          header_height: 100,
          logo_position: 'left',
          font_size: 14,
        };
        const { error: insertError } = await supabase.from('profiles').insert([newData]);
        if (insertError) throw insertError;
        
        // Map to expected frontend keys
        setBusinessData({
          uid: newData.id,
          email: newData.email,
          businessName: newData.business_name,
          address: newData.address,
          gstNumber: newData.gst_number,
          primaryColor: newData.primary_color,
          accentColor: newData.accent_color,
          letterheadImage: newData.letterhead_image,
          fontFamily: newData.font_family,
          headerHeight: newData.header_height,
          logoPosition: newData.logo_position,
          fontSize: newData.font_size
        });
      } else if (data) {
        // Map snake_case to camelCase for frontend compatibility
        setBusinessData({
          uid: data.id,
          email: data.email,
          businessName: data.business_name,
          address: data.address,
          gstNumber: data.gst_number,
          businessLogo: data.business_logo,
          primaryColor: data.primary_color || '#2563eb',
          accentColor: data.accent_color || '#0f172a',
          letterheadImage: data.letterhead_image || '',
          fontFamily: data.font_family || 'Inter',
          headerHeight: data.header_height || 100,
          logoPosition: data.logo_position || 'left',
          fontSize: data.font_size || 14
        });
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchBusinessData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchBusinessData(newUser.id);
      } else {
        setBusinessData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshBusinessData = async () => {
    if (user) await fetchBusinessData(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, loading, businessData, refreshBusinessData }}>
      {children}
    </AuthContext.Provider>
  );
};
