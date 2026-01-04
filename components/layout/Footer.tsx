'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-muted/50 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Hakkımızda */}
          <div>
            <h3 className="font-bold text-lg mb-4">{settings?.siteName || 'FreeStays'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('description')}
            </p>
            <div className="flex space-x-3">
              {settings?.social?.facebook && (
                <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.social?.instagram && (
                <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.social?.twitter && (
                <a href={settings.social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
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
                <Link href={`/${locale}/faq`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                {settings?.termsOfService ? (
                  <Link href={`/${locale}/pages/${settings.termsOfService}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('terms')}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('terms')}
                  </span>
                )}
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
                <Link href={`/${locale}/faq`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('help')}
                </Link>
              </li>
              <li>
                {settings?.cancellationPolicy ? (
                  <Link href={`/${locale}/pages/${settings.cancellationPolicy}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('cancellation')}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('cancellation')}
                  </span>
                )}
              </li>
              <li>
                {settings?.privacyPolicy ? (
                  <Link href={`/${locale}/pages/${settings.privacyPolicy}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('privacy')}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('privacy')}
                  </span>
                )}
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="font-bold text-lg mb-4">{t('contactInfo')}</h3>
            <ul className="space-y-3">
              {(settings?.contact?.phone || settings?.supportPhone) && (
                <li className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <a 
                      href={`tel:${settings.contact?.phone || settings.supportPhone}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {settings.contact?.phone || settings.supportPhone}
                    </a>
                    {settings?.contact?.workingHours && (
                      <p className="text-xs text-muted-foreground">{settings?.contact?.workingHours}</p>
                    )}
                  </div>
                </li>
              )}
              {(settings?.contact?.email || settings?.supportEmail) && (
                <li className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <a 
                    href={`mailto:${settings.contact?.email || settings.supportEmail}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.contact?.email || settings.supportEmail}
                  </a>
                </li>
              )}
              {settings?.contact?.address && (
                <li className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {settings?.contact?.address}
                    {settings?.contact?.postalCode && <>, {settings?.contact?.postalCode}</>}
                    {settings?.contact?.city && <>, {settings?.contact?.city}</>}
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings?.companyName || 'FreeStays'}. {t('rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
