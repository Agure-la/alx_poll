
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@/types';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github' | 'facebook') => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialUser = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    getInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: any) => {
    const user = await AuthService.login(credentials);
    setUser(user);
    return user;
  };

  const register = async (credentials: any) => {
    const user = await AuthService.register(credentials);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const loginWithProvider = async (provider: 'google' | 'github' | 'facebook') => {
    await AuthService.loginWithProvider(provider);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithProvider }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
