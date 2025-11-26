import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['tr', 'en', 'de', 'nl', 'it', 'el', 'ru', 'es', 'fr'],
  defaultLocale: 'tr',
  localePrefix: 'always'
});

// TimeZone is configured in request.ts instead
export const timeZone = 'Europe/Istanbul';

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
