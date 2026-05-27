import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authModalOpen: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requestAuth: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('pomo_token');
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('pomo_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('pomo_token', res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    const cb = pendingCallback.current;
    pendingCallback.current = null;
    cb?.();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.auth.register(name, email, password);
    localStorage.setItem('pomo_token', res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    const cb = pendingCallback.current;
    pendingCallback.current = null;
    cb?.();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pomo_token');
    localStorage.removeItem('pomo_calendar_v1');
    setUser(null);
  }, []);

  const requestAuth = useCallback((onSuccess?: () => void) => {
    pendingCallback.current = onSuccess ?? null;
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    pendingCallback.current = null;
    setAuthModalOpen(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authModalOpen, login, register, logout, requestAuth, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
