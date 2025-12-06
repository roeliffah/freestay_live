'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, SiteSettings, Translations } from '@/lib/api';

interface SettingsState {
  // Site settings from API
  siteSettings: SiteSettings | null;
  isLoadingSettings: boolean;
  
  // Translations
  translations: Translations;
  currentLocale: string;
  availableLocales: string[];
  isLoadingTranslations: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  loadTranslations: (locale: string) => Promise<void>;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const defaultSettings: SiteSettings = {
  siteName: 'FreeStays',
  tagline: 'Your Gateway to Affordable Travel',
  logo: '/images/logo.svg',
  favicon: '/favicon.ico',
  email: 'info@freestays.com',
  phone: '+1 234 567 890',
  address: '',
  defaultCurrency: 'USD',
  defaultLocale: 'en',
  maintenanceMode: false,
  social: {},
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      siteSettings: null,
      isLoadingSettings: true,
      translations: {},
      currentLocale: 'en',
      availableLocales: ['en', 'tr', 'de', 'fr', 'es'],
      isLoadingTranslations: true,

      loadSettings: async () => {
        set({ isLoadingSettings: true });
        try {
          const response = await api.settings.getSite();
          set({ siteSettings: response.data, isLoadingSettings: false });
        } catch {
          // Use defaults on error
          set({ siteSettings: defaultSettings, isLoadingSettings: false });
        }
      },

      loadTranslations: async (locale: string) => {
        set({ isLoadingTranslations: true });
        try {
          const response = await api.translations.get(locale);
          set({
            translations: response.data,
            currentLocale: locale,
            isLoadingTranslations: false,
          });
        } catch {
          set({ isLoadingTranslations: false });
        }
      },

      setLocale: (locale: string) => {
        const { loadTranslations } = get();
        set({ currentLocale: locale });
        loadTranslations(locale);
      },

      t: (key: string, params?: Record<string, string | number>) => {
        const { translations } = get();
        let text = translations[key] || key;
        
        if (params) {
          Object.entries(params).forEach(([paramKey, value]) => {
            text = text.replace(`{${paramKey}}`, String(value));
          });
        }
        
        return text;
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLocale: state.currentLocale,
      }),
    }
  )
);

// Helper hook for translations
export const useTranslation = () => {
  const { t, currentLocale, setLocale, availableLocales, isLoadingTranslations } = useSettings();
  return { t, locale: currentLocale, setLocale, availableLocales, isLoading: isLoadingTranslations };
};
