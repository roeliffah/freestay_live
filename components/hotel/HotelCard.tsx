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

// Move facilityIcons outside component to avoid recreation on every render
const FACILITY_ICONS: Record<string, any> = {
  'WiFi': Wifi,
  'Restaurant': UtensilsCrossed,
  'Gym': Dumbbell,
  'Pool': Waves,
  'Beach': Waves,
  'Spa': Waves,
  'Golf': Dumbbell,
};

interface Hotel {
  hotelId: number;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  countryCode?: string;
  category: number;
  resortName: string;
  destinationId?: number;
  minPrice: number;
  currency?: string;
  images?: Array<{ url: string; order: number }>;
  imageUrls?: string[];
  reviewScore?: number;
  reviewCount?: number;
  featureIds?: number[];
  themeIds?: number[];
  features?: string[];
  themes?: string[];
  freeCancellation?: boolean;
  cancellationPolicy?: string;
}

interface HotelCardProps {
  hotel: Hotel;
}

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
  const [adults, setAdults] = useState<number>(parseInt(searchParams.get('adults') || '2'));
  const [children, setChildren] = useState<number>(parseInt(searchParams.get('children') || '0'));
  
  const localeMap: Record<string, Locale> = {
    tr, en: enUS, de, fr, es, it, el, ru, nl
  };
  const dateLocale = localeMap[locale] || enUS;

  // Build hotel detail URL with search parameters
  const checkIn = searchParams.get('checkIn') || getDefaultCheckIn();
  const checkOut = searchParams.get('checkOut') || getDefaultCheckOut();
  
  const hotelUrl = `/${locale}/hotel/${hotel.hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;

  // Gerçek feature verilerini kullan, yoksa boş array
  const displayFeatures = hotel.features || [];
  const hasFreeCancellation = hotel.freeCancellation === true;



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
      newParams.set('adults', adults.toString());
      newParams.set('children', children.toString());
      
      // SunHotels için konum bilgisi ekle
      if (hotel.destinationId) {
        newParams.set('destinationId', hotel.destinationId.toString());
      }
      // Belirli bir otel için arama yapıyoruz
      newParams.set('hotelId', hotel.hotelId.toString());
      
      // Ülke kodu varsa ekle
      if (hotel.countryCode) {
        newParams.set('country', hotel.countryCode);
      }
      
      router.push(`/${locale}/search?${newParams.toString()}`);
      setShowDatePicker(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Görsel */}
        <div className="relative h-48 sm:h-56 md:h-auto md:min-h-[250px] bg-muted">
          <Image
            src={imageUrl}
            alt={hotel.name}
            fill
            className="object-cover"
            placeholder="empty"
            sizes="(max-width: 768px) 100vw, 33vw"
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
            {displayFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {displayFeatures.slice(0, 6).map((feature, idx) => {
                  const Icon = FACILITY_ICONS[feature] || Coffee;
                  return (
                    <div
                      key={idx}
                      className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {feature}
                    </div>
                  );
                })}
              </div>
            )}
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
              {hasFreeCancellation && (
                <p className="text-xs text-green-600 text-center">
                  ✓ {t('freeCancellation')}
                </p>
              )}
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
            {/* Misafir Sayısı */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Yetişkin</label>
                <select 
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Çocuk (0-12 yaş)</label>
                <select 
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[0,1,2,3,4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Tarihler */}
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
