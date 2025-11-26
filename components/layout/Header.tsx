'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Image
              src="/freestays-eu-logo-klein.webp"
              alt="FreeStays"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href={`/${locale}`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('hotels')}
            </Link>
            <Link 
              href={`/${locale}/about`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('about')}
            </Link>
            <Link 
              href={`/${locale}/contact`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('contact')}
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button className="hidden md:flex">
              {t('myBookings')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
