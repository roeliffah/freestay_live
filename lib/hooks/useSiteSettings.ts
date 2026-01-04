import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/client';

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  siteUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  supportEmail?: string;
  supportPhone?: string;
  contactEmail?: string;
  companyName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxId?: string;
  registrationNumber?: string;
  defaultLocale?: string;
  availableLocales?: string[];
  defaultCurrency?: string;
  availableCurrencies?: string[];
  timezone?: string;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    workingHours?: string;
    mapLatitude?: number;
    mapLongitude?: number;
    googleMapsIframe?: string;
  };
  privacyPolicy?: string;
  termsOfService?: string;
  cancellationPolicy?: string;
  social?: {
    facebook?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getPublicSiteSettings();
        console.log('API Response structure:', response);
        console.log('Response keys:', Object.keys(response || {}));
        
        // API'nin gerçek yapısını kontrol et
        let settingsData: any = response;
        if (response && typeof response === 'object' && 'data' in response && typeof (response as any).data === 'object') {
          settingsData = response.data;
        }
        
        console.log('Final settings data:', settingsData);
        console.log('Has contact?', !!settingsData?.contact);
        
        setSettings(settingsData as SiteSettings);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Site Settings Error:', errorMessage);
        setError(errorMessage);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
