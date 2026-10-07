import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AdminUser, AdminPermissions } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; requireOtp?: boolean; message: string }>;
  verifyLoginOtp: (email: string, otp: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  hasPermission: (module: keyof AdminPermissions, action: string) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.admin) {
        setAdmin(res.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await api.login(email, password, rememberMe);
    if (res.success && res.admin) {
      setAdmin(res.admin);
    }
    return { success: res.success, requireOtp: res.requireOtp, message: res.message };
  };

  const verifyLoginOtp = async (email: string, otp: string, rememberMe = false) => {
    const res = await api.verifyLoginOtp(email, otp, rememberMe);
    if (res.success && res.admin) {
      setAdmin(res.admin);
    }
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    await api.logout();
    setAdmin(null);
  };

  const hasPermission = useCallback((module: keyof AdminPermissions, action: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;

    const mod = admin.permissions[module] as Record<string, boolean> | undefined;
    if (mod && mod[action]) {
      return true;
    }
    return false;
  }, [admin]);

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ admin, loading, login, verifyLoginOtp, logout, refreshAdmin, hasPermission, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
