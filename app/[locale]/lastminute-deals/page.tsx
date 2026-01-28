'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Star, Zap, Calendar, Users, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { lastMinuteAPI } from '@/lib/api/client';
import { validateAndMapLocale } from '@/lib/utils/language-mapping';
import type { LastMinuteHotel } from '@/types/last-minute';

export default function LastMinuteDealsPage() {
  const t = useTranslations('lastMinute');
  const locale = useLocale();
  const [hotels, setHotels] = useState<LastMinuteHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    checkIn: '',
    checkOut: ''
  });
  
  // Default values
  const getDefaultCheckIn = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };
  
  const getDefaultCheckOut = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    loadHotels();
  }, [locale]);

  const loadHotels = async () => {
    try {
      // Map and validate locale for SunHotels API
      const sunhotelsLanguage = validateAndMapLocale(locale, 'en');
      console.log(`🌐 Loading last-minute deals for locale: ${locale} → SunHotels language: ${sunhotelsLanguage}`);
      
      const data = await lastMinuteAPI.getHotels(sunhotelsLanguage);
      setHotels(data.hotels || []);
      setPageData({
        title: data.title || t('title'),
        subtitle: data.subtitle || t('subtitle'),
        badgeText: data.badgeText || t('badge'),
        checkIn: data.checkIn || '',
        checkOut: data.checkOut || ''
      });
    } catch (error) {
      console.error('Failed to load last minute hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded w-96 mx-auto"></div>
              <div className="h-6 bg-muted rounded w-[500px] mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-destructive/95 via-destructive/85 to-destructive/70" />
        
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 text-center text-white">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-2 text-sm font-bold backdrop-blur">
            <Zap className="w-4 h-4 mr-2 fill-current" />
            {pageData.badgeText}
          </Badge>
          
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">
            {pageData.title}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            {pageData.subtitle}
          </p>

          {pageData.checkIn && pageData.checkOut && (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Check-in: {new Date(pageData.checkIn).toLocaleDateString(locale)}</span>
              </div>
              <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Check-out: {new Date(pageData.checkOut).toLocaleDateString(locale)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hotels Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {hotels.length === 0 ? (
            <div className="text-center py-20">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">{t('noDeals')}</h2>
              <p className="text-muted-foreground mb-6">{t('checkBack')}</p>
              <Button asChild>
                <Link href={`/${locale}/search`}>
                  {t('browseHotels')}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-muted-foreground">
                  {t('showingResults', { count: hotels.length })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden hover:shadow-2xl transition-all group">
                    <div className="relative h-56">
                      <Image
                        src={hotel.images[0] || '/placeholder-hotel.jpg'}
                        alt={hotel.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {hotel.rooms.some(room => room.isSuperDeal) && (
                          <Badge className="bg-destructive text-destructive-foreground font-bold">
                            <Zap className="h-3 w-3 mr-1 fill-current" />
                            Super Deal
                          </Badge>
                        )}
                        {hotel.stars > 0 && (
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {hotel.stars} {t('stars')}
                          </Badge>
                        )}
                      </div>

                      {/* Check-in date */}
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(hotel.lastMinuteCheckIn).toLocaleDateString(locale)}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-xl mb-2 line-clamp-1">{hotel.name}</h3>
                      
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{hotel.city}, {hotel.country}</span>
                      </div>

                      {/* Room info */}
                      <div className="mb-4 space-y-2">
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {hotel.rooms.length} {t('roomTypes')}
                        </div>
                        {hotel.rooms[0] && (
                          <div className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>{hotel.rooms[0].mealType}</span>
                          </div>
                        )}
                        {hotel.rooms.some(room => room.isRefundable) && (
                          <div className="text-sm flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>{t('refundable')}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t('from')}
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {hotel.minPrice.toFixed(2)} {hotel.currency}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('perNight')}
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/${locale}/hotel/${hotel.id}?checkIn=${pageData.checkIn || getDefaultCheckIn()}&checkOut=${pageData.checkOut || getDefaultCheckOut()}&adults=1&children=0&b2c=1${hotel.destinationId ? `&destinationId=${hotel.destinationId}` : ''}${hotel.resortId ? `&resortId=${hotel.resortId}` : ''}`}>
                            {t('viewDetails')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href={`/${locale}/search`}>
              {t('cta.button')}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
