'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Phone, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Desktop Navigation */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button>
              {t('myBookings')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <LanguageSwitcher />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link 
                href={`/${locale}`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('hotels')}
              </Link>
              <Link 
                href={`/${locale}/about`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('about')}
              </Link>
              <Link 
                href={`/${locale}/contact`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('contact')}
              </Link>
              <div className="flex items-center space-x-2 px-2 pt-2 border-t">
                <Button variant="ghost" size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('contact')}
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  {t('login') || 'Login'}
                </Button>
              </div>
              <Button className="mx-2" onClick={() => setMobileMenuOpen(false)}>
                {t('myBookings')}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
