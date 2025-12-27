/**
 * Supported locales configuration
 * Desteklenen diller yapılandırması
 */

export const SUPPORTED_LOCALES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const SUPPORTED_CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)', symbol: '€' },
  { value: 'USD', label: '$ US Dollar (USD)', symbol: '$' },
  { value: 'TRY', label: '₺ Türk Lirası (TRY)', symbol: '₺' },
  { value: 'GBP', label: '£ British Pound (GBP)', symbol: '£' },
];

export const SUPPORTED_TIMEZONES = [
  { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/Athens', label: 'Athens (UTC+2)' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
];

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'tr';

export const getLocaleByCode = (code: string) => {
  return SUPPORTED_LOCALES.find(locale => locale.code === code);
};

export const getLocaleOptions = () => {
  return SUPPORTED_LOCALES.map(locale => ({
    label: `${locale.flag} ${locale.name}`,
    value: locale.code,
  }));
};
