import { Inter } from "next/font/google";
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import { IntlProvider } from '@/components/IntlProvider';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
      <body className={`${inter.variable} font-sans antialiased`}>
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
