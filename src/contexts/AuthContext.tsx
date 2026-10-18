import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthResponse, LoginRequest, RoleName, UserResponse } from '@/types';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
  hasRole: (...roles: RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const saved = localStorage.getItem('nova_user');
    return saved ? JSON.parse(saved) : null;
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
          // If token exists, verify by fetching me
          const me = await authService.getMe();
          // Keep existing user or update username
          setUser((prev) => {
            if (prev) return prev;
            return {
              id: me.subject,
              firstName: me.name || me.username,
              lastName: '',
              email: me.email || '',
              username: me.username,
              roleName: (me.groups && me.groups[0] ? me.groups[0] : 'CLIENTE') as RoleName,
              active: true,
            };
          });
        } catch {
          // If token verification fails (401), clean up
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
      localStorage.setItem('nova_token', authData.accessToken);
      localStorage.setItem('nova_user', JSON.stringify(authData.user));
      setToken(authData.accessToken);
      setUser(authData.user);
      toast.success(`¡Bienvenido de vuelta, ${authData.user.firstName}!`);
      return authData;
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

  const hasRole = useCallback(
    (...roles: RoleName[]): boolean => {
      if (!user) return false;
      return roles.includes(user.roleName);
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
        login,
        logout,
        hasRole,
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
