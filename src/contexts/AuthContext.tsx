import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponse, LoginRequest, RoleName, UserResponse } from '@/types';
import {
  AccessPolicy,
  PermissionCode,
  evaluateAccessPolicy,
  getEffectivePermissions,
} from '@/security/permissions';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
  hasRole: (...roles: RoleName[]) => boolean;
  hasPermission: (...permissionCodes: PermissionCode[]) => boolean;
  hasAllPermissions: (...permissionCodes: PermissionCode[]) => boolean;
  checkPolicy: (policy: AccessPolicy) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeUserSession(rawUser: UserResponse | null): UserResponse | null {
  if (!rawUser) return null;
  const sanitizedPermissions = getEffectivePermissions(rawUser);
  return {
    ...rawUser,
    permissions: sanitizedPermissions,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const saved = localStorage.getItem('nova_user');
    if (!saved) return null;
    try {
      return sanitizeUserSession(JSON.parse(saved));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nova_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('nova_token');
      if (savedToken) {
        try {
          const me = await authService.getMe();
          setUser((prev) => {
            const resolvedRole = (me.role ||
              prev?.roleName ||
              (me.groups && me.groups[0] ? me.groups[0] : 'CLIENTE')) as RoleName;
            const resolvedPermissions = me.permissions || prev?.permissions || [];
            const baseUser: UserResponse = prev
              ? {
                  ...prev,
                  roleName: resolvedRole,
                  permissions: resolvedPermissions,
                }
              : {
                  id: me.subject,
                  firstName: me.name || me.username,
                  lastName: '',
                  email: me.email || '',
                  username: me.username,
                  roleName: resolvedRole,
                  permissions: resolvedPermissions,
                  active: true,
                };
            const sanitized = sanitizeUserSession(baseUser)!;
            localStorage.setItem('nova_user', JSON.stringify(sanitized));
            return sanitized;
          });
        } catch {
          localStorage.removeItem('nova_token');
          localStorage.removeItem('nova_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const authData = await authService.login(credentials);
      const sanitizedUser = sanitizeUserSession(authData.user)!;
      localStorage.setItem('nova_token', authData.accessToken);
      localStorage.setItem('nova_user', JSON.stringify(sanitizedUser));
      setToken(authData.accessToken);
      setUser(sanitizedUser);
      toast.success(`¡Bienvenido de vuelta, ${sanitizedUser.firstName}!`);
      return {
        ...authData,
        user: sanitizedUser,
      };
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error ||
        'Error de autenticación. Verifica tus credenciales.';
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('nova_token');
    localStorage.removeItem('nova_user');
    setToken(null);
    setUser(null);
    toast.info('Has cerrado sesión correctamente.');
    window.location.href = '/login';
  }, []);

  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';

  const hasRole = useCallback(
    (...roles: RoleName[]): boolean => {
      if (!user) return false;
      if (
        user.roleName === 'SUPER_ADMIN' &&
        (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN'))
      ) {
        return true;
      }
      return roles.includes(user.roleName);
    },
    [user]
  );

  const hasPermission = useCallback(
    (...permissionCodes: PermissionCode[]): boolean => {
      if (!user) return false;
      if (user.roleName === 'SUPER_ADMIN') return true;
      const effectivePerms = getEffectivePermissions(user);
      return permissionCodes.some((code) => effectivePerms.includes(code));
    },
    [user]
  );

  const hasAllPermissions = useCallback(
    (...permissionCodes: PermissionCode[]): boolean => {
      if (!user) return false;
      if (user.roleName === 'SUPER_ADMIN') return true;
      const effectivePerms = getEffectivePermissions(user);
      return permissionCodes.every((code) => effectivePerms.includes(code));
    },
    [user]
  );

  const checkPolicy = useCallback(
    (policy: AccessPolicy): boolean => {
      return evaluateAccessPolicy(user, policy);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isSuperAdmin,
        login,
        logout,
        hasRole,
        hasPermission,
        hasAllPermissions,
        checkPolicy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
