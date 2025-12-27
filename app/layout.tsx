export const metadata = {
  metadataBase: new URL('https://www.freestays.eu'),
  title: {
    default: 'FreeStays - Book Hotels, Excursions & Travel Worldwide',
    template: '%s | FreeStays'
  },
  description: 'Book hotels, flights, car rentals and excursions worldwide. Best prices guaranteed with FreeStays travel platform.',
  keywords: ['hotels', 'booking', 'travel', 'excursions', 'car rental', 'flights', 'vacation'],
  authors: [{ name: 'FreeStays' }],
  creator: 'FreeStays',
  publisher: 'FreeStays',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.freestays.eu',
    siteName: 'FreeStays',
    title: 'FreeStays - Book Hotels, Excursions & Travel Worldwide',
    description: 'Book hotels, flights, car rentals and excursions worldwide. Best prices guaranteed.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'FreeStays Travel Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreeStays - Book Hotels, Excursions & Travel Worldwide',
    description: 'Book hotels, flights, car rentals and excursions worldwide. Best prices guaranteed.',
    images: ['/twitter-image.jpg'],
    creator: '@freestays',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'TravelAgency',
              name: 'FreeStays',
              url: 'https://www.freestays.eu',
              logo: 'https://www.freestays.eu/freestays-eu-logo-klein.webp',
              description: 'Book hotels, flights, car rentals and excursions worldwide',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'NL',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                availableLanguage: ['en', 'tr', 'de', 'nl', 'fr', 'it', 'es', 'ru', 'el'],
              },
              sameAs: [
                'https://facebook.com/freestays',
                'https://twitter.com/freestays',
                'https://instagram.com/freestays',
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
