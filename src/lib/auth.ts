import { AuthUser, LoginCredentials, RegisterCredentials } from '@/types';
import { supabase } from './supabase/client';
import { Database } from '@/types/database';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    let email = credentials.email;

    // If username is provided instead of email, look up the email
    if (credentials.username) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', credentials.username)
        .single();

      if (userError || !user) {
        console.error('Login error: User not found');
        return null;
      }
      email = user.email;
    }

    if (!email) {
      console.error('Login error: Email or username is required');
      return null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: credentials.password
    });
    
    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (!data.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', data.user.id)
      .single();
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      username: profile?.username || data.user.email?.split('@')[0] || ''
    };
  }

  static async register(credentials: RegisterCredentials): Promise<AuthUser | null> {
    console.log('Attempting to register user:', credentials.email);

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
    console.log('User signed up successfully:', data.user?.email);
    
    if (data.user) {
      // Sign in the user to get a session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (signInError) {
        console.error('Sign-in after registration error:', signInError);
        return null;
      }
      console.log('User signed in successfully after registration:', signInData.user?.email);

      if (signInData.user) {
        // Explicitly type the insert data to match the Database type
        const userData: Database['public']['Tables']['users']['Insert'] = {
          id: signInData.user.id,
          email: signInData.user.email || '',
          username: credentials.username
        };
        
        // Wrap userData in an array for the insert method
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([userData]);
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            return null;
          }
        } catch (error) {
          console.error('An unexpected error occurred during profile creation:', error);
          return null;
        }
        console.log('User profile created successfully:', userData.username);
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
