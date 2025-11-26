'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="bg-muted/50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Hakkımızda */}
          <div>
            <h3 className="font-bold text-lg mb-4">FreeStays</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('description')}
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Destek */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('support')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/contact`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('help')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('cancellation')}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('contactInfo')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">+90 242 XXX XX XX</p>
                  <p className="text-xs text-muted-foreground">Pzt-Cum 09:00-18:00</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">info@freestays.com</p>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Antalya, Türkiye</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FreeStays. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
