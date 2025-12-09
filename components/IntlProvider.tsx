'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

export function IntlProvider({
  messages,
  locale,
  children,
}: {
  messages: any;
  locale: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
      timeZone="Europe/Istanbul"
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
