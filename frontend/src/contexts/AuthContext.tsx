'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  lineUserId: string;
  lineDisplayName: string;
  linePictureUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  getToken: () => string | null;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Cookieからトークンを取得
  const getToken = (): string | null => {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  };

  // ログアウト処理
  const logout = useCallback(() => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  }, [router]);

  // ユーザー情報を取得
  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error('Failed to fetch user, status:', response.status);
        // 認証エラー以外ではログアウトしない
        if (response.status === 401) {
          // トークンが無効な場合のみログアウト
          logout();
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // ネットワークエラーなどではログアウトしない
    }
  }, [logout]);

  // ログイン処理
  const login = useCallback(
    (token: string) => {
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      setIsAuthenticated(true);
      // トークン保存後、少し待ってからユーザー情報を取得
      setTimeout(() => {
        fetchUser();
      }, 100);
    },
    [fetchUser],
  );

  // 初回マウント時に認証状態をチェック
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const authenticated = !!token;

      setIsAuthenticated(authenticated);

      if (authenticated) {
        await fetchUser();
      }

      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初回マウント時のみ実行

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout, getToken, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
