import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi, setMemoryAccessToken, setMemoryCsrfToken } from '../services/authApi';
import type { AuthUser, UserRole } from '../types/auth';

interface PendingMFA {
  userId: number;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingMFA: PendingMFA | null;
  login: (email: string, password: string) => Promise<{ requiresMFA: boolean }>;
  verifyMFA: (code: string, isRecoveryCode?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMFA, setPendingMFA] = useState<PendingMFA | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Proactive token refresh 2 minutes before JWT expiry
  const scheduleTokenRefresh = useCallback((accessToken: string) => {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      const refreshAt = expiresAt - Date.now() - 2 * 60 * 1000;
      if (refreshAt > 0) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
          try {
            const refreshed = await authApi.refreshToken();
            if (refreshed?.accessToken) {
              scheduleTokenRefresh(refreshed.accessToken);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        }, refreshAt);
      }
    } catch {
      // Ignored if invalid token format
    }
  }, []);

  // Restore authenticated session on mount using HttpOnly cookie refresh
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        // Attempt silent refresh via HttpOnly cookie
        const res = await authApi.refreshToken();
        if (res.accessToken && isMounted) {
          scheduleTokenRefresh(res.accessToken);
          const me = await authApi.getMe();
          if (isMounted) setUser(me);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleTokenRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password);
      if (response.requiresMFA) {
        setPendingMFA({ userId: response.userId!, email: response.email! });
        return { requiresMFA: true };
      }

      if (response.user) {
        setUser(response.user);
        if (response.accessToken) {
          scheduleTokenRefresh(response.accessToken);
        }
      }
      return { requiresMFA: false };
    },
    [scheduleTokenRefresh]
  );

  const verifyMFA = useCallback(
    async (code: string, isRecoveryCode: boolean = false) => {
      if (!pendingMFA) throw new Error('No pending MFA verification');
      const response = await authApi.verifyMFA(pendingMFA.userId, code, isRecoveryCode);
      if (response.user) {
        setUser(response.user);
        setPendingMFA(null);
        if (response.accessToken) {
          scheduleTokenRefresh(response.accessToken);
        }
      }
    },
    [pendingMFA, scheduleTokenRefresh]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setMemoryAccessToken(null);
      setMemoryCsrfToken(null);
      setUser(null);
      setPendingMFA(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setMemoryAccessToken(null);
      setMemoryCsrfToken(null);
      setUser(null);
      setPendingMFA(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        pendingMFA,
        login,
        verifyMFA,
        logout,
        logoutAll,
        hasPermission,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
