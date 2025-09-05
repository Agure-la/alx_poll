"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@/types';

/**
 * Defines the shape of the authentication context.
 * This includes the current user, loading state, and authentication functions.
 */
type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github' | 'facebook') => Promise<void>;
};

// Create the authentication context.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The authentication provider component.
 * This component wraps the application and provides the authentication context to all its children.
 * It manages the user's session and provides functions for logging in, registering, and logging out.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On initial load, we get the current user from the AuthService.
    const getInitialUser = async () => {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    getInitialUser();

    // We also listen for changes in the authentication state.
    // This allows the application to react to logins, logouts, and token refreshes.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
      }
    );

    // When the component unmounts, we unsubscribe from the auth listener.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // These functions are wrappers around the AuthService methods.
  // They also update the user state in the context.
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

/**
 * A custom hook for accessing the authentication context.
 * This makes it easy for components to get the current user and authentication functions.
 * @returns The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};