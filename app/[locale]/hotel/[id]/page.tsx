'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { sunhotelsAPI } from '@/lib/api/client';
import type { HotelDetailApiResponse, HotelDetail } from '@/types/sunhotels';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { StickySearchBar } from '@/components/search/StickySearchBar';
import { ImageSlider } from '@/components/hotel/ImageSlider';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Wifi, 
  Coffee, 
  Dumbbell, 
  Waves,
  UtensilsCrossed,
  ParkingCircle,
  Sparkles,
  Check
} from 'lucide-react';

const facilityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Restaurant': UtensilsCrossed,
  'Gym': Dumbbell,
  'Pool': Waves,
  'Beach': Waves,
  'Parking': ParkingCircle,
  'Spa': Sparkles,
};

export default function HotelDetailPage() {
  const t = useTranslations('hotelDetail');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = params.id as string;
  const locale = params.locale as string;
  
  const [hotelData, setHotelData] = useState<HotelDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [profitMargin, setProfitMargin] = useState(0); // Kar marjı %
  const [defaultVatRate, setDefaultVatRate] = useState(0); // KDV %
  
  // Search criteria states
  const getDefaultCheckIn = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const getDefaultCheckOut = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [searchCheckIn, setSearchCheckIn] = useState(searchParams.get('checkIn') || getDefaultCheckIn());
  const [searchCheckOut, setSearchCheckOut] = useState(searchParams.get('checkOut') || getDefaultCheckOut());
  const [searchAdults, setSearchAdults] = useState(parseInt(searchParams.get('adults') || '1'));
  const [searchChildren, setSearchChildren] = useState(parseInt(searchParams.get('children') || '0'));

  // Fiyat hesaplama fonksiyonu
  const calculateFinalPrice = (basePrice: number): number => {
    if (!basePrice) return 0;
    const profitAmount = basePrice * (profitMargin / 100);
    const vatAmount = profitAmount * (defaultVatRate / 100);
    return Math.round((basePrice + profitAmount + vatAmount) * 100) / 100;
  };

  // Settings'ten kar marjı ve KDV'yi yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/public/settings/site`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfitMargin(data.profitMargin || 0);
          setDefaultVatRate(data.defaultVatRate || 0);
          console.log('✅ Settings yüklendi (Hotel Detail):', { profitMargin: data.profitMargin, defaultVatRate: data.defaultVatRate });
        }
      } catch (error) {
        console.warn('⚠️ Settings yüklenemedi, varsayılan değerler kullanılıyor:', error);
      }
    };
    
    loadSettings();
  }, []);


  // Get search params for booking
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '2';
  const children = searchParams.get('children') || '0';

  const handleBookRoom = (room: HotelDetailApiResponse['rooms'][0]) => {
    if (!hotelData) return;
    
    const { hotel } = hotelData;
    
    // Navigate to booking page with all necessary data
    const bookingParams = new URLSearchParams({
      hotelId: hotel.id.toString(),
      hotelName: hotel.name,
      roomId: room.roomTypeId.toString(),
      roomName: room.roomTypeName,
      boardType: room.mealName,
      checkIn: hotel.pricing.checkIn,
      checkOut: hotel.pricing.checkOut,
      adults: hotel.pricing.adults.toString(),
      children: hotel.pricing.children.toString(),
      price: room.price.total.toString(),
      currency: room.price.currency,
    });

    router.push(`/${locale}/booking?${bookingParams.toString()}`);
  };

  useEffect(() => {
    const loadHotelDetails = async () => {
      setLoading(true);
      try {
        // Get search parameters from URL (passed from search page or updated)
        const checkIn = searchCheckIn;
        const checkOut = searchCheckOut;
        const adults = searchAdults;
        const children = searchChildren;

        const hotelIdNumber = Number(hotelId);
        if (!Number.isFinite(hotelIdNumber)) {
          console.warn('⚠️ Invalid hotel id, skipping request', { hotelId });
          setHotelData(null);
          return;
        }

        // Skip invalid date ranges
        if (!checkIn || !checkOut || new Date(checkOut) < new Date(checkIn)) {
          console.warn('⚠️ Invalid date range, skipping request', { checkIn, checkOut });
          setHotelData(null);
          return;
        }
        
        console.log('🏨 Loading hotel detail:', {
          hotelId,
          checkIn,
          checkOut,
          adults,
          children,
        });

        const params = {
          checkIn,
          checkOut,
          currency: 'EUR',
          ...(adults > 0 && { adults }),
          ...(children > 0 && { children }),
        };

        // Fetch hotel details from LIVE API
        const response = await sunhotelsAPI.getHotelDetails(
          hotelIdNumber,
          params
        );

        // Kar marjı ve KDV hesaplamasını rooms üzerinde uygula
        const roomsWithCalculatedPrices = response.rooms.map(room => ({
          ...room,
          price: {
            ...room.price,
            total: calculateFinalPrice(room.price.total),
            perNight: calculateFinalPrice(room.price.perNight),
          },
          pricing: {
            ...room.pricing,
            originalPrice: calculateFinalPrice(room.pricing.originalPrice),
            currentPrice: calculateFinalPrice(room.pricing.currentPrice),
            discount: calculateFinalPrice(room.pricing.discount),
          },
        }));
        
        setHotelData({
          ...response,
          rooms: roomsWithCalculatedPrices,
        });
        
        console.log('✅ Hotel detail loaded:', {
          name: response.hotel.name,
          rooms: response.rooms.length,
          priceCalculated: true,
        });
      } catch (error) {
        console.error('❌ Hotel detail loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profitMargin !== undefined && defaultVatRate !== undefined) {
      loadHotelDetails();
    }
  }, [hotelId, searchCheckIn, searchCheckOut, searchAdults, searchChildren, locale, profitMargin, defaultVatRate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-[500px] w-full rounded-lg mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-lg">{t('hotelNotFound')}</p>
        </Card>
      </div>
    );
  }

  const { hotel, rooms, availability } = hotelData;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Image Slider */}
      <ImageSlider images={hotel.images} hotelName={hotel.name} />

      {/* Sticky Search Bar */}
      <StickySearchBar
        initialCheckIn={searchCheckIn}
        initialCheckOut={searchCheckOut}
        initialAdults={searchAdults}
        initialChildren={searchChildren}
        onUpdate={({ checkIn, checkOut, adults, children }) => {
          setSearchCheckIn(checkIn);
          setSearchCheckOut(checkOut);
          setSearchAdults(adults);
          setSearchChildren(children);
        }}
        locale={locale}
        currentPath={`/${locale}/hotel/${hotelId}`}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Otel Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{hotel.contact.address || `${hotel.contact.city}, ${hotel.contact.country}`}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Badge className="bg-primary">
                      {hotel.stars} Star Hotel
                    </Badge>
                    {hotel.reviews?.score && hotel.reviews.score > 0 && (
                      <Badge variant="secondary">
                        ⭐ {hotel.reviews.score.toFixed(1)} - {hotel.reviews.rating} ({hotel.reviews.count} reviews)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>📍 {hotel.contact?.city}, {hotel.contact?.country}</span>
                {hotel.location?.resort && <span>🏖️ {hotel.location.resort.name}</span>}
                {hotel.contact?.phone && <span>📞 {hotel.contact.phone}</span>}
              </div>
            </Card>

            {/* Açıklama */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{t('aboutHotel')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {hotel.description}
              </p>
            </Card>

            {/* Tesisler */}
            {hotel.features && hotel.features.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{t('facilities')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.features.map((feature) => {
                    const Icon = facilityIcons[feature.name] || Coffee;
                    return (
                      <div key={feature.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{feature.name}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Oda Tipleri */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">{t('roomOptions')}</h2>
              <div className="space-y-4">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.roomId}
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{room.roomTypeName}</h3>
                          <div className="flex gap-2 mb-3">
                            <Badge variant="secondary">
                              {room.mealName}
                            </Badge>
                            {room.policies?.isSuperDeal && (
                              <Badge variant="destructive">
                                🔥 Super Deal
                              </Badge>
                            )}
                            {room.pricing?.discountPercentage && room.pricing.discountPercentage > 0 && (
                              <Badge className="bg-green-600">
                                -{room.pricing.discountPercentage.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {room.description && (
                              <div className="flex items-center text-muted-foreground">
                                <Check className="h-4 w-4 mr-2" />
                                {room.description}
                              </div>
                            )}
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              {room.availability?.availableRooms && room.availability.availableRooms > 0 ? `${room.availability.availableRooms} rooms available` : 'Few rooms left'}
                            </div>
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              {room.policies?.isRefundable ? 'Free cancellation' : 'Non-refundable'}
                            </div>
                            {room.policies?.isRefundable && room.policies?.earliestFreeCancellation && (
                              <div className="flex items-center text-blue-600 text-xs">
                                <Check className="h-4 w-4 mr-2" />
                                Free cancellation until {new Date(room.policies.earliestFreeCancellation).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end justify-between min-w-[200px]">
                          <div className="text-right">
                            {room.pricing?.discountPercentage && room.pricing.discountPercentage > 0 && (
                              <p className="text-sm text-muted-foreground line-through">
                                {room.pricing.originalPrice.toLocaleString()} {room.price.currency}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{t('totalPrice')} ({room.price.nights} nights)</p>
                            <p className="text-3xl font-bold text-primary">
                              {room.price.total.toLocaleString()}
                              <span className="text-lg ml-1">{room.price.currency}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {room.price.perNight.toLocaleString()} {room.price.currency} / night
                            </p>
                          </div>
                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleBookRoom(room)}
                            disabled={!room.availability?.isAvailable}
                          >
                            {t('makeReservation')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noRoomsAvailable')}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sağ Kolon - Harita ve Hızlı Rezervasyon */}
          <div className="space-y-6">
            {/* Hızlı Rezervasyon */}
            <Card className="p-6 sticky top-44">
              <h3 className="font-bold text-xl mb-4">{t('quickReservation')}</h3>
              <div className="space-y-4">
                {hotel.pricing && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('lowestPrice')}</p>
                    <p className="text-3xl font-bold text-primary">
                      {hotel.pricing.minPrice.toLocaleString()}
                      <span className="text-lg ml-1">{hotel.pricing.currency}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hotel.pricing.nights} nights • {hotel.pricing.adults} adults {hotel.pricing.children > 0 && `• ${hotel.pricing.children} children`}
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    {t('instantConfirmation')}
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    {t('secureReservation')}
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2" />
                    {t('support247')}
                  </div>
                  {availability?.hasAvailableRooms && (
                    <div className="flex items-center text-orange-600">
                      <Check className="h-4 w-4 mr-2" />
                      {availability.totalAvailableRooms} rooms available
                    </div>
                  )}
                </div>

                <Button className="w-full" size="lg" disabled={!availability?.hasAvailableRooms}>
                  {t('makeReservation')}
                </Button>
              </div>
            </Card>

            {/* Konum */}
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">{t('location')}</h3>
              {hotel.location?.latitude && hotel.location?.longitude ? (
                <div className="aspect-video rounded-lg overflow-hidden mb-4">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'}&q=${hotel.location.latitude},${hotel.location.longitude}&zoom=15`}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {hotel.contact?.address || `${hotel.contact?.city}, ${hotel.contact?.country}`}
                {hotel.location?.resort && `, ${hotel.location.resort.name}`}
              </p>
              {hotel.location?.latitude && hotel.location?.longitude && (
                <p className="text-xs text-muted-foreground mt-2">
                  📍 {hotel.location.latitude.toFixed(4)}, {hotel.location.longitude.toFixed(4)}
                </p>
              )}
              {hotel.contact?.phone && (
                <p className="text-sm text-muted-foreground mt-2">
                  📞 {hotel.contact.phone}
                </p>
              )}
              {hotel.contact?.website && (
                <a 
                  href={hotel.contact.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  🌐 Visit Website
                </a>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
