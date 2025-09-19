import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export type UserRole = 'admin' | 'moderator' | 'user';

interface UserPermissions {
  canViewAnalytics: boolean;
  canDeletePolls: boolean;
  canModerateComments: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
}

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewAnalytics: false,
    canDeletePolls: false,
    canModerateComments: false,
    canExportData: false,
    canManageUsers: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          const role = data.role as UserRole;
          setUserRole(role);
          
          // Set permissions based on role
          const rolePermissions: Record<UserRole, UserPermissions> = {
            admin: {
              canViewAnalytics: true,
              canDeletePolls: true,
              canModerateComments: true,
              canExportData: true,
              canManageUsers: true
            },
            moderator: {
              canViewAnalytics: true,
              canDeletePolls: false,
              canModerateComments: true,
              canExportData: true,
              canManageUsers: false
            },
            user: {
              canViewAnalytics: false,
              canDeletePolls: false,
              canModerateComments: false,
              canExportData: false,
              canManageUsers: false
            }
          };
          
          setPermissions(rolePermissions[role]);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    userRole,
    permissions,
    loading,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator',
    isUser: userRole === 'user'
  };
}