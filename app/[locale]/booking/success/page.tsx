'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle, Home } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to get default search params for new search
const getDefaultSearchUrl = (locale: string) => {
  // Amsterdam - Netherlands (destination id: 122)
  const defaultDestination = {
    id: '122',
    name: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL'
  };
  
  // Calculate next week dates
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 7);
  const checkOut = new Date(today);
  checkOut.setDate(today.getDate() + 14);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  const params = new URLSearchParams({
    destinationId: defaultDestination.id,
    destination: defaultDestination.name,
    country: defaultDestination.countryCode,
    checkInDate: formatDate(checkIn),
    checkOutDate: formatDate(checkOut),
    adults: '2',
    children: '0',
    rooms: '1'
  });
  
  return `/${locale}/search?${params.toString()}`;
};

interface PaymentStatus {
  status: 'succeeded' | 'failed' | 'pending' | 'expired';
  bookingId?: string;
  bookingNumber?: string;
  hotelBookingCode?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  guestName?: string;
  guestEmail?: string;
  message: string;
  amount?: number;
  currency?: string;
  bookingStatus?: string;
  // New fields for confirmation errors
  isCompleted?: boolean;
  hasConfirmationError?: boolean;
  confirmationError?: string;
}

function BookingSuccessContent() {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  // Stripe returns session_id (with underscore) in the URL
  const sessionId = searchParams.get('session_id') || searchParams.get('sessionId');
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No payment session found');
        setLoading(false);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5240/api/v1';

        console.log('🔍 Verifying payment for session:', sessionId);
        console.log('📡 API URL:', `${API_URL}/Payments/${sessionId}/status`);

        // Check payment status
        const response = await fetch(`${API_URL}/Payments/${sessionId}/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('📥 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`Failed to verify payment status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('📦 Payment status data:', data);
        
        // Backend returns status: "complete" and paymentStatus: "paid" or isPaid: true/isCompleted: true
        // Check for success using multiple conditions to handle different response formats
        const isPaymentSuccessful = 
          data.status === 'succeeded' || 
          data.status === 'complete' || 
          data.paymentStatus === 'paid' ||
          (data.isPaid === true && data.isCompleted === true);
        
        const isPaymentFailed = 
          data.status === 'failed' || 
          data.paymentStatus === 'failed' ||
          data.paymentStatus === 'unpaid';
        
        const isPaymentExpired = 
          data.status === 'expired';
        
        if (isPaymentSuccessful) {
          // Payment successful - backend already processed the booking via webhook
          // We now display the actual booking information from the response
          
          setPaymentStatus({
            status: 'succeeded',
            bookingId: data.bookingId || sessionId,
            bookingNumber: data.bookingNumber,
            hotelBookingCode: data.hotelBookingCode,
            hotelName: data.hotelName,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            message: data.message || 'Payment successful! Your booking is confirmed.',
            amount: data.totalPrice,
            currency: data.currency || 'EUR',
            bookingStatus: data.bookingStatus,
            isCompleted: data.isCompleted,
            hasConfirmationError: data.hasConfirmationError,
            confirmationError: data.confirmationError,
          });

          toast.success('Payment confirmed! Your booking is being processed.');
        } else if (isPaymentFailed) {
          setPaymentStatus({
            status: 'failed',
            message: data.message || 'Payment failed. Please try again.',
          });
          toast.error('Payment failed');
        } else if (isPaymentExpired) {
          setPaymentStatus({
            status: 'expired',
            message: 'Payment session expired. Please start a new booking.',
          });
          toast.error('Session expired');
        } else {
          // Only show pending if none of the success conditions are met
          setPaymentStatus({
            status: 'pending',
            message: data.message || 'Payment is being processed. Please check back later.',
          });
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.message || 'Failed to verify payment');
        toast.error('Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">{t('verifyingPayment') || 'Verifying payment...'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('pleaseWait') || 'Please wait while we process your booking.'}
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">{t('error') || 'Error'}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-2">
            <Button 
              className="w-full"
              onClick={() => window.history.back()}
            >
              {t('goBack') || 'Go Back'}
            </Button>
            <Link href={getDefaultSearchUrl(locale)} className="block">
              <Button variant="outline" className="w-full">
                {t('newSearch') || 'New Search'}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-semibold text-center mb-2">
              {t('bookingConfirmation') || 'Booking Confirmation'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {paymentStatus?.status === 'succeeded' ? (
            <>
              {/* Success State - with potential confirmation warning */}
              <Card className="p-8 text-center mb-8 border-0 shadow-lg">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className={`absolute inset-0 ${paymentStatus.hasConfirmationError ? 'bg-amber-200' : 'bg-green-200'} rounded-full blur-xl opacity-30`}></div>
                    {paymentStatus.hasConfirmationError ? (
                      <AlertCircle className="w-20 h-20 text-amber-600 relative" />
                    ) : (
                      <CheckCircle2 className="w-20 h-20 text-green-600 relative" />
                    )}
                  </div>
                </div>

                <h2 className={`text-3xl font-semibold mb-2 ${paymentStatus.hasConfirmationError ? 'text-amber-700' : 'text-green-700'}`}>
                  {paymentStatus.hasConfirmationError 
                    ? (t('paymentReceivedWithIssue') || 'Payment Received')
                    : (t('paymentSuccessful') || 'Payment Successful!')}
                </h2>
                
                {/* Confirmation Error Warning */}
                {paymentStatus.hasConfirmationError && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800 mb-1">
                          {t('confirmationPending') || 'Reservation Confirmation Pending'}
                        </p>
                        <p className="text-sm text-amber-700">
                          {paymentStatus.confirmationError || t('confirmationErrorDefault') || 'Your payment has been received. Our team will contact you shortly to confirm your reservation.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-muted-foreground text-lg mb-6">
                  {paymentStatus.hasConfirmationError 
                    ? (t('paymentReceivedMessage') || 'Your payment has been successfully processed.')
                    : paymentStatus.message}
                </p>

                {paymentStatus.bookingId && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('confirmationNumber') || 'Confirmation Number'}
                    </p>
                    <p className="font-mono text-xl font-semibold break-all">
                      {paymentStatus.hotelBookingCode || paymentStatus.bookingNumber || paymentStatus.bookingId}
                    </p>
                  </div>
                )}

                {/* Hotel & Booking Details */}
                {paymentStatus.hotelName && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('hotelName') || 'Hotel'}
                      </p>
                      <p className="font-semibold">{paymentStatus.hotelName}</p>
                    </div>
                    
                    {paymentStatus.checkIn && paymentStatus.checkOut && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {t('checkIn') || 'Check-in'}
                          </p>
                          <p className="font-medium">
                            {new Date(paymentStatus.checkIn).toLocaleDateString(locale, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {t('checkOut') || 'Check-out'}
                          </p>
                          <p className="font-medium">
                            {new Date(paymentStatus.checkOut).toLocaleDateString(locale, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentStatus.guestName && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {t('guestName') || 'Guest Name'}
                        </p>
                        <p className="font-medium">{paymentStatus.guestName}</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentStatus.amount && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('amount') || 'Amount Paid'}
                    </p>
                    <p className="text-2xl font-semibold">
                      {paymentStatus.currency === 'EUR' ? '€' : paymentStatus.currency}
                      {paymentStatus.amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    {t('confirmationEmailSent') || 'A confirmation email has been sent to your email address with all booking details.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* View Voucher Button */}
                  {paymentStatus.bookingNumber && (
                    <Link href={`/${locale}/booking/voucher/${paymentStatus.bookingNumber}`} className="block">
                      <Button size="lg" className="w-full rounded-full" variant="default">
                        {t('viewVoucher') || 'View Voucher'}
                      </Button>
                    </Link>
                  )}
                  <Link href={`/${locale}`} className="block">
                    <Button size="lg" variant={paymentStatus.bookingNumber ? 'outline' : 'default'} className="w-full rounded-full">
                      <Home className="w-5 h-5 mr-2" />
                      {t('backToHome') || 'Back to Home'}
                    </Button>
                  </Link>
                  <Link href={getDefaultSearchUrl(locale)} className="block">
                    <Button size="lg" variant="outline" className="w-full rounded-full">
                      {t('makeNewReservation') || 'Make Another Reservation'}
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Next Steps Card */}
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">{t('whatNext') || "What's Next?"}</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">{t('checkEmail') || 'Check Your Email'}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('checkEmailDesc') || 'Confirmation details and booking information will be sent to your email.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">{t('contactHotel') || 'Hotel Contact'}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('contactHotelDesc') || 'The hotel will contact you with any additional information needed.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">{t('enjoyStay') || 'Enjoy Your Stay'}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('enjoyStayDesc') || 'Arrive at the scheduled time and enjoy your vacation!'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : paymentStatus?.status === 'failed' ? (
            <Card className="p-8 text-center border-0 shadow-lg">
              <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
              <h2 className="text-3xl font-semibold mb-2 text-destructive">
                {t('paymentFailed') || 'Payment Failed'}
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                {paymentStatus.message}
              </p>
              <div className="space-y-3">
                <Button 
                  size="lg"
                  className="w-full rounded-full"
                  onClick={() => window.history.back()}
                >
                  {t('tryAgain') || 'Try Again'}
                </Button>
                <Link href={getDefaultSearchUrl(locale)} className="block">
                  <Button size="lg" variant="outline" className="w-full rounded-full">
                    {t('newSearch') || 'New Search'}
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-0 shadow-lg">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                {t('processingPayment') || 'Payment Processing'}
              </h2>
              <p className="text-muted-foreground">
                {paymentStatus?.message || t('pleaseWait') || 'Please check back later for status updates.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BookingSuccessContent />
    </Suspense>
  );
}
