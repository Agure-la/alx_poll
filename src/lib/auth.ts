import { AuthUser, LoginCredentials, RegisterCredentials } from '@/types';
import { supabase } from './supabase/client';
import { Database } from '@/types/database';

/**
 * Provides authentication services for the application.
 * This class encapsulates all the logic for user authentication,
 * including login, registration, logout, and session management.
 */
export class AuthService {
  /**
   * Logs in a user with the provided credentials.
   * It can handle both email/password and username/password logins.
   * @param credentials The user's login credentials.
   * @returns The authenticated user's information or null if login fails.
   */
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    let email = credentials.email;

    // If a username is provided instead of an email, we need to look up the email address first.
    // This allows users to log in with either their username or their email address.
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
      email = (user as { email: string }).email;
    }

    if (!email) {
      console.error('Login error: Email or username is required');
      return null;
    }

    // Once we have the email, we can sign in the user with Supabase Auth.
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

    // After a successful login, we fetch the user's profile information
    // to get additional details like the username.
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', data.user.id)
      .single();
    
    // We return a consolidated user object with the essential information.
    return {
      id: data.user.id,
      email: data.user.email || '',
      username: (profile as { username: string } | null)?.username || data.user.email?.split('@')[0] || ''
    };
  }

  /**
   * Registers a new user with the provided credentials.
   * It creates a new user in Supabase Auth and a corresponding profile in the `users` table.
   * @param credentials The new user's registration credentials.
   * @returns The newly created user's information or null if registration fails.
   */
  static async register(credentials: RegisterCredentials): Promise<AuthUser | null> {
    console.log('Attempting to register user:', credentials.email);

    // First, we check if a user with the same email already exists to prevent duplicates.
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', credentials.email)
      .single();
    
    if (existingUser) {
      console.error('Registration error: Email already in use');
      return null;
    }
    
    // If the email is not in use, we sign up the user with Supabase Auth.
    // We also pass the username in the `options.data` to be used later.
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
      // After signing up, we immediately sign in the user to get an active session.
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
        // Once the user is signed in, we create a profile for them in our public `users` table.
        // This table stores public user information like the username.
        const userData: Database['public']['Tables']['users']['Insert'] = {
          id: signInData.user.id,
          email: signInData.user.email || '',
          username: credentials.username
        };
        
        // The `insert` method expects an array of objects.
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
    
    // Finally, we return the new user's information.
    return data.user ? {
      id: data.user.id,
      email: data.user.email || '',
      username: credentials.username
    } : null;
  }

  /**
   * Logs out the currently authenticated user.
   * This will clear the user's session.
   */
   static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Retrieves the currently authenticated user's information.
   * @returns The current user's information or null if no user is authenticated.
   */
   static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // We also fetch the user's profile to get the username.
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();
    
    return {
      id: user.id,
      email: user.email || '',
      username: (profile as { username: string } | null)?.username || user.email?.split('@')[0] || ''
    };
  }

  /**
   * Sends a password reset email to the user.
   * @param email The user's email address.
   * @returns A boolean indicating whether the password reset email was sent successfully.
   */
  static async resetPassword(email: string): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    return !error;
  }

  /**
   * Initiates a login with an OAuth provider.
   * @param provider The OAuth provider to use (e.g., 'google', 'github').
   */
  static async loginWithProvider(provider: 'google' | 'github' | 'facebook'): Promise<void> {
    await supabase.auth.signInWithOAuth({ provider });
  }

  /**
   * Updates a user's profile information.
   * @param userId The ID of the user to update.
   * @param data The new profile data.
   * @returns The updated user information or null if the update fails.
   */
  static async updateProfile(userId: string, data: Partial<AuthUser>): Promise<AuthUser | null> {
    // TODO: Replace with actual profile update logic
    console.log('Profile update for user:', userId, data);
    
    // Simulate an API call to update the profile.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return null;
  }
}