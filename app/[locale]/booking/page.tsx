'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Crown, Gift, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { HotelDetailApiResponse } from '@/types/sunhotels';

// ==================== TYPE DEFINITIONS ====================
interface PricingResult {
  roomTotal: number;
  bookingFee: number;
  discountAmount: number;
  passPrice: number;
  finalTotal: number;
}

interface ApiSettings {
  oneTimeCouponPrice: number;
  annualCouponPrice: number;
  extraFee: number;
  discountRate: number;
  profitMargin: number;
  defaultVatRate: number;
  stripePublicKey?: string;
}

function BookingContent() {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;

  const hotelId = searchParams.get('hotelId') || '';
  const roomId = searchParams.get('roomId') || '';
  const roomTypeId = searchParams.get('roomTypeId') || roomId; // Fallback to roomId if not provided
  const mealId = parseInt(searchParams.get('mealId') || '1');
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const currency = searchParams.get('currency') || 'EUR';
  const destinationId = searchParams.get('destinationId') || '';
  const resortId = searchParams.get('resortId') || '';

  const [hotelData, setHotelData] = useState<HotelDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings from API (for pricing and Stripe)
  const [settings, setSettings] = useState<ApiSettings>({
    oneTimeCouponPrice: 15,
    annualCouponPrice: 125,
    extraFee: 15,
    discountRate: 15,
    profitMargin: 16,
    defaultVatRate: 21,
    stripePublicKey: '',
  });

  // Pass selection states
  const [existingPassCode, setExistingPassCode] = useState('');
  const [passCodeValid, setPassCodeValid] = useState(false);
  const [passPurchaseType, setPassPurchaseType] = useState<'one_time' | 'annual' | null>(null);
  const [passCodeChecking, setPassCodeChecking] = useState(false);

  const guests = adults + children;
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1);

  // ==================== PRICE CALCULATION WITH PASS ====================
  // API Price Composition (from SunHotels):
  // 1. Nett hotel price from SunHotels
  // 2. + 16% profit margin (from settings.profitMargin)
  // 3. + 21% VAT on markup only (from settings.defaultVatRate)
  // = Final API price returned to frontend
  //
  // Frontend adjustments (based on pass selection):
  // - If PASS SELECTED: Apply 15% discount + waive €15 booking fee
  // - If NO PASS: Add €15 booking fee
  // - If PURCHASING PASS: Add pass price (€15 one-time or €125 annual)
  // = Final Total shown to user
  const calculatePricing = (
    apiPrice: number,
    hasValidPass: boolean = false,
    purchaseType: 'one_time' | 'annual' | null = null
  ): PricingResult => {
    // API price already has markup and VAT baked in
    const roomTotal = Number(apiPrice.toFixed(2));
    
    // Calculate discounts: booking fee waived + discount rate applied
    let bookingFee = settings.extraFee;
    let discountAmount = 0;

    if (hasValidPass || purchaseType) {
      // Waive booking fee
      bookingFee = 0;
      
      // Apply discount rate ONLY when coupon is validated or purchased
      discountAmount = Number(((roomTotal * settings.discountRate) / 100).toFixed(2));
    }
    
    // Calculate pass price
    let passPrice = 0;
    if (purchaseType === 'one_time') passPrice = settings.oneTimeCouponPrice;
    if (purchaseType === 'annual') passPrice = settings.annualCouponPrice;
    
    // Final total = room total - discount + pass price (no booking fee if pass selected)
    const finalTotal = Number((roomTotal - discountAmount + bookingFee + passPrice).toFixed(2));
    
    return {
      roomTotal,
      bookingFee,
      discountAmount,
      passPrice,
      finalTotal,
    };
  };

  // ==================== VALIDATE PASS CODE ====================
  const validatePassCode = async () => {
    if (!existingPassCode || existingPassCode.length < 4) return;
    
    setPassCodeChecking(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/Coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: existingPassCode }),
      });
      
      const data = await response.json();
      if (response.ok && data.isValid) {
        setPassCodeValid(true);
        setPassPurchaseType(null); // Don't need to buy pass if valid code
        toast.success(data.message || 'Coupon code applied!');
      } else {
        setPassCodeValid(false);
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (error) {
      setPassCodeValid(false);
      toast.error('Could not validate coupon code');
      console.error('Coupon validation error:', error);
    } finally {
      setPassCodeChecking(false);
    }
  };

  // Fetch settings from API (pricing, pass prices, Stripe key, etc.)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/public/settings/site`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Stripe key seçimi: Test modundaysa test key, değilse live key kullan
          // Backend response: stripeTestMode (boolean), stripePublicKey (live), stripeTestPublicKey (test)
          const isTestMode = data.stripeTestMode === true;
          const stripeKey = isTestMode 
            ? (data.stripeTestPublicKey || data.stripePublicKey || '')
            : (data.stripePublicKey || '');
          
          console.log('🔧 Stripe settings loaded:', { 
            isTestMode, 
            keyPrefix: stripeKey.substring(0, 12) + '...' 
          });
          
          setSettings({
            oneTimeCouponPrice: data.oneTimeCouponPrice || 15,
            annualCouponPrice: data.annualCouponPrice || 125,
            extraFee: data.extraFee || 15,
            discountRate: data.discountRate || 15,
            profitMargin: data.profitMargin || 16,
            defaultVatRate: data.defaultVatRate || 21,
            stripePublicKey: stripeKey,
          });
          
          // Stripe will be initialized in BookingForm component for checkout
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        // Use defaults if fetch fails
      }
    };

    fetchSettings();
  }, []);

  // Fetch hotel details - PRIORITY: localStorage, FALLBACK: API
  useEffect(() => {
    const fetchHotelDetails = async () => {
      if (!hotelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 🔍 STEP 1: Try to get booking data from localStorage (set by hotel detail page)
        const storedData = localStorage.getItem('freestays_booking_data');
        if (storedData) {
          const bookingData = JSON.parse(storedData);
          console.log('✅ Loaded booking data from localStorage:', bookingData);
          
          // Validate timestamp (data should be fresh, max 30 minutes old)
          const dataAge = Date.now() - new Date(bookingData.timestamp).getTime();
          const maxAge = 30 * 60 * 1000; // 30 minutes
          
          if (dataAge < maxAge && bookingData.hotel.id == hotelId) {
            // Build hotelData from localStorage
            const mappedData: HotelDetailApiResponse = {
              hotel: {
                hotelId: bookingData.hotel.id,
                name: bookingData.hotel.name,
                description: '',
                category: bookingData.hotel.stars,
                stars: bookingData.hotel.stars,
                contact: {
                  address: bookingData.hotel.address,
                  city: bookingData.hotel.city,
                  country: bookingData.hotel.country,
                  countryCode: '',
                  phone: '',
                  email: '',
                  website: '',
                },
                location: {
                  latitude: 0,
                  longitude: 0,
                  resort: { id: 0, name: '' },
                  giataCode: '',
                },
                images: bookingData.hotel.images || [],
                pricing: {
                  minPrice: bookingData.room.price,
                  currency: bookingData.room.currency,
                  checkIn: bookingData.booking.checkIn,
                  checkOut: bookingData.booking.checkOut,
                  nights: bookingData.booking.nights,
                  adults: bookingData.booking.adults,
                  children: bookingData.booking.children,
                },
                reviews: { score: 0, count: 0, rating: '' },
                features: [],
                themes: [],
                totalRooms: 1,
              },
              rooms: [{
                roomId: bookingData.room.id,
                roomTypeId: bookingData.room.id,
                roomTypeName: bookingData.room.name,
                name: bookingData.room.name,
                description: '',
                images: [],
                mealId: 1,
                mealName: bookingData.room.boardType,
                price: {
                  total: bookingData.room.price,
                  perNight: bookingData.room.pricePerNight,
                  currency: bookingData.room.currency,
                  nights: bookingData.booking.nights,
                },
                pricing: {
                  originalPrice: bookingData.room.price,
                  currentPrice: bookingData.room.price,
                  discount: 0,
                  discountPercentage: 0,
                },
                availability: {
                  availableRooms: 1,
                  isAvailable: true,
                },
                policies: {
                  isRefundable: false,
                  isSuperDeal: false,
                  cancellationPolicies: [],
                  earliestFreeCancellation: '',
                },
                paymentMethods: [],
              }],
              availability: {
                hasAvailableRooms: true,
                totalAvailableRooms: 1,
              },
            };
            
            setHotelData(mappedData);
            setError(null);
            setLoading(false);
            console.log('💾 Using localStorage data - skipping API call');
            return; // Exit early, no API call needed
          } else {
            console.warn('⚠️ localStorage data is stale or hotel ID mismatch, fetching from API');
            localStorage.removeItem('freestays_booking_data');
          }
        }
        
        // 🌐 STEP 2: FALLBACK - Fetch from API if localStorage is empty/stale
        console.log('🌐 No valid localStorage data, fetching from API...');
        
        if (!checkIn || !checkOut) {
          setLoading(false);
          return;
        }
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const queryParams = new URLSearchParams({
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          currency: 'EUR',
          ...(destinationId && { destinationId }),
          ...(resortId && { resortId }),
        });

        const response = await fetch(`${API_URL}/Hotels/${hotelId}?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch hotel: ${response.status}`);
        }

        const result = await response.json();
        
        // Map backend response to our expected format
        const mappedData: HotelDetailApiResponse = {
          hotel: {
            hotelId: result.hotel_id || result.hotelId || parseInt(hotelId),
            name: result.name,
            description: result.description || '',
            category: result.category || 0,
            stars: result.star_rating || 0,
            contact: {
              address: result.address || '',
              city: result.city || '',
              country: result.country || '',
              countryCode: result.country_code || '',
              phone: result.phone || '',
              email: result.email || '',
              website: result.website || '',
            },
            location: {
              latitude: result.latitude || 0,
              longitude: result.longitude || 0,
              resort: { id: 0, name: '' },
              giataCode: '',
            },
            images: result.images || [],
            pricing: {
              minPrice: result.min_price || 0,
              currency: 'EUR',
              checkIn,
              checkOut,
              nights,
              adults,
              children,
            },
            reviews: {
              score: result.review_score || 0,
              count: result.review_count || 0,
              rating: '',
            },
            features: result.amenities || [],
            themes: result.themes || [],
            totalRooms: result.rooms?.length || 0,
          },
          rooms: (result.rooms || []).map((r: any) => ({
            roomId: r.room_id,
            roomTypeId: r.room_id,
            roomTypeName: r.room_type || 'Standard Room',
            mealTypeId: 1,
            mealName: r.board_type || 'Room Only',
            availableRooms: r.available_rooms || 1,
            isRefundable: r.is_refundable || false,
            isSuperDeal: r.is_super_deal || false,
            price: {
              total: r.price || 0,
              perNight: r.price_per_night || 0,
              currency: 'EUR',
            },
            pricing: {
              originalPrice: r.price || 0,
              currentPrice: r.price || 0,
              discount: 0,
              perNight: r.price_per_night || 0,
              totalNights: nights,
            },
          })),
          availability: {
            hasAvailableRooms: (result.rooms || []).length > 0,
            totalAvailableRooms: (result.rooms || []).length,
          },
        };

        setHotelData(mappedData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch hotel details:', err);
        setError(err.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, checkIn, checkOut, adults, children, currency, destinationId, resortId, nights]);

  // ==================== PREBOOK MOVED TO BookingForm ====================
  // PreBook artık form submit sırasında çağrılıyor (misafir bilgileri ile birlikte)
  // Bu sayede:
  // 1. Misafir bilgileri prebook'a dahil ediliyor
  // 2. Fiyat değişikliği kullanıcıya anında gösteriliyor
  // 3. PreBook kodu Stripe Checkout'a doğrudan gönderiliyor

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // Get selected room from hotel data
  const selectedRoom = hotelData?.rooms?.find(r => r.roomId?.toString() === roomId);
  const hotelName = hotelData?.hotel?.name || '';
  const roomName = selectedRoom?.roomTypeName || '';
  const boardType = selectedRoom?.mealName || '';
  // IMPORTANT: Price must come from API, not from querystring (security & accuracy)
  const price = selectedRoom?.price?.total || 0;
  const imageUrl = hotelData?.hotel?.images?.[0] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">{t('loadingHotelDetails')}</p>
        </Card>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-destructive mb-4">{error || t('hotelNotFound')}</p>
          <Link href={`/${locale}/search`}>
            <Button>{t('backToSearch')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <Link href={`/${locale}/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`}>
              <Button variant="ghost" size="sm" className="rounded-full mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToHotel')}
              </Button>
            </Link>
          
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
                <span className="text-sm font-medium hidden sm:inline">{t('steps.selectRoom')}</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-primary" />
              <div className="flex items-center gap-2 text-primary">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</div>
                <span className="text-sm font-medium hidden sm:inline">{t('steps.guestDetails')}</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-sm font-semibold">3</div>
                <span className="text-sm font-medium hidden sm:inline">{t('steps.payNow')}</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl font-semibold mb-2 text-center">{t('title')}</h1>
            <p className="text-muted-foreground text-center mb-6">{t('confirmationEmail')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {!hotelId || !checkIn || !checkOut ? (
            <Card className="p-8 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                {t('reservationInfoMissing')}
              </p>
              <Link href={`/${locale}/search`}>
                <Button>{t('backToSearch')}</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* GUEST INFORMATION FORM */}
                <BookingForm
                  hotelId={hotelId}
                  roomId={roomId}
                  roomTypeId={roomTypeId}
                  mealId={mealId}
                  hotelName={hotelName}
                  roomName={roomName}
                  boardType={boardType}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  adults={adults}
                  children={children}
                  totalPrice={(() => {
                    const pricing = calculatePricing(price, passCodeValid, passPurchaseType);
                    return pricing.finalTotal;
                  })()}
                  currency={currency}
                  locale={locale}
                  stripePublicKey={settings.stripePublicKey}
                  hidePaymentNote={true}
                  showSubmitButton={true}
                  passPurchaseType={passPurchaseType}
                  passCodeValid={passCodeValid}
                  pricingDetails={(() => {
                    const pricing = calculatePricing(price, passCodeValid, passPurchaseType);
                    return {
                      roomTotal: pricing.roomTotal,
                      bookingFee: pricing.bookingFee,
                      discountAmount: pricing.discountAmount,
                      passPrice: pricing.passPrice,
                      finalTotal: pricing.finalTotal,
                      profitMargin: settings.profitMargin,
                      vatRate: settings.defaultVatRate,
                      discountRate: settings.discountRate,
                    };
                  })()}
                />

                {/* Pass Code / Pass Purchase Section - above form */}
                {!passCodeValid && (
                  <Card className="p-6 mb-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-accent-foreground" />
                      {t('passTitle')}
                    </h2>

                    {/* Existing Pass Code */}
                    <div className="mb-6">
                      <Label className="mb-2 block">{t('havePassCode')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder={t('passCodePlaceholder')}
                          value={existingPassCode}
                          onChange={(e) => {
                            setExistingPassCode(e.target.value.toUpperCase());
                            setPassCodeValid(false);
                          }}
                          disabled={passPurchaseType !== null}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={validatePassCode}
                          disabled={passCodeChecking || existingPassCode.length < 4 || passPurchaseType !== null}
                        >
                          {passCodeChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                      {passCodeValid && (
                        <p className="text-sm text-primary mt-2 flex items-center gap-1">
                          <Check className="w-4 h-4" /> {t('passCodeApplied')}
                        </p>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Buy Pass Options */}
                    <div>
                      <Label className="mb-3 block">{t('buyPassNow')}</Label>
                      <RadioGroup 
                        value={passPurchaseType || ''} 
                        onValueChange={(val) => {
                          setPassPurchaseType(val as 'one_time' | 'annual' | null || null);
                          if (val) {
                            setExistingPassCode('');
                            setPassCodeValid(false);
                          }
                        }}
                        disabled={passCodeValid}
                      >
                        <div className="space-y-3">
                          <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === 'one_time' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                            <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{t('oneTimePass')}</span>
                                <span className="font-semibold">€{settings.oneTimeCouponPrice}</span>
                              </div>
                              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                  {t('oneTimeDesc1')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                  {t('oneTimeDesc2')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Gift className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-primary font-medium">{t('noBookingFee')}</span>
                                </li>
                              </ul>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === 'annual' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                            <RadioGroupItem value="annual" id="annual" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{t('annualPass')}</span>
                                  <Badge className="bg-accent text-accent-foreground text-xs">{t('bestValue')}</Badge>
                                </div>
                                <span className="font-semibold">€{settings.annualCouponPrice}</span>
                              </div>
                              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                  {t('annualDesc1')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                  {t('annualDesc2')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <Gift className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-primary font-medium">{t('noBookingFee')}</span>
                                </li>
                              </ul>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === null && !passCodeValid ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                            <RadioGroupItem value="" id="none" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{t('noPass')}</span>
                                <span className="font-semibold">€{settings.extraFee} {t('fee')}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{t('standardBooking')}</p>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </Card>
                )}
              </div>

              {/* Sticky Summary */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24 rounded-2xl shadow-xl">
                  <div className="flex gap-4 mb-4">
                    <div className="relative w-20 h-20 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                      <Image
                        src={imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}
                        alt={hotelName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold leading-tight line-clamp-2 mb-1">{hotelName}</h3>
                      <p className="text-sm text-muted-foreground">{hotelData?.hotel?.contact?.city}, {hotelData?.hotel?.contact?.country}</p>
                      {hotelData?.hotel?.stars && (
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: Math.floor(hotelData.hotel.stars) }).map((_, i) => (
                            <svg key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('roomType')}</span>
                      <span className="text-right font-medium">{roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('boardType')}</span>
                      <span className="text-right font-medium">{boardType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('checkIn')}</span>
                      <span className="font-medium text-right">{formatDate(checkIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('checkOut')}</span>
                      <span className="font-medium text-right">{formatDate(checkOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('guests')}</span>
                      <span className="font-medium">{adults} {t('adults')} {children > 0 ? `+ ${children} ${t('children')}` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('nights')}</span>
                      <span className="font-medium">{nights} {nights === 1 ? t('night') : t('nights')}</span>
                    </div>
                    {price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('pricePerNight')}</span>
                        <span className="font-medium">€{(price / nights).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-border my-4" />

                  {/* Pricing with Pass Selection */}
                  {(() => {
                    const pricing = calculatePricing(price, passCodeValid, passPurchaseType);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t('roomPrice')} ({nights} {nights === 1 ? t('night') : t('nights')})</span>
                          <span>€{pricing.roomTotal.toFixed(2)}</span>
                        </div>
                        {pricing.discountAmount > 0 && (passCodeValid || passPurchaseType) && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>✓ {t('discount')} ({settings.discountRate}%)</span>
                            <span>-€{pricing.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {pricing.bookingFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>{t('bookingFee')}</span>
                            <span>€{pricing.bookingFee.toFixed(2)}</span>
                          </div>
                        )}
                        {pricing.bookingFee === 0 && (passCodeValid || passPurchaseType) && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>✓ {t('feeWaived')}</span>
                            <span>-€{settings.extraFee.toFixed(2)}</span>
                          </div>
                        )}
                        {pricing.passPrice > 0 && (
                          <div className="flex justify-between text-sm font-medium">
                            <span>
                              {passPurchaseType === 'one_time' ? t('oneTimePass') : t('annualPass')}
                            </span>
                            <span>€{pricing.passPrice.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="h-px bg-border" />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>{t('total')}</span>
                          <span>€{pricing.finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4 bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-primary">
                      {t('savingsHint')}
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4 rounded-full cursor-pointer"
                    onClick={() => {
                      // Clear localStorage to force fresh data fetch
                      localStorage.removeItem('freestays_booking_data');
                      // Navigate to hotel page with all params
                      const params = new URLSearchParams({
                        checkIn,
                        checkOut,
                        adults: adults.toString(),
                        children: children.toString(),
                        ...(destinationId && { destinationId }),
                        ...(resortId && { resortId }),
                      });
                      window.location.href = `/${locale}/hotel/${hotelId}?${params.toString()}`;
                    }}
                  >
                    {t('changeBooking')}
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* PayNow Button removed in favor of BookingForm's submit */}
        </div>
      </div>

      {/* Footer Trust Badges */}
      <div className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <p className="font-semibold text-sm">{t('trustBadges.securePayment')}</p>
                <p className="text-xs text-muted-foreground">{t('trustBadges.sslCertified')}</p>
              </div>
              <div>
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-sm">{t('trustBadges.instantConfirmation')}</p>
                <p className="text-xs text-muted-foreground">{t('trustBadges.emailConfirmation')}</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📞</div>
                <p className="font-semibold text-sm">{t('trustBadges.support247')}</p>
                <p className="text-xs text-muted-foreground">{t('trustBadges.customerService')}</p>
              </div>
              <div>
                <div className="text-3xl mb-2">💳</div>
                <p className="font-semibold text-sm">{t('trustBadges.flexiblePayment')}</p>
                <p className="text-xs text-muted-foreground">{t('trustBadges.installmentOptions')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <Card className="p-8">
            <Skeleton className="h-40 w-96" />
          </Card>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
