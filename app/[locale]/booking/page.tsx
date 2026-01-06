'use client';

import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BookingForm } from '@/components/booking/BookingForm';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const imageUrl = searchParams.get('image') || '';

  const guests = adults + children;
  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

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
          {/* Steps */}
          <div className="mt-6 flex items-center justify-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center">1</div>
              <span className="hidden sm:inline text-primary">{t('steps.selectRoom')}</span>
            </div>
            <div className="w-10 sm:w-16 h-0.5 bg-primary/50" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-primary/30">2</div>
              <span className="hidden sm:inline text-primary">{t('steps.guestDetails')}</span>
            </div>
            <div className="w-10 sm:w-16 h-0.5 bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">3</div>
              <span className="hidden sm:inline">{t('steps.payNow')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
              <div className="lg:col-span-2">
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
                  showSummary={false}
                />
              </div>

              {/* Sticky Summary */}
              <div className="lg:col-span-1">
                <Card className="p-5 sticky top-24 shadow-lg">
                  <div className="flex gap-3 mb-4">
                    <div className="relative w-24 h-24 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}
                        alt={hotelName}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">{t('hotel')}</p>
                      <p className="font-semibold leading-tight line-clamp-2">{hotelName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{roomName}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('roomType')}</span>
                      <span className="font-medium text-right">{roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('boardType')}</span>
                      <span className="font-medium text-right">{boardType}</span>
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
                      <span className="font-medium text-right">{guests}</span>
                    </div>
                  </div>

                  <div className="my-4 border-t" />

                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('roomType')} ({nights} {t('nights')})</span>
                    <span className="font-semibold">{price.toFixed(2)} {currency}</span>
                  </div>

                  <div className="flex items-center gap-2 text-emerald-600 text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('secureReservationBadge')}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-muted-foreground text-xs">{t('total', { default: 'Total' })}</p>
                      <p className="text-2xl font-bold text-primary">{price.toFixed(2)} {currency}</p>
                    </div>
                    <Button size="sm" className="rounded-full" disabled>
                      {t('steps.payNow')}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
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
