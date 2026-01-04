import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'xml.sunhotels.net',
      },
      {
        protocol: 'https',
        hostname: 'xml.sunhotels.net',
      },
      {
        protocol: 'https',
        hostname: 'hotelimages.sunhotels.net',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5240',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
