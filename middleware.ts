import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if pathname already has a locale
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return handleI18nRouting(request);
  }

  // Get locale preference (priority order):
  // 1. Cookie (user's previous choice)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale as any)) {
    return handleI18nRouting(request);
  }

  // 2. Accept-Language header (browser language)
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const browserLanguages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase().split('-')[0]);
    
    const matchedLocale = browserLanguages.find(lang => 
      routing.locales.includes(lang as any)
    );
    
    if (matchedLocale) {
      // Set cookie for future visits
      const response = handleI18nRouting(request);
      response.cookies.set('NEXT_LOCALE', matchedLocale, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/'
      });
      return response;
    }
  }

  // 3. Default locale (Turkish)
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
