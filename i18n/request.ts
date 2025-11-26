import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export const locales = ['tr', 'en', 'de', 'nl', 'it', 'el', 'ru', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  nl: 'Nederlands',
  it: 'Italiano',
  el: 'Ελληνικά',
  ru: 'Русский',
  es: 'Español',
  fr: 'Français',
};

export const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  nl: '🇳🇱',
  it: '🇮🇹',
  el: '🇬🇷',
  ru: '🇷🇺',
  es: '🇪🇸',
  fr: '🇫🇷',
};

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Istanbul',
    now: new Date(),
    getTimeZone: () => 'Europe/Istanbul'
  };
});
