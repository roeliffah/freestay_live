'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function BookingCancelPage() {
  const t = useTranslations('booking');
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl font-semibold text-center mb-2">
              {t('bookingCancelled') || 'Booking Cancelled'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center border-0 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-200 rounded-full blur-xl opacity-30"></div>
                <XCircle className="w-20 h-20 text-red-600 relative" />
              </div>
            </div>

            <h2 className="text-3xl font-semibold mb-2 text-red-700">
              {t('paymentCancelled') || 'Payment Cancelled'}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t('paymentCancelledDesc') || 'You cancelled the payment. Your booking was not confirmed.'}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                {t('youCanTryAgain') || 'You can try booking again whenever you are ready. Your reservation details have been saved.'}
              </p>
            </div>

            <div className="space-y-3">
              <Link href={`/${locale}/booking`} className="block">
                <Button size="lg" className="w-full rounded-full">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t('returnToBooking') || 'Return to Booking'}
                </Button>
              </Link>
              <Link href={`/${locale}/search`} className="block">
                <Button size="lg" variant="outline" className="w-full rounded-full">
                  {t('newSearch') || 'New Search'}
                </Button>
              </Link>
              <Link href={`/${locale}`} className="block">
                <Button size="lg" variant="ghost" className="w-full rounded-full">
                  {t('backToHome') || 'Back to Home'}
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-6">
              <p>{t('needHelp') || 'Need help?'}</p>
              <p className="font-medium text-foreground mt-1">support@freestays.com</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
