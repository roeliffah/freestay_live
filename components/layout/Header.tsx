'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Phone, User, Menu, X, ChevronDown, Plane, Car, Compass, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { adminAPI } from '@/lib/api/client';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import { useAuth } from '@/lib/hooks/useAuth';

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [travelMenuOpen, setTravelMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { settings } = useSiteSettings();
  const { user, isAuthenticated, logout } = useAuth();
  const [affiliateData, setAffiliateData] = useState<{
    excursions: { active: boolean; affiliateCode: string };
    carRental: { active: boolean; affiliateCode: string };
    flightBooking: { active: boolean; affiliateCode: string };
  } | null>(null);

  useEffect(() => {
    const fetchAffiliatePrograms = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/settings/affiliate-programs`);
        if (response.ok) {
          const data = await response.json();
          console.log('Affiliate programs loaded:', data);
          setAffiliateData(data);
        } else {
          console.warn('Failed to load affiliate programs, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch affiliate programs:', error);
      }
    };

    fetchAffiliatePrograms();
  }, []);

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
            
            {/* Travel Dropdown - Sadece aktif servisler varsa göster */}
            {affiliateData && (affiliateData.excursions.active || affiliateData.carRental.active || affiliateData.flightBooking.active) && (
              <div 
                className="relative group"
                onMouseEnter={() => setTravelMenuOpen(true)}
                onMouseLeave={() => setTravelMenuOpen(false)}
              >
                <button 
                  className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
                  onClick={() => setTravelMenuOpen(!travelMenuOpen)}
                >
                  {t('travel')}
                  <ChevronDown className="h-3 w-3" />
                </button>
                
                {travelMenuOpen && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-md shadow-lg py-2 z-[100] pointer-events-auto"
                  >
                    {affiliateData.excursions.active && affiliateData.excursions.affiliateCode && (
                      <a 
                        href={affiliateData.excursions.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <Compass className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t('excursions')}</div>
                          <div className="text-xs text-muted-foreground">Discover local experiences</div>
                        </div>
                      </a>
                    )}
                    {affiliateData.carRental.active && affiliateData.carRental.affiliateCode && (
                      <a 
                        href={affiliateData.carRental.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <Car className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t('rentACar')}</div>
                          <div className="text-xs text-muted-foreground">Best car rental deals</div>
                        </div>
                      </a>
                    )}
                    {affiliateData.flightBooking.active && affiliateData.flightBooking.affiliateCode && (
                      <a 
                        href={affiliateData.flightBooking.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <Plane className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t('bookAFlight')}</div>
                          <div className="text-xs text-muted-foreground">Find cheap flights</div>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link 
              href={`/${locale}/about`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('about')}
            </Link>
            <Link 
              href={`/${locale}/how-it-works`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('howItWorks')}
            </Link>
            <Link 
              href={`/${locale}/lastminute-deals`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('lastminuteDeals')}
            </Link>
            <Link 
              href={`/${locale}/refer-a-friend`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('referralProgram')}
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
            {(settings?.contact?.phone || settings?.supportPhone) && (
              <a href={`tel:${settings.contact?.phone || settings.supportPhone}`}>
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
              </a>
            )}
            
            {/* User Menu */}
            {isAuthenticated && user ? (
              <div 
                className="relative"
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative"
                  title={user.name}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </Button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-[100]">
                    <div className="px-4 py-3 border-b">
                      <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link 
                      href={`/${locale}/bookings`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('myBookings')}
                    </Link>
                    <Link 
                      href={`/${locale}/profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('profile') || 'Profile'}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout') || 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={`/${locale}/auth/login`}>
                <Button variant="outline" size="sm">
                  {t('login') || 'Login'}
                </Button>
              </Link>
            )}
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
              
              {/* Mobile Travel Menu */}
              {affiliateData && (affiliateData.excursions.active || affiliateData.carRental.active || affiliateData.flightBooking.active) && (
                <div className="px-2">
                  <div className="text-sm font-medium mb-2">{t('travel')}</div>
                  <div className="pl-4 space-y-2">
                    {affiliateData.excursions.active && affiliateData.excursions.affiliateCode && (
                      <a 
                        href={affiliateData.excursions.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary py-1"
                      >
                        <Compass className="h-4 w-4" />
                        {t('excursions')}
                      </a>
                    )}
                    {affiliateData.carRental.active && affiliateData.carRental.affiliateCode && (
                      <a 
                        href={affiliateData.carRental.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary py-1"
                      >
                        <Car className="h-4 w-4" />
                        {t('rentACar')}
                      </a>
                    )}
                    {affiliateData.flightBooking.active && affiliateData.flightBooking.affiliateCode && (
                      <a 
                        href={affiliateData.flightBooking.affiliateCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary py-1"
                      >
                        <Plane className="h-4 w-4" />
                        {t('bookAFlight')}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <Link 
                href={`/${locale}/about`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('about')}
              </Link>
              <Link 
                href={`/${locale}/how-it-works`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('howItWorks')}
              </Link>
              <Link 
                href={`/${locale}/lastminute-deals`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('lastminuteDeals')}
              </Link>
              <Link 
                href={`/${locale}/refer-a-friend`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('referralProgram')}
              </Link>
              <Link 
                href={`/${locale}/contact`}
                className="text-sm font-medium transition-colors hover:text-primary px-2 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('contact')}
              </Link>
              <div className="flex items-center space-x-2 px-2 pt-2 border-t flex-col gap-2">
                {(settings?.contact?.phone || settings?.supportPhone) && (
                  <a 
                    href={`tel:${settings.contact?.phone || settings.supportPhone}`}
                    className="w-full"
                  >
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      {t('contact')}
                    </Button>
                  </a>
                )}
                
                {isAuthenticated && user ? (
                  <>
                    <Link 
                      href={`/${locale}/bookings`}
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        {t('myBookings')}
                      </Button>
                    </Link>
                    <Link 
                      href={`/${locale}/profile`}
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        {t('profile') || 'Profile'}
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('logout') || 'Logout'}
                      </Button>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href={`/${locale}/auth/login`}
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {t('login') || 'Login'}
                      </Button>
                    </Link>
                    <Link 
                      href={`/${locale}/auth/register`}
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button size="sm" className="w-full">
                        {t('register') || 'Register'}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
