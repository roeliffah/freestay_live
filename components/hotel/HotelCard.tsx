'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Star, MapPin, Wifi, Coffee, Dumbbell, Waves, UtensilsCrossed, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { tr, enUS, de, fr, es, it, el, ru, nl, type Locale } from 'date-fns/locale';

interface Hotel {
  hotelId: number;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  category: number;
  resortName: string;
  minPrice: number;
  currency?: string;
  images?: Array<{ url: string; order: number }>;
  imageUrls?: string[];
  reviewScore?: number;
  reviewCount?: number;
  featureIds?: number[];
  themeIds?: number[];
}

interface HotelCardProps {
  hotel: Hotel;
}

const facilityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Restaurant': UtensilsCrossed,
  'Gym': Dumbbell,
  'Pool': Waves,
  'Beach': Waves,
  'Spa': Waves,
  'Golf': Dumbbell,
};

// Default dates outside component to avoid impure function calls during render
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

export function HotelCard({ hotel }: HotelCardProps) {
  const t = useTranslations('hotel');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  
  const localeMap: Record<string, Locale> = {
    tr, en: enUS, de, fr, es, it, el, ru, nl
  };
  const dateLocale = localeMap[locale] || enUS;

  // Build hotel detail URL with search parameters
  const checkIn = searchParams.get('checkIn') || getDefaultCheckIn();
  const checkOut = searchParams.get('checkOut') || getDefaultCheckOut();
  const adults = searchParams.get('adults') || '2';
  const children = searchParams.get('children') || '0';
  
  const hotelUrl = `/${locale}/hotel/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;

  // Backend'den gelen özellikler listesi yoksa default liste kullan
  const facilities = ['WiFi', 'Restaurant', 'Pool', 'Spa', 'Gym', 'Beach'];

  // imageUrls (unified endpoint) veya images (legacy) kullan
  const imageUrl = hotel.imageUrls?.[0] || hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const currency = hotel.currency || 'EUR';
  
  const hasPrice = hotel.minPrice && hotel.minPrice > 0;
  const hasDates = checkIn && checkOut;
  
  const handleDateSearch = () => {
    if (checkInDate && checkOutDate) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('checkIn', format(checkInDate, 'yyyy-MM-dd'));
      newParams.set('checkOut', format(checkOutDate, 'yyyy-MM-dd'));
      
      router.push(`/${locale}/search?${newParams.toString()}`);
      setShowDatePicker(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Görsel */}
        <div className="relative h-48 sm:h-56 md:h-auto md:min-h-[250px]">
          <Image
            src={imageUrl}
            alt={hotel.name}
            fill
            className="object-cover"
          />
          {hotel.minPrice && hotel.minPrice < 100 && (
            <Badge className="absolute top-3 left-3 bg-red-500">
              {t('deal')}
            </Badge>
          )}
        </div>

        {/* Otel Bilgileri */}
        <div className="p-6 md:col-span-2 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <Link href={hotelUrl}>
                  <h3 className="text-2xl font-bold hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                </Link>
                <div className="flex items-center mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{hotel.city}, {hotel.country}</span>
                </div>
              </div>
              <div className="flex flex-col items-end ml-4">
                <div className="flex items-center">
                  {Array.from({ length: hotel.category }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground mt-1">{hotel.category} Star</span>
                {hotel.reviewScore && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs font-semibold text-primary mr-1">{hotel.reviewScore.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({hotel.reviewCount} {t('reviews')})</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 my-4">
              {hotel.description}
            </p>

            {/* Tesisler */}
            <div className="flex flex-wrap gap-2 mt-3">
              {facilities.slice(0, 6).map((facility, idx) => {
                const Icon = facilityIcons[facility] || Coffee;
                return (
                  <div
                    key={idx}
                    className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {facility}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fiyat ve CTA */}
          <div className="mt-4 pt-4 border-t flex items-end justify-between">
            <div className="flex-1">
              {hasPrice ? (
                <>
                  <p className="text-sm text-muted-foreground">{t('startingPrice')}</p>
                  <p className="text-3xl font-bold text-primary">
                    {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '₺'}{hotel.minPrice?.toLocaleString(locale)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('taxIncluded')}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('priceNotAvailable')}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDatePicker(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    {t('selectDates')}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Link href={hotelUrl}>
                <Button className="w-full min-w-[150px]">
                  {t('viewDetails')}
                </Button>
              </Link>
              <p className="text-xs text-green-600 text-center">
                ✓ {t('freeCancellation')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tarih Seçme Modalı */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('selectDatesForPrice')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('checkIn')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, 'PPP', { locale: dateLocale }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={checkInDate}
                      onSelect={setCheckInDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('checkOut')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, 'PPP', { locale: dateLocale }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      disabled={(date) => !checkInDate || date <= checkInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button 
              onClick={handleDateSearch}
              disabled={!checkInDate || !checkOutDate}
              className="w-full"
            >
              {t('searchWithDates')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
