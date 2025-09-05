"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

/**
 * The properties for the `ProtectedRoute` component.
 */
interface ProtectedRouteProps {
  /** The child components to render if the user is authenticated. */
  children: React.ReactNode;
}

/**
 * A component that protects routes from unauthenticated users.
 * It checks if the user is authenticated and redirects them to the login page if they are not.
 * @param {ProtectedRouteProps} props - The component properties.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the user is not authenticated and the authentication state is no longer loading,
    // redirect the user to the login page.
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // While the authentication state is loading, display a loading message.
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If the user is not authenticated, don't render the child components.
  if (!user) {
    return null; // Or a redirect component
  }

  // If the user is authenticated, render the child components.
  return <>{children}</>;
}