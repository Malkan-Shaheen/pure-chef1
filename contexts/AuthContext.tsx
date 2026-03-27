import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  getProfile,
} from '../services/api';

export interface AuthUser {
  email: string;
  isPro: boolean;
  generationsToday: number;
  lifetimeGenerations: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistUser(u: AuthUser) {
  localStorage.setItem('purechef_user', JSON.stringify(u));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const t = localStorage.getItem('purechef_token');
    if (!t) return;
    const { user: prof } = await getProfile();
    const next: AuthUser = {
      email: prof.email,
      isPro: !!prof.isPro,
      generationsToday: prof.generationsToday ?? 0,
      lifetimeGenerations: prof.lifetimeGenerations ?? 0,
    };
    setUser(next);
    persistUser(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = localStorage.getItem('purechef_token');
      const raw = localStorage.getItem('purechef_user');
      if (t && raw) {
        try {
          setToken(t);
          const parsed = JSON.parse(raw) as Partial<AuthUser>;
          setUser({
            email: parsed.email ?? '',
            isPro: !!parsed.isPro,
            generationsToday: parsed.generationsToday ?? 0,
            lifetimeGenerations: parsed.lifetimeGenerations ?? 0,
          });
          const { user: prof } = await getProfile();
          if (cancelled) return;
          const next: AuthUser = {
            email: prof.email,
            isPro: !!prof.isPro,
            generationsToday: prof.generationsToday ?? 0,
            lifetimeGenerations: prof.lifetimeGenerations ?? 0,
          };
          setUser(next);
          persistUser(next);
        } catch {
          if (!cancelled) {
            localStorage.removeItem('purechef_token');
            localStorage.removeItem('purechef_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    if (!res.token) throw new Error('No token returned');
    localStorage.setItem('purechef_token', res.token);
    setToken(res.token);
    const { user: prof } = await getProfile();
    const next: AuthUser = {
      email: prof.email,
      isPro: !!prof.isPro,
      generationsToday: prof.generationsToday ?? 0,
      lifetimeGenerations: prof.lifetimeGenerations ?? 0,
    };
    setUser(next);
    persistUser(next);
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const res = await apiSignup(email, password);
    if (!res.token) throw new Error('No token returned');
    localStorage.setItem('purechef_token', res.token);
    setToken(res.token);
    const { user: prof } = await getProfile();
    const next: AuthUser = {
      email: prof.email,
      isPro: !!prof.isPro,
      generationsToday: prof.generationsToday ?? 0,
      lifetimeGenerations: prof.lifetimeGenerations ?? 0,
    };
    setUser(next);
    persistUser(next);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
