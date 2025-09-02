import { AuthUser, LoginCredentials, RegisterCredentials } from '@/types';
import { supabase } from './supabase/client';
import { Database } from '@/types/database';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    
    if (error) {
      console.error('Login error:', error);
      return null;
    }
    
    return data.user ? {
      id: data.user.id,
      email: data.user.email || '',
      username: data.user.email?.split('@')[0] || ''
    } : null;
  }

  static async register(credentials: RegisterCredentials): Promise<AuthUser | null> {
    // Check for existing user with the same email
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', credentials.email)
      .single();
    
    if (existingUser) {
      console.error('Registration error: Email already in use');
      return null;
    }
    
    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username
        }
      }
    });
    
    if (error) {
      console.error('Registration error:', error);
      return null;
    }
    
    if (data.user) {
      // Explicitly type the insert data to match the Database type
      const userData: Database['public']['Tables']['users']['Insert'] = {
        id: data.user.id,
        email: data.user.email || '',
        username: credentials.username
      };
      
      // Wrap userData in an array for the insert method
      const { error: profileError } = await supabase
        .from('users')
        .insert([userData]);
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        return null;
      }
    }
    
    return data.user ? {
      id: data.user.id,
      email: data.user.email || '',
      username: credentials.username
    } : null;
  }

   static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  }

   static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // Get additional user data from your users table
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email || '',
      username: profile?.username || user.email?.split('@')[0] || ''
    };
  }

  static async resetPassword(email: string): Promise<boolean> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  });
  return !error;
}

static async loginWithProvider(provider: 'google' | 'github' | 'facebook'): Promise<void> {
  await supabase.auth.signInWithOAuth({ provider });
}

  static async updateProfile(userId: string, data: Partial<AuthUser>): Promise<AuthUser | null> {
    // TODO: Replace with actual profile update logic
    console.log('Profile update for user:', userId, data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return null;
  }
}
