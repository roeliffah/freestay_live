import { Inter } from "next/font/google";
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import { IntlProvider } from '@/components/IntlProvider';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";
import type { Metadata } from 'next';
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  const localeNames: Record<string, string> = {
    en: 'English',
    tr: 'Türkçe',
    de: 'Deutsch',
    nl: 'Nederlands',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
    ru: 'Русский',
    el: 'Ελληνικά',
  };

  return {
    title: {
      default: 'FreeStays - Book Hotels, Excursions & Travel Worldwide',
      template: '%s | FreeStays'
    },
    description: 'Book hotels, flights, car rentals and excursions worldwide. Best prices guaranteed with FreeStays travel platform.',
    alternates: {
      canonical: `https://www.freestays.eu/${locale}`,
      languages: Object.fromEntries(
        locales.map(l => [l, `https://www.freestays.eu/${l}`])
      ),
    },
    openGraph: {
      locale: locale,
      type: 'website',
      url: `https://www.freestays.eu/${locale}`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Manuel olarak mesajları yükle
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <IntlProvider messages={messages} locale={locale}>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </IntlProvider>
      </body>
    </html>
  );
}
