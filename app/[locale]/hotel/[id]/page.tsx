'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
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
  'Free Wi-Fi': Wifi,
  'Gym/fitness': Dumbbell,
  'Gym/fitness facilities': Dumbbell,
  'Car park': ParkingCircle,
  'Car parking': ParkingCircle,
  'Business services': Coffee,
  'Business': Coffee,
  'Breakfast': Coffee,
  'Breakfast room': Coffee,
  '24hr reception': Check,
  '24h reception': Check,
  'Air Conditioning': Check,
  'Wireless internet': Wifi,
  'Elevator': Check,
  'Ironing facilities': Check,
  'Laundry facilities': Check,
  'Shuttle services': Check,
  'Credit Cards - Amex/Visa/Mastercard': Check,
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
  const [noAvailability, setNoAvailability] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastMinuteDeals, setLastMinuteDeals] = useState<any[]>([]);
  const [suggestedDate, setSuggestedDate] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [profitMargin, setProfitMargin] = useState<number | null>(null); // Kar marjı %
  const [defaultVatRate, setDefaultVatRate] = useState<number | null>(null); // KDV %
  const [settingsLoaded, setSettingsLoaded] = useState(false); // Settings yükleme flag
  
  // Search criteria states
  const getDefaultCheckIn = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const getDefaultCheckOut = () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [searchCheckIn, setSearchCheckIn] = useState(searchParams.get('checkIn') || getDefaultCheckIn());
  const [searchCheckOut, setSearchCheckOut] = useState(searchParams.get('checkOut') || getDefaultCheckOut());
  const [searchAdults, setSearchAdults] = useState(parseInt(searchParams.get('adults') || '1'));
  const [searchChildren, setSearchChildren] = useState(parseInt(searchParams.get('children') || '0'));

  // Keep local search state in sync with querystring changes (e.g., suggested date buttons)
  useEffect(() => {
    const nextCheckIn = searchParams.get('checkIn') || getDefaultCheckIn();
    const nextCheckOut = searchParams.get('checkOut') || getDefaultCheckOut();
    const nextAdults = parseInt(searchParams.get('adults') || '1');
    const nextChildren = parseInt(searchParams.get('children') || '0');

    if (nextCheckIn !== searchCheckIn) setSearchCheckIn(nextCheckIn);
    if (nextCheckOut !== searchCheckOut) setSearchCheckOut(nextCheckOut);
    if (!Number.isNaN(nextAdults) && nextAdults !== searchAdults) setSearchAdults(nextAdults);
    if (!Number.isNaN(nextChildren) && nextChildren !== searchChildren) setSearchChildren(nextChildren);
  }, [searchParams]);

  // Fiyat hesaplama fonksiyonu
  const calculateFinalPrice = (basePrice: number): number => {
    if (!basePrice || profitMargin === null || defaultVatRate === null) return basePrice || 0;
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
        } else {
          // API hatası durumunda default değerleri set et
          setProfitMargin(0);
          setDefaultVatRate(0);
        }
      } catch (error) {
        console.warn('⚠️ Settings yüklenemedi, varsayılan değerler kullanılıyor:', error);
        // Fallback: default değerler kullan
        setProfitMargin(0);
        setDefaultVatRate(0);
      } finally {
        // Settings yükleme tamamlandı, hotel detay yüklemesini başlat
        setSettingsLoaded(true);
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
    
    // Save complete booking data to localStorage (avoid unnecessary API calls)
    const bookingData = {
      hotel: {
        id: hotel.hotelId,
        name: hotel.name,
        address: hotel.contact.address,
        city: hotel.contact.city,
        country: hotel.contact.country,
        images: hotel.images,
        stars: hotel.stars,
        destinationId: hotel.location?.destination?.id || '',
        resortId: hotel.location?.resort?.id || 0,
      },
      room: {
        id: room.roomId,
        roomTypeId: room.roomTypeId,
        name: room.roomTypeName,
        boardType: room.mealName,
        mealId: room.mealId,
        price: room.price.total,
        pricePerNight: room.price.perNight,
        currency: room.price.currency,
      },
      booking: {
        checkIn: hotel.pricing.checkIn,
        checkOut: hotel.pricing.checkOut,
        nights: hotel.pricing.nights,
        adults: hotel.pricing.adults,
        children: hotel.pricing.children,
      },
      timestamp: new Date().toISOString(),
    };

    // Store in localStorage
    localStorage.setItem('freestays_booking_data', JSON.stringify(bookingData));
    console.log('💾 Booking data saved to localStorage:', bookingData);
    
    // Navigate to booking page with ALL required params
    const bookingParams = new URLSearchParams({
      hotelId: String(hotel.hotelId),
      roomId: String(room.roomId),
      roomTypeId: String(room.roomTypeId || room.roomId),
      mealId: String(room.mealId || 1),
      checkIn: hotel.pricing.checkIn,
      checkOut: hotel.pricing.checkOut,
      adults: String(hotel.pricing.adults),
      children: String(hotel.pricing.children),
      currency: room.price.currency || 'EUR',
      ...(hotel.location?.destination?.id && { destinationId: String(hotel.location.destination.id) }),
      ...(hotel.location?.resort?.id && { resortId: String(hotel.location.resort.id) }),
    });

    router.push(`/${locale}/booking?${bookingParams.toString()}`);
  };

  // Reload hotel details when search parameters change
  useEffect(() => {
    if (!settingsLoaded) return; // Wait for settings to load first
    
    const loadHotelDetails = async () => {
      setLoading(true);
      setNoAvailability(false);
      setErrorMessage(null);
      setSuggestedDate(null);
      setLastMinuteDeals([]);
      try {
        // Get search parameters from state (synced with URL via useEffect)
        const checkIn = searchCheckIn;
        const checkOut = searchCheckOut;
        const adults = searchAdults;
        const children = searchChildren;
        const destinationId = searchParams.get('destinationId') || '';
        const resortId = searchParams.get('resortId') || '';

        const mapApiResponseToHotelData = (result: any): HotelDetailApiResponse => {
          // API response: { hotel: {...}, rooms: [...], availability: {...} }
          // Eski format: flat structure - Yeni format: nested structure
          const hotelData = result.hotel || result;
          const roomsData = result.rooms || hotelData.rooms || [];
          const availabilityData = result.availability || {};
          
          // Contact bilgisi nested veya flat olabilir
          const contactData = hotelData.contact || {};
          const locationData = hotelData.location || {};
          
          // Pricing bilgisi nested veya flat olabilir
          const pricingData = hotelData.pricing || {};
          
          console.log('🔍 Mapping hotel data:', { 
            name: hotelData.name, 
            stars: hotelData.stars,
            city: contactData.city || hotelData.city,
            roomCount: roomsData.length 
          });
          
          return {
            hotel: {
              hotelId: hotelData.id || hotelData.hotelId || parseInt(hotelId),
              name: hotelData.name || 'Hotel',
              description: hotelData.description || '',
              category: hotelData.category || hotelData.stars || 0,
              stars: hotelData.stars || hotelData.category || 0,
              contact: {
                address: contactData.address || hotelData.address || '',
                city: contactData.city || hotelData.city || '',
                country: contactData.country || hotelData.country || '',
                countryCode: contactData.countryCode || hotelData.countryCode || '',
                phone: contactData.phone || hotelData.phone || '',
                email: contactData.email || hotelData.email || '',
                website: contactData.website || hotelData.website || '',
              },
              location: {
                latitude: locationData.latitude || hotelData.latitude || 0,
                longitude: locationData.longitude || hotelData.longitude || 0,
                destination: { 
                  id: locationData.destination?.id || hotelData.destinationId || '', 
                  name: locationData.destination?.name || hotelData.destinationName || '' 
                },
                resort: { 
                  id: locationData.resort?.id || hotelData.resortId || 0, 
                  name: locationData.resort?.name || hotelData.resortName || '' 
                },
                giataCode: locationData.giataCode || hotelData.giataCode || '',
              },
              // images: string[] doğrudan veya {url: string}[] formatında olabilir
              images: Array.isArray(hotelData.images) 
                ? hotelData.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean)
                : (hotelData.imageUrls || []),
              pricing: {
                minPrice: pricingData.minPrice || hotelData.minPrice || 0,
                currency: pricingData.currency || 'EUR',
                checkIn: pricingData.checkIn || checkIn,
                checkOut: pricingData.checkOut || checkOut,
                nights: pricingData.nights || Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)),
                adults: pricingData.adults || adults,
                children: pricingData.children || children,
              },
              reviews: {
                score: hotelData.reviews?.score || hotelData.reviewScore || 0,
                count: hotelData.reviews?.count || hotelData.reviewCount || 0,
                rating: hotelData.reviews?.rating || '',
              },
              features: (hotelData.features || []).map((feature: any) => ({ 
                id: feature.id, 
                name: feature.name 
              })),
              themes: (hotelData.themes || []).map((theme: any) => ({ 
                id: theme.id, 
                name: theme.name 
              })),
              totalRooms: hotelData.totalRooms || roomsData.length || 0,
            },
            rooms: roomsData.map((r: any, index: number) => {
              // Room price nested veya flat olabilir
              const roomPrice = r.price || {};
              const roomPricing = r.pricing || {};
              const roomAvailability = r.availability || {};
              const roomPolicies = r.policies || {};
              
              const nights = roomPrice.nights || Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
              const totalPrice = roomPrice.total || roomPrice || 0;
              const perNightPrice = roomPrice.perNight || (typeof totalPrice === 'number' ? totalPrice / nights : 0);
              const availableRooms = roomAvailability.availableRooms || r.availableRooms || 0;
              
              // Oda resimleri - API'den gelen images array'i veya boş array
              const roomImages = Array.isArray(r.images) ? r.images : [];
              
              console.log('🔍 Room mapping:', { 
                roomId: r.roomId, 
                name: r.name,
                total: totalPrice, 
                perNight: perNightPrice,
                nights, 
                availableRooms, 
                isAvailable: roomAvailability.isAvailable ?? availableRooms > 0,
                imagesCount: roomImages.length
              });
              
              return {
                roomId: r.roomId || index,
                roomTypeId: r.roomTypeId || 0,
                roomTypeName: r.roomTypeName || r.name || 'Standard Room',
                name: r.name || r.roomTypeName || 'Standard Room',
                description: r.description || '',
                images: roomImages,
                mealId: r.mealId || 1,
                mealName: r.mealName || 'Room Only',
                price: {
                  total: typeof totalPrice === 'number' ? totalPrice : 0,
                  perNight: typeof perNightPrice === 'number' ? perNightPrice : 0,
                  currency: roomPrice.currency || r.currency || 'EUR',
                  nights: nights,
                },
                pricing: {
                  originalPrice: roomPricing.originalPrice || totalPrice,
                  currentPrice: roomPricing.currentPrice || totalPrice,
                  discount: roomPricing.discount || 0,
                  discountPercentage: roomPricing.discountPercentage || 0,
                },
                availability: {
                  availableRooms: availableRooms,
                  isAvailable: roomAvailability.isAvailable ?? availableRooms > 0,
                },
                policies: {
                  isRefundable: roomPolicies.isRefundable ?? r.isRefundable ?? false,
                  isSuperDeal: roomPolicies.isSuperDeal ?? r.isSuperDeal ?? false,
                  cancellationPolicies: roomPolicies.cancellationPolicies || r.cancellationPolicies || [],
                  earliestFreeCancellation: roomPolicies.earliestFreeCancellation || r.earliestNonFreeCancellationDate || '',
                },
                paymentMethods: r.paymentMethods || r.paymentMethodIds || [],
              };
            }),
            availability: {
              hasAvailableRooms: availabilityData.hasAvailableRooms ?? roomsData.length > 0,
              totalAvailableRooms: availabilityData.totalAvailableRooms ?? roomsData.length,
            },
          };
        };

        // Skip invalid date ranges
        if (!checkIn || !checkOut || new Date(checkOut) < new Date(checkIn)) {
          console.warn('⚠️ Invalid date range, skipping request', { checkIn, checkOut });
          setHotelData(null);
          return;
        }
        
        console.log('🏨 Loading hotel detail (backend API):', {
          hotelId,
          checkIn,
          checkOut,
          adults,
          children,
          destinationId,
          resortId,
          locale,
        });

        // Fetch hotel details from BACKEND API (Swagger: GET /api/v1/sunhotels/hotels/{hotelId}/details)
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        
        // Build query string manually to avoid encoding issues
        const queryParts: string[] = [];
        if (checkIn) queryParts.push(`checkIn=${encodeURIComponent(checkIn)}`);
        if (checkOut) queryParts.push(`checkOut=${encodeURIComponent(checkOut)}`);
        queryParts.push(`adults=${adults}`);
        queryParts.push(`children=${children}`);
        queryParts.push(`currency=EUR`);
        if (destinationId) queryParts.push(`destinationId=${encodeURIComponent(destinationId)}`);
        if (resortId) queryParts.push(`resortId=${encodeURIComponent(resortId)}`);
        
        const queryString = queryParts.join('&');
        // DÜZELTME: Doğru endpoint kullanılıyor - /sunhotels/hotels/{hotelId}/details
        // Eski endpoint /Hotels/{id} UUID bekliyordu, SunHotels int ID ile çalışmıyordu
        const requestUrl = `${API_URL}/sunhotels/hotels/${hotelId}/details?${queryString}`;

        console.log('📡 API Request URL:', requestUrl);
        console.log('📡 Request parameters:', {
          hotelId,
          checkIn: `"${checkIn}"`,
          checkOut: `"${checkOut}"`,
          adults,
          children,
          destinationId,
          resortId,
        });

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': locale || 'en',
          },
        });

        const responseText = await response.text();
        let parsedResult: any = null;
        if (responseText) {
          try {
            parsedResult = JSON.parse(responseText);
          } catch (err) {
            console.error('❌ Failed to parse hotel detail response JSON:', err);
          }
        }

        if (!response.ok) {
          console.error('❌ Hotel detail failed:', response.status);
          console.error('❌ Error details:', responseText);
          console.error('❌ Request URL:', requestUrl);

          setNoAvailability(true);
          const message = parsedResult?.message || parsedResult?.error || 'No availability for selected dates.';
          setErrorMessage(message);

          // Try to map hotel data even when no availability so we can show hotel info
          if (parsedResult) {
            try {
              const mapped = mapApiResponseToHotelData(parsedResult);
              setHotelData(mapped);
            } catch (mapErr) {
              console.error('❌ Failed to map hotel detail on error:', mapErr);
              setHotelData(null);
            }
          } else {
            setHotelData(null);
          }

          // 1. Son dakika fırsatlarını yükle (destinasyon/resort bazlı)
          try {
            // Önce destinasyon/resort bazlı aramayı dene
            const lastMinuteParams = new URLSearchParams();
            if (destinationId) lastMinuteParams.append('destinationId', destinationId);
            if (resortId) lastMinuteParams.append('resortId', resortId);
            
            const lastMinuteUrl = `${API_URL}/public/hotels/last-minute${lastMinuteParams.toString() ? `?${lastMinuteParams.toString()}` : ''}`;
            console.log('🔍 Last minute oteller sorgulanıyor:', lastMinuteUrl);
            
            const lastMinuteRes = await fetch(lastMinuteUrl, {
              headers: { 'Accept-Language': locale || 'en' },
            });
            
            if (lastMinuteRes.ok) {
              const deals = await lastMinuteRes.json();
              console.log('📦 Son dakika API response:', deals);
              const dealsArray = Array.isArray(deals) ? deals : (deals.hotels || deals.data || []);
              
              // Mevcut oteli listeden çıkar
              const filteredDeals = dealsArray.filter((deal: any) => 
                String(deal.hotelId || deal.id) !== String(hotelId)
              );
              
              setLastMinuteDeals(filteredDeals.slice(0, 6));
              console.log('✅ Son dakika fırsatları yüklendi:', {
                total: filteredDeals.length,
                shown: Math.min(6, filteredDeals.length),
                filters: { destinationId, resortId }
              });
            }
          } catch (err) {
            console.error('❌ Son dakika fırsatları yüklenemedi:', err);
            setLastMinuteDeals([]);
          }

          // 2. Backend önerisi varsa kullan, yoksa bir ay sonraki tarihi öner
          const suggestedCheckIn = parsedResult?.suggestedCheckIn || parsedResult?.suggestedDate?.checkIn;
          const suggestedCheckOut = parsedResult?.suggestedCheckOut || parsedResult?.suggestedDate?.checkOut;

          if (suggestedCheckIn && suggestedCheckOut) {
            setSuggestedDate({ checkIn: suggestedCheckIn, checkOut: suggestedCheckOut });
          } else {
            const nextMonthCheckIn = new Date(checkIn || Date.now());
            nextMonthCheckIn.setMonth(nextMonthCheckIn.getMonth() + 1);
            const nextMonthCheckOut = new Date(checkOut || Date.now());
            nextMonthCheckOut.setMonth(nextMonthCheckOut.getMonth() + 1);
            setSuggestedDate({
              checkIn: nextMonthCheckIn.toISOString().split('T')[0],
              checkOut: nextMonthCheckOut.toISOString().split('T')[0],
            });
          }

          return;
        }

        const result = parsedResult || {};
        console.log('✅ Hotel detail loaded (backend):', result);
        
        // Backend returns: { message: "...", hotelId: 123, name: "...", rooms: [] }
        // Set error message and noAvailability if message field exists or rooms is empty
        const hasRooms = result.rooms && result.rooms.length > 0;
        const errorMsg = result.message || result.error;
        
        if (errorMsg) {
          console.warn('⚠️ API Message:', errorMsg);
          setErrorMessage(errorMsg);
        }
        
        if (!hasRooms) {
          console.warn('⚠️ No rooms available from API for selected dates');
          console.warn('⚠️ API may not have availability for:', { checkIn, checkOut, adults, children });
          setNoAvailability(true);
          
          // Set suggested date if not already set
          if (!suggestedDate) {
            const nextMonthCheckIn = new Date(checkIn || Date.now());
            nextMonthCheckIn.setMonth(nextMonthCheckIn.getMonth() + 1);
            const nextMonthCheckOut = new Date(checkOut || Date.now());
            nextMonthCheckOut.setMonth(nextMonthCheckOut.getMonth() + 1);
            setSuggestedDate({
              checkIn: nextMonthCheckIn.toISOString().split('T')[0],
              checkOut: nextMonthCheckOut.toISOString().split('T')[0],
            });
          }
        }
        
        const mappedData = mapApiResponseToHotelData(result);
        setHotelData(mappedData);
        
        console.log('✅ Hotel detail mapped:', {
          name: mappedData.hotel.name,
          rooms: mappedData.rooms.length,
          firstRoomAvailability: mappedData.rooms[0]?.availability,
          firstRoomData: mappedData.rooms[0],
        });
      } catch (error) {
        console.error('❌ Hotel detail loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Sadece settings yüklendikten sonra hotel detay yükle
    if (settingsLoaded) {
      loadHotelDetails();
    }
  }, [hotelId, searchCheckIn, searchCheckOut, searchAdults, searchChildren, locale, settingsLoaded]);

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

  // Müsaitlik yoksa alternatif öneriler göster
  if (noAvailability && !hotelData) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <StickySearchBar
            locale={locale}
            initialCheckIn={searchCheckIn}
            initialCheckOut={searchCheckOut}
            initialAdults={searchAdults}
            initialChildren={searchChildren}
            currentPath={`/${locale}/hotel/${hotelId}`}
            onUpdate={({ checkIn, checkOut, adults, children }) => {
              setSearchCheckIn(checkIn);
              setSearchCheckOut(checkOut);
              setSearchAdults(adults);
              setSearchChildren(children);
            }}
          />
          
          {/* Bilgilendirme Kartı */}
          <Card className="p-8 mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Bu Otel Seçtiğiniz Tarihlerde Müsait Değil</h2>
                <p className="text-muted-foreground mb-4">
                  Üzgünüz, aradığınız otel <strong>{searchCheckIn}</strong> - <strong>{searchCheckOut}</strong> tarihleri 
                  için müsait değil. Ancak size harika alternatifler hazırladık!
                </p>
                {suggestedDate && (
                  <div className="bg-white p-4 rounded-lg border border-yellow-200 mb-4">
                    <p className="font-semibold mb-2">💡 Önerilen Tarih:</p>
                    <Button
                      onClick={() => {
                        setSearchCheckIn(suggestedDate.checkIn);
                        setSearchCheckOut(suggestedDate.checkOut);
                        setNoAvailability(false);
                        const nextUrl = `/${locale}/hotel/${hotelId}?checkIn=${suggestedDate.checkIn}&checkOut=${suggestedDate.checkOut}&adults=${searchAdults}&children=${searchChildren}`;
                        router.replace(nextUrl);
                      }}
                      className="w-full sm:w-auto"
                    >
                      {suggestedDate.checkIn} - {suggestedDate.checkOut} tarihlerini dene
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Son Dakika Fırsatları */}
          {lastMinuteDeals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-6">🔥 Son Dakika Fırsatları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lastMinuteDeals.map((deal: any) => (
                  <Card 
                    key={deal.hotelId || deal.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/${locale}/hotel/${deal.hotelId || deal.id}?checkIn=${searchCheckIn}&checkOut=${searchCheckOut}&adults=${searchAdults}&children=${searchChildren}`)}
                  >
                    {deal.imageUrl && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={deal.imageUrl}
                          alt={deal.hotelName || deal.name}
                          fill
                          className="object-cover"
                        />
                        {deal.discount && (
                          <Badge className="absolute top-2 right-2 bg-red-500">
                            {deal.discount}% İndirim
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{deal.hotelName || deal.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        📍 {deal.city || deal.location?.city}, {deal.country || deal.location?.country}
                      </p>
                      {deal.stars && (
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: deal.stars }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      {deal.price && (
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            {deal.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through mr-2">
                                €{deal.originalPrice}
                              </span>
                            )}
                            <span className="text-2xl font-bold text-primary">€{deal.price}</span>
                            <span className="text-sm text-muted-foreground"> /gece</span>
                          </div>
                          <Button size="sm">İncele</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Farklı Tarih Ara Butonu */}
          <Card className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4">Farklı Bir Tarih Arıyorsanız</h3>
            <p className="text-muted-foreground mb-6">
              Yukarıdaki arama çubuğundan farklı tarihler seçerek tekrar deneyebilirsiniz.
            </p>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Yeni Tarih Seç
            </Button>
          </Card>
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
          // Update URL with new search parameters
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.set('checkIn', checkIn);
          newParams.set('checkOut', checkOut);
          newParams.set('adults', String(adults));
          newParams.set('children', String(children));
          
          // Update URL (will trigger useEffect to reload data)
          router.push(`/${locale}/hotel/${hotelId}?${newParams.toString()}`);
        }}
        locale={locale}
        currentPath={`/${locale}/hotel/${hotelId}`}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Otel Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Error Mesajı - API'den error geldiğinde göster */}
            {errorMessage && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1">Müsaitlik Bilgisi</h3>
                    <p className="text-sm text-amber-700 mb-3">{errorMessage}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        📅 Farklı Tarih Seçin
                      </Button>
                      {suggestedDate && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSearchCheckIn(suggestedDate.checkIn);
                            setSearchCheckOut(suggestedDate.checkOut);
                            setNoAvailability(false);
                            const nextUrl = `/${locale}/hotel/${hotelId}?checkIn=${suggestedDate.checkIn}&checkOut=${suggestedDate.checkOut}&adults=${searchAdults}&children=${searchChildren}`;
                            router.replace(nextUrl);
                          }}
                        >
                          💡 {suggestedDate.checkIn} tarihini dene
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
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

            {/* Tesisler - Sadece veri varsa göster */}
            {hotel.features && hotel.features.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">✨ {t('facilities')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.features.map((feature) => {
                    const Icon = facilityIcons[feature.name] || Check;
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

            {/* Temalar - Sadece veri varsa göster */}
            {hotel.themes && hotel.themes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">🎨 Hotel Themes</h2>
                <div className="flex flex-wrap gap-3">
                  {hotel.themes.map((theme) => (
                    <Badge key={theme.id} variant="secondary" className="px-4 py-2 text-sm">
                      ✨ {theme.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Oda Tipleri */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">{t('roomOptions')}</h2>
              <div className="space-y-4">
                {rooms.length > 0 ? (
                  rooms.map((room, index) => (
                    <div
                      key={`room-${room.roomId}-${room.mealId}-${index}`}
                      className="border rounded-lg overflow-hidden hover:border-primary transition-colors"
                    >
                      {/* Oda Resimleri */}
                      {room.images && room.images.length > 0 && (
                        <div className="relative h-48 bg-muted">
                          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                            {room.images.map((imageUrl: string, imgIndex: number) => (
                              <div key={imgIndex} className="flex-shrink-0 w-full h-full snap-center relative">
                                <Image
                                  src={imageUrl}
                                  alt={`${room.roomTypeName} - ${imgIndex + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                              </div>
                            ))}
                          </div>
                          {room.images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                              {room.images.map((_: string, dotIndex: number) => (
                                <span 
                                  key={dotIndex} 
                                  className="w-2 h-2 rounded-full bg-white/70 shadow"
                                />
                              ))}
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                            {room.images.length} {room.images.length > 1 ? 'photos' : 'photo'}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="p-4">
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
                              disabled={!room.availability?.isAvailable || (room.availability?.availableRooms || 0) === 0}
                            >
                              {t('makeReservation')}
                            </Button>
                          </div>
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
            <Card className="p-6">
              <h3 className="font-bold text-xl mb-4">{t('quickReservation')}</h3>
              <div className="space-y-4">
                {rooms.length > 0 && (() => {
                  const minPriceRoom = rooms.reduce((min, room) => 
                    room.price.total < min.price.total ? room : min
                  );
                  return (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('lowestPrice')}</p>
                    <p className="text-3xl font-bold text-primary">
                      {minPriceRoom.price.total.toLocaleString()}
                      <span className="text-lg ml-1">{minPriceRoom.price.currency}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {minPriceRoom.price.nights} nights • {hotel.pricing.adults} adults {hotel.pricing.children > 0 && `• ${hotel.pricing.children} children`}
                    </p>
                  </div>
                  );
                })()}

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

                <Button className="w-full" size="lg" disabled={rooms.length === 0}>
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
