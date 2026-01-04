/**
 * Utility functions for mapping app locales to SunHotels language codes
 */

// SunHotels supported language codes
export const SUNHOTELS_LANGUAGES = [
  'ja', 'cs', 'pt', 'sv', 'zh-Hant', 'en', 'da', 'nl', 'ko', 'ru', 'hu', 'fr', 
  'no', 'es', 'de', 'it', 'zh-Hans', 'fi', 'pl'
] as const;

// Mapping from app locales to SunHotels language codes
// If a locale is not directly supported, it maps to the closest alternative
const LOCALE_TO_SUNHOTELS_MAP: Record<string, (typeof SUNHOTELS_LANGUAGES)[number]> = {
  // Direct mappings (1:1)
  'en': 'en',
  'de': 'de',
  'fr': 'fr',
  'es': 'es',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'nl': 'nl',
  'pl': 'pl',
  'da': 'da',
  'sv': 'sv',
  'no': 'no',
  'fi': 'fi',
  'hu': 'hu',
  'cs': 'cs',
  'ja': 'ja',
  'ko': 'ko',
  'zh': 'zh-Hans',  // Default to Simplified Chinese
  'zh-Hans': 'zh-Hans',  // Simplified Chinese
  'zh-Hant': 'zh-Hant',  // Traditional Chinese
  'el': 'en',  // Greek -> English fallback
  'tr': 'en',  // Turkish -> English fallback
};

/**
 * Get the SunHotels language code for an app locale
 * If the locale is not supported, returns 'en' as default fallback
 * 
 * @param locale - App locale (e.g., 'en', 'de', 'tr')
 * @returns SunHotels language code or 'en' as fallback
 */
export function mapLocaleToSunhotels(locale: string): (typeof SUNHOTELS_LANGUAGES)[number] {
  // Direct match
  if (locale in LOCALE_TO_SUNHOTELS_MAP) {
    return LOCALE_TO_SUNHOTELS_MAP[locale];
  }

  // Try language part only (e.g., 'en' from 'en-US')
  const baseLang = locale.split('-')[0];
  if (baseLang in LOCALE_TO_SUNHOTELS_MAP) {
    return LOCALE_TO_SUNHOTELS_MAP[baseLang];
  }

  // Default fallback
  return 'en';
}

/**
 * Check if a locale is supported by SunHotels
 * 
 * @param locale - App locale to check
 * @returns true if the locale (or a mapped version) is in SunHotels languages
 */
export function isSunhotelsLocaleSupported(locale: string): boolean {
  const sunhotelsCode = mapLocaleToSunhotels(locale);
  return SUNHOTELS_LANGUAGES.includes(sunhotelsCode as any);
}

/**
 * Validate and normalize a locale for use with SunHotels API
 * 
 * @param locale - App locale
 * @param defaultLocale - Default locale to use if validation fails (default: 'en')
 * @returns Validated SunHotels language code
 */
export function validateAndMapLocale(
  locale: string,
  defaultLocale: string = 'en'
): (typeof SUNHOTELS_LANGUAGES)[number] {
  if (!locale) {
    return defaultLocale as (typeof SUNHOTELS_LANGUAGES)[number];
  }

  return mapLocaleToSunhotels(locale);
}
