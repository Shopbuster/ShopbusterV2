import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerReferralCode, setSellerReferralCode] = useState(null);

  const checkIsAdmin = async (userId) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Admin check exception:', error);
      return false;
    }
  };

  const checkIsSeller = async (userId) => {
    if (!userId) return { isSeller: false, referralCode: null };

    try {
      const { data, error } = await supabase
        .from('seller_users')
        .select('id, referral_code')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Seller check error:', error);
        return { isSeller: false, referralCode: null };
      }

      return { isSeller: data !== null, referralCode: data?.referral_code || null };
    } catch (error) {
      console.error('Seller check exception:', error);
      return { isSeller: false, referralCode: null };
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAdmin(false);
    setIsSeller(false);
    setSellerReferralCode(null);
  };

  const clearSupabaseLocalStorage = () => {
    // Clear all Supabase-related localStorage entries
    // This prevents the Supabase client from getting stuck during session restoration
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Clear Supabase localStorage to avoid session restoration bug
        // This forces users to log in fresh on each page load
        clearSupabaseLocalStorage();

        if (isMounted) {
          clearAuthState();
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          clearAuthState();
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        if (!isMounted) return;

        // Only process actual sign in/out events
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);

          // Check admin and seller status in parallel
          const [adminStatus, sellerStatus] = await Promise.all([
            checkIsAdmin(session.user.id),
            checkIsSeller(session.user.id)
          ]);

          if (isMounted) {
            setIsAdmin(adminStatus);
            setIsSeller(sellerStatus.isSeller);
            setSellerReferralCode(sellerStatus.referralCode);
          }
        }

        if (event === 'SIGNED_OUT') {
          if (isMounted) {
            clearAuthState();
          }
        }

        // Handle user updates (like password change) without disrupting session
        if (event === 'USER_UPDATED' && session?.user) {
          if (isMounted) {
            setUser(session.user);
          }
        }

        // Handle token refresh - just update user object
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (isMounted) {
            setUser(session.user);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    clearSupabaseLocalStorage();
    const { error } = await supabase.auth.signOut();
    clearAuthState();
    return { error };
  };

  const value = {
    user,
    loading,
    isAdmin,
    isSeller,
    sellerReferralCode,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};