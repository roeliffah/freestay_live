'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

function BookingContent() {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;

  const hotelId = searchParams.get('hotelId') || '';
  const hotelName = searchParams.get('hotelName') || 'Otel';
  const roomName = searchParams.get('roomName') || 'Oda';
  const boardType = searchParams.get('boardType') || 'Room Only';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const price = parseFloat(searchParams.get('price') || '0');
  const currency = searchParams.get('currency') || 'EUR';

  const guests = adults + children;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/${locale}/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToHotel')}
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mt-2">{t('title')}</h1>
              <p className="text-muted-foreground mt-1">
                {t('completeYourReservation')}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-green-600">
              <ShieldCheck className="h-6 w-6" />
              <div>
                <p className="font-semibold">{t('secureReservationBadge')}</p>
                <p className="text-xs text-muted-foreground">{t('sslEncrypted')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <BookingForm
              hotelId={hotelId}
              hotelName={hotelName}
              roomName={roomName}
              boardType={boardType}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              totalPrice={price}
              currency={currency}
              locale={locale}
            />
          )}
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
