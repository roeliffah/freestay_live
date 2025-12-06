'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, User, ApiError } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.auth.login({ email, password });
          const { user, tokens } = response.data;
          
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token for API calls
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string, phone?: string) => {
        set({ isLoading: true });
        try {
          const response = await api.auth.register({ name, email, password, phone });
          const { user, tokens } = response.data;
          
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });

          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
          }
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const response = await api.auth.refreshToken(refreshToken);
          const tokens = response.data;
          
          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
          }
        } catch {
          // Refresh failed, logout
          await get().logout();
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const response = await api.auth.updateProfile(data);
        set({ user: response.data });
      },

      checkAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await api.auth.me();
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          if (error instanceof ApiError && error.statusCode === 401) {
            // Try to refresh
            await get().refreshAuth();
          } else {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
