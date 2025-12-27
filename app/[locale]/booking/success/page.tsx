'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, ArrowRight } from 'lucide-react';
import { bookingsAPI } from '@/lib/api/client';

function SuccessContent() {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingsAPI.getDetail(bookingId!) as any;
      setBooking(response.data);
    } catch (error) {
      console.error('Rezervasyon detayları yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId) {
    router.push(`/${locale}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container max-w-2xl">
        <Card className="p-8">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('success.title')}</h1>
            <p className="text-muted-foreground">{t('success.subtitle')}</p>
          </div>

          {/* Booking Info */}
          {!loading && booking && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('success.bookingNumber')}</p>
                <p className="text-2xl font-mono font-bold">{booking.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('success.confirmationEmail')}</p>
                  <p className="font-medium">{booking.guestEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('success.totalAmount')}</p>
                  <p className="font-medium text-xl">€{booking.totalPrice?.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">{t('success.nextSteps')}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <Mail className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t('success.emailSent')}</span>
                  </li>
                  <li className="flex items-start">
                    <Download className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t('success.downloadVoucher')}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Button className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              {t('success.downloadConfirmation')}
            </Button>
            
            <Link href={`/${locale}`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                {t('success.backToHome')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>{t('success.needHelp')}</p>
            <p className="font-medium text-foreground mt-1">support@freestays.com</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
