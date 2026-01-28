'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Star, TrendingDown, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { lastMinuteAPI } from '@/lib/api/client';
import { validateAndMapLocale } from '@/lib/utils/language-mapping';
import type { LastMinuteHotel } from '@/types/last-minute';

interface LastMinuteDealsProps {
  title?: string;
  subtitle?: string;
}

export function LastMinuteDeals({ title, subtitle }: LastMinuteDealsProps) {
  const t = useTranslations('home.lastMinute');
  const locale = useLocale();
  const [hotels, setHotels] = useState<LastMinuteHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  useEffect(() => {
    loadDeals();
  }, [locale]);

  const loadDeals = async () => {
    try {
      // Map and validate locale for SunHotels API
      const sunhotelsLanguage = validateAndMapLocale(locale, 'en');
      const data = await lastMinuteAPI.getHotels(sunhotelsLanguage);
      setHotels(data.hotels || []);
      setBadgeText(data.badgeText || t('badge'));
      setSectionTitle(data.title || '');
      setSectionSubtitle(data.subtitle || '');
      setCheckInDate(data.checkIn || '');
      setCheckOutDate(data.checkOut || '');
    } catch (error) {
      console.error('Failed to load last minute hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (hotels.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-4">
            <Clock className="h-4 w-4" />
            <span className="font-semibold text-sm">{badgeText || t('badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title || sectionTitle || t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle || sectionSubtitle || t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {hotels.slice(0, 6).map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden hover:shadow-2xl transition-all group">
              <div className="relative h-48">
                <Image
                  src={hotel.images[0] || '/placeholder-hotel.jpg'}
                  alt={hotel.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {hotel.rooms.some(room => room.isSuperDeal) && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-destructive text-destructive-foreground font-bold">
                      <Zap className="h-3 w-3 mr-1 fill-current" />
                      {t('superDeal')}
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(hotel.lastMinuteCheckIn).toLocaleDateString(locale)}
                  </Badge>
                  {hotel.stars > 0 && (
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {hotel.stars}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{hotel.name}</h3>
                <div className="flex items-center text-muted-foreground text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {hotel.city}, {hotel.country}
                </div>
                <div className="flex items-center justify-between mb-4">
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
                    <Link href={`/${locale}/hotel/${hotel.id}?checkIn=${checkInDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&checkOut=${checkOutDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&adults=1&children=0${hotel.destinationId ? `&destinationId=${hotel.destinationId}` : ''}${hotel.resortId ? `&resortId=${hotel.resortId}` : ''}`}>
                      {t('viewButton')}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/lastminute-deals`}>
              {t('viewAll')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
