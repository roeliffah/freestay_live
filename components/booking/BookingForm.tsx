'use client';

import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Shield,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import type { BookingRequest, Guest, ChildGuest } from '@/lib/api/booking';

interface GuestInfo extends Guest {
  id: string;
}

interface ChildGuestInfo extends ChildGuest {
  id: string;
}

interface BookingFormProps {
  hotelId: string;
  roomId: string;
  roomTypeId?: string;
  mealId: number;
  hotelName: string;
  roomName: string;
  boardType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalPrice: number;
  currency: string;
  locale: string;
  stripePublicKey?: string;
  onSubmit?: (bookingData: BookingRequest) => void;
  hidePaymentNote?: boolean;
  showSubmitButton?: boolean;
  passPurchaseType?: 'one_time' | 'annual' | null;
  passCodeValid?: boolean;
  pricingDetails?: {
    roomTotal: number;
    bookingFee: number;
    discountAmount: number;
    passPrice: number;
    finalTotal: number;
    profitMargin: number;
    vatRate: number;
    discountRate: number;
  };
}

// Inner form component
function BookingFormInner({
  hotelId,
  roomId,
  roomTypeId,
  mealId,
  hotelName,
  roomName,
  boardType,
  checkIn,
  checkOut,
  adults,
  children,
  totalPrice,
  currency,
  locale = 'en',
  stripePublicKey,
  onSubmit,
  hidePaymentNote = false,
  showSubmitButton = true,
  passPurchaseType,
  passCodeValid,
  pricingDetails,
}: BookingFormProps) {
  const t = useTranslations('booking');
  const currentLocale = useLocale();
  const router = useRouter();
  
  // Initialize guest arrays
  const [adultGuests, setAdultGuests] = useState<GuestInfo[]>(
    Array.from({ length: adults }, (_, i) => ({
      id: `adult-${i}`,
      firstName: '',
      lastName: '',
    }))
  );

  const [childGuests, setChildGuests] = useState<ChildGuestInfo[]>(
    Array.from({ length: children }, (_, i) => ({
      id: `child-${i}`,
      firstName: '',
      lastName: '',
      age: 0,
    }))
  );

  // Ensure guest arrays match adults/children counts
  useEffect(() => {
    setAdultGuests(prev => {
      const arr = [...prev];
      if (arr.length < adults) {
        for (let i = arr.length; i < adults; i++) {
          arr.push({ id: `adult-${i}`, firstName: '', lastName: '' });
        }
      } else if (arr.length > adults) {
        arr.length = adults;
      }
      return arr;
    });

    setChildGuests(prev => {
      const arr = [...prev];
      if (arr.length < children) {
        for (let i = arr.length; i < children; i++) {
          arr.push({ id: `child-${i}`, firstName: '', lastName: '', age: 0 });
        }
      } else if (arr.length > children) {
        arr.length = children;
      }
      return arr;
    });
  }, [adults, children]);

  // First guest info (used as billing)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdultGuestChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
    setAdultGuests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleChildGuestChange = (index: number, field: 'firstName' | 'lastName' | 'age', value: string | number) => {
    setChildGuests(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        [field]: field === 'age' ? parseInt(value.toString()) || 0 : value 
      };
      return updated;
    });
  };

  const isFormValid = useMemo(() => {
    // First adult guest is required (billing info)
    if (!adultGuests[0]?.firstName || !adultGuests[0]?.lastName) {
      console.log('❌ Validation: Missing first adult guest name');
      return false;
    }
    
    // Email and phone required
    if (!email || !phone) {
      console.log('❌ Validation: Missing email or phone');
      return false;
    }

    // All other guests need first and last name
    for (let i = 1; i < adultGuests.length; i++) {
      if (!adultGuests[i]?.firstName || !adultGuests[i]?.lastName) {
        console.log(`❌ Validation: Missing adult guest ${i + 1} name`);
        return false;
      }
    }

    // All children need first name, last name, and age
    for (const child of childGuests) {
      if (!child.firstName || !child.lastName || child.age < 1 || child.age > 17) {
        console.log('❌ Validation: Invalid child guest data');
        return false;
      }
    }

    console.log('✅ Validation: Form is valid');
    return true;
  }, [adultGuests, childGuests, email, phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      alert(t('fillRequiredFields') || 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get API URL from environment
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5240/api/v1';

      // Get auth token
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('admin_token') || localStorage.getItem('token')
        : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // ==================== STEP 1: PREBOOK ====================
      // PreBook ile fiyatı kilitle ve vergi bilgilerini al
      // Bu adım SunHotels API'den güncel fiyatı alır ve 30 dakika kilitler
      console.log('🔐 Step 1: Creating PreBook...');
      
      const preBookPayload = {
        hotelId: parseInt(hotelId),
        roomId: parseInt(roomId),
        roomTypeId: parseInt(roomTypeId || roomId),
        mealId: mealId || 1,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        rooms: 1,
        adults,
        children,
        childrenAges: childGuests.map(c => c.age).join(',') || '',
        guestName: `${adultGuests[0].firstName} ${adultGuests[0].lastName}`,
        guestEmail: email,
        guestPhone: phone,
        searchPrice: totalPrice,
        isSuperDeal: false,
        specialRequests: specialRequests || '',
        currency: currency || 'EUR',
        language: currentLocale || 'en',
        customerCountry: 'TR', // TODO: Detect from user location
      };

      console.log('📤 PreBook request:', preBookPayload);

      const preBookResponse = await fetch(`${API_URL}/bookings/hotels/prebook`, {
        method: 'POST',
        headers,
        body: JSON.stringify(preBookPayload),
      });

      const preBookText = await preBookResponse.text();
      console.log('📥 PreBook response:', preBookResponse.status, preBookText);

      if (!preBookResponse.ok) {
        let errorMessage = `PreBook failed: ${preBookResponse.status}`;
        try {
          const errorData = JSON.parse(preBookText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Fiyat değişikliği kontrolü
          if (errorData.priceChanged) {
            const priceChangeMsg = `Fiyat değişti! Eski: €${totalPrice.toFixed(2)}, Yeni: €${(errorData.totalPrice || 0).toFixed(2)}. Lütfen sayfayı yenileyip tekrar deneyin.`;
            alert(priceChangeMsg);
            window.location.reload();
            return;
          }
        } catch {
          console.error('Failed to parse prebook error:', preBookText);
        }
        throw new Error(errorMessage);
      }

      const preBookData = JSON.parse(preBookText);
      console.log('✅ PreBook successful:', preBookData);

      // Fiyat değişikliği uyarısı
      if (preBookData.priceChanged && preBookData.totalPrice !== totalPrice) {
        const confirmPriceChange = confirm(
          `Dikkat: Fiyat değişti!\n\nEski fiyat: €${totalPrice.toFixed(2)}\nYeni fiyat: €${preBookData.totalPrice.toFixed(2)}\n\nDevam etmek istiyor musunuz?`
        );
        if (!confirmPriceChange) {
          setIsSubmitting(false);
          window.location.reload();
          return;
        }
      }

      // ==================== STEP 2: CHECKOUT SESSION ====================
      // PreBook kodu ile Stripe Checkout Session oluştur
      console.log('💳 Step 2: Creating Stripe Checkout Session...');

      const checkoutPayload = {
        hotelId: parseInt(hotelId),
        roomId: parseInt(roomId),
        roomTypeId: parseInt(roomTypeId || roomId),
        mealId: mealId || 1,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        rooms: 1,
        adults,
        children,
        childrenAges: childGuests.map(c => c.age).join(',') || '',
        guestName: `${adultGuests[0].firstName} ${adultGuests[0].lastName}`,
        guestEmail: email,
        phone,
        specialRequests: specialRequests || '',
        searchPrice: preBookData.totalPrice || totalPrice, // PreBook'tan gelen fiyatı kullan
        currency: currency || 'EUR',
        isSuperDeal: false,
        customerCountry: 'TR',
        language: currentLocale || 'en',
        // ✅ CRITICAL: PreBook kodunu gönder - bu olmadan rezervasyon yapılamaz
        preBookCode: preBookData.preBookCode,
        // Stripe Checkout URLs
        successUrl: `${window.location.origin}/${currentLocale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/${currentLocale}/booking/cancel`,
        // Pass/Kupon bilgileri
        ...(passPurchaseType && { passPurchaseType }),
        ...(passCodeValid && { passCodeValid }),
      };

      console.log('📤 Checkout request:', checkoutPayload);

      const response = await fetch(`${API_URL}/bookings/hotels/checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutPayload),
      });

      console.log('💳 Checkout response status:', response.status);

      const responseText = await response.text();
      console.log('💳 Checkout response:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${responseText || 'No response body'}`;
        
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            console.error('API error:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          console.error('Failed to parse error response');
        }
        
        throw new Error(errorMessage);
      }

      if (!responseText) {
        throw new Error('Empty response from payment API');
      }

      const data = JSON.parse(responseText);
      const { sessionId, bookingId } = data;
      
      if (!sessionId) {
        console.error('Response data:', data);
        throw new Error('No sessionId in response: ' + JSON.stringify(data));
      }

      console.log('✅ Checkout session created:', { sessionId, bookingId, preBookCode: preBookData.preBookCode });

      // ==================== STEP 3: STRIPE REDIRECT ====================
      // Kullanıcıyı Stripe ödeme sayfasına yönlendir
      console.log('🔄 Step 3: Redirecting to Stripe Checkout...');
      
      // Stripe public key: prop'tan veya env variable'dan al
      const stripeKey = stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      
      if (!stripeKey) {
        throw new Error('Stripe public key is not configured. Please contact support.');
      }
      
      console.log('🔑 Loading Stripe with key:', stripeKey.substring(0, 20) + '...');
      const stripe = await loadStripe(stripeKey);

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        console.error('❌ Stripe redirect error:', result.error);
        throw new Error(result.error.message || 'Payment redirect failed');
      }
      
      // ==================== STEP 4 (Backend): WEBHOOK ====================
      // Ödeme başarılı olduğunda Stripe webhook tetiklenir
      // Backend: /api/v1/webhooks/stripe endpoint'i
      // → payment_intent.succeeded event'i alır
      // → /api/v1/bookings/hotels/confirm çağırır (BookV3 ile SunHotels'e kayıt)
      // → Email gönderir
      // → Kupon oluşturur (eğer pass satın alındıysa)
      
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      alert(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Adult Guests */}
      <Card className="p-6 rounded-2xl border-0 shadow-lg">
        <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          {t('guestDetails')}
        </h2>
        
        {/* Adult Guests */}
        <div className="space-y-6 mb-6">
          {adultGuests.map((guest, index) => (
            <div key={guest.id} className={index > 0 ? 'pb-6 border-b last:border-0' : ''}>
              <h3 className="text-sm font-semibold mb-4 text-primary">
                {t('adultGuest')} {index + 1} {index === 0 ? '('+t('billingInfo')+')' : ''}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('firstName')} *</Label>
                  <Input 
                    value={guest.firstName}
                    onChange={(e) => handleAdultGuestChange(index, 'firstName', e.target.value)}
                    placeholder={t('firstNamePlaceholder')}
                    required
                    className="h-10 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label>{t('lastName')} *</Label>
                  <Input 
                    value={guest.lastName}
                    onChange={(e) => handleAdultGuestChange(index, 'lastName', e.target.value)}
                    placeholder={t('lastNamePlaceholder')}
                    required
                    className="h-10 rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Child Guests */}
        {childGuests.length > 0 && (
          <div className="space-y-6 border-t pt-6">
            <h3 className="text-base font-semibold text-primary">
              {t('childGuest')} ({childGuests.length})
            </h3>
            {childGuests.map((guest, index) => (
              <div key={guest.id} className={index < childGuests.length - 1 ? 'pb-6 border-b' : ''}>
                <h4 className="text-sm font-semibold mb-4">{t('childGuest')} {index + 1}</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('firstName')} *</Label>
                    <Input 
                      value={guest.firstName}
                      onChange={(e) => handleChildGuestChange(index, 'firstName', e.target.value)}
                      placeholder={t('firstNamePlaceholder')}
                      required
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('lastName')} *</Label>
                    <Input 
                      value={guest.lastName}
                      onChange={(e) => handleChildGuestChange(index, 'lastName', e.target.value)}
                      placeholder={t('lastNamePlaceholder')}
                      required
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('childAge')} *</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="17"
                      value={guest.age}
                      onChange={(e) => handleChildGuestChange(index, 'age', e.target.value)}
                      placeholder={t('childAgePlaceholder')}
                      required
                      className="h-10 rounded-lg mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-4">{t('contactInformation')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('email')} *</Label>
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="h-10 rounded-lg mt-1"
              />
            </div>
            <div>
              <Label>{t('phone')} *</Label>
              <Input 
                type="tel"
                value={phone}
                onChange={(e) => {
                  // Allow only digits and common phone chars: + - () space
                  const cleaned = e.target.value.replace(/[^\d+\-() ]/g, '');
                  setPhone(cleaned);
                }}
                placeholder={t('phonePlaceholder')}
                required
                className="h-10 rounded-lg mt-1"
              />
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div className="mt-6 pt-6 border-t">
          <Label>{t('specialRequests')} ({t('optional')})</Label>
          <Textarea 
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder={t('specialRequestsPlaceholder')}
            className="mt-2 min-h-[80px] rounded-lg"
          />
        </div>
      </Card>

      {!hidePaymentNote && (
        <Card className="p-4 rounded-lg border-0 bg-blue-50">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">{t('securePayment')}</p>
              <p className="text-xs text-blue-700 mt-1">{t('paymentNote')}</p>
            </div>
          </div>
        </Card>
      )}

      {showSubmitButton && (
        <Button 
          type="submit" 
          size="lg" 
          className="w-full rounded-full h-12 text-base font-semibold shadow-lg"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <CreditCard className="w-5 h-5 mr-2" />
          )}
          {isSubmitting ? t('processing') : `${t('payNow')} €${totalPrice.toFixed(2)}`}
        </Button>
      )}
    </form>
  );
}

// Export the form directly (no Elements wrapper needed for Checkout)
export function BookingForm(props: BookingFormProps) {
  return <BookingFormInner {...props} />;
}
