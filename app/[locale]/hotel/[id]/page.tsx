'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { sunHotelsClient } from '@/lib/sunhotels/client';
import type { Hotel, RoomType, HotelDetailResponse } from '@/lib/sunhotels/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Get search params for booking
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '2';
  const children = searchParams.get('children') || '0';

  const handleBookRoom = (room: RoomType) => {
    if (!hotel) return;
    
    // Navigate to booking page with all necessary data
    const bookingParams = new URLSearchParams({
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      roomId: room.roomTypeId,
      roomName: room.roomTypeName,
      boardType: room.boardTypeName,
      checkIn,
      checkOut,
      adults,
      children,
      price: room.price.toString(),
      currency: room.currency,
    });

    router.push(`/${locale}/booking?${bookingParams.toString()}`);
  };

  useEffect(() => {
    const loadHotelDetails = async () => {
      setLoading(true);
      try {
        // Get search parameters from URL (passed from search page)
        const checkIn = searchParams.get('checkIn') || 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const checkOut = searchParams.get('checkOut') || 
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const adults = parseInt(searchParams.get('adults') || '2');
        const children = parseInt(searchParams.get('children') || '0');
        
        console.log('🏨 Loading hotel detail:', {
          hotelId,
          checkIn,
          checkOut,
          adults,
          children,
        });

        // Fetch hotel details from LIVE API
        const response = await sunHotelsClient.getHotelDetail(hotelId, {
          checkIn,
          checkOut,
          nationality: 'TR',
          currency: 'EUR',
          language: locale.toLowerCase(),
          rooms: [{ adult: adults, child: children }],
        });

        setHotel(response.hotel);
        setRooms(response.rooms);
        
        console.log('✅ Hotel detail loaded:', {
          name: response.hotel.hotelName,
          rooms: response.rooms.length,
        });
      } catch (error) {
        console.error('❌ Hotel detail loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHotelDetails();
  }, [hotelId, searchParams, locale]);

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

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <p className="text-lg">{t('hotelNotFound')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Görsel Galerisi */}
      <div className="bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-4 gap-2 h-[500px]">
            <div className="col-span-4 md:col-span-3 relative rounded-lg overflow-hidden">
              <Image
                src={hotel.images[selectedImage]?.url || hotel.images[0]?.url || '/placeholder-hotel.jpg'}
                alt={hotel.hotelName}
                fill
                className="object-cover"
              />
            </div>
            <div className="hidden md:grid grid-rows-3 gap-2">
              {hotel.images.slice(1, 4).map((img, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(index + 1)}
                >
                  <Image
                    src={img.url}
                    alt={`${hotel.hotelName} ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Otel Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{hotel.hotelName}</h1>
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{hotel.address || hotel.destinationName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      {Array.from({ length: hotel.category }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Badge className="bg-primary">
                      {hotel.categoryName}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>📍 {hotel.destinationName}</span>
                {hotel.location.latitude && hotel.location.longitude && (
                  <span>🗺️ {hotel.location.latitude.toFixed(4)}, {hotel.location.longitude.toFixed(4)}</span>
                )}
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
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{t('facilities')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.facilities.map((facility) => {
                  const Icon = facilityIcons[facility] || Coffee;
                  return (
                    <div key={facility} className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{facility}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Oda Tipleri */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">{t('roomOptions')}</h2>
              <div className="space-y-4">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.roomTypeId}
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">{room.roomTypeName}</h3>
                          <Badge variant="secondary" className="mb-3">
                            {room.boardTypeName}
                          </Badge>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              {t('maxGuests', { count: room.maxGuests })}
                            </div>
                            {room.description && (
                              <div className="flex items-center text-muted-foreground">
                                <Check className="h-4 w-4 mr-2" />
                                {room.description}
                              </div>
                            )}
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-2" />
                              {room.available > 0 ? t('roomsAvailable', { count: room.available }) : t('fewRoomsLeft')}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end justify-between min-w-[180px]">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{t('totalPrice')}</p>
                            <p className="text-3xl font-bold text-primary">
                              {room.price.toLocaleString()}
                              <span className="text-lg ml-1">{room.currency}</span>
                            </p>
                          </div>
                          <Button 
                            className="w-full mt-4"
                            onClick={() => handleBookRoom(room)}
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
            <Card className="p-6 sticky top-20">
              <h3 className="font-bold text-xl mb-4">{t('quickReservation')}</h3>
              <div className="space-y-4">
                {rooms.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('lowestPrice')}</p>
                    <p className="text-3xl font-bold text-primary">
                      {Math.min(...rooms.map(r => r.price)).toLocaleString()}
                      <span className="text-lg ml-1">{rooms[0]?.currency || 'EUR'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t('totalWithTax')}</p>
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
                </div>

                <Button className="w-full" size="lg" disabled={rooms.length === 0}>
                  {t('makeReservation')}
                </Button>
              </div>
            </Card>

            {/* Konum */}
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">{t('location')}</h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {hotel.address || hotel.destinationName}
                {hotel.regionName && `, ${hotel.regionName}`}
              </p>
              {hotel.location.latitude && hotel.location.longitude && (
                <p className="text-xs text-muted-foreground mt-2">
                  📍 {hotel.location.latitude.toFixed(4)}, {hotel.location.longitude.toFixed(4)}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
