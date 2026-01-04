'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface PriceComparisonProps {
  title?: string;
  subtitle?: string;
}

export function PriceComparison({ title, subtitle }: PriceComparisonProps) {
  const t = useTranslations('home.priceComparison');

  const features = [
    { name: t('features.roomCost'), freestays: true, booking: false },
    { name: t('features.meals'), freestays: true, booking: false },
    { name: t('features.commission'), freestays: false, booking: true },
    { name: t('features.bestPrice'), freestays: true, booking: false },
    { name: t('features.support'), freestays: true, booking: true },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title || t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle || t('subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-3 bg-muted p-4 font-bold text-center">
              <div className="text-left">{t('feature')}</div>
              <div className="text-primary">FreeStays</div>
              <div className="text-muted-foreground">Booking.com</div>
            </div>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 p-4 items-center ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                }`}
              >
                <div className="font-medium">{feature.name}</div>
                <div className="flex justify-center">
                  {feature.freestays ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {feature.booking ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>

          <div className="mt-8 text-center">
            <Card className="inline-block p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">30%</div>
                <div className="text-left">
                  <div className="font-bold text-lg">{t('savings')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('savingsDesc')}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
