'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export function CTASection({ title, subtitle, buttonText }: CTASectionProps) {
  const t = useTranslations('home.cta');
  const locale = useLocale();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto overflow-hidden border-2 border-primary/20">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <div className="absolute bottom-10 right-10">
                <Star className="h-20 w-20 text-primary" />
              </div>
              <div className="absolute top-1/2 left-1/3">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="relative p-12 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold text-sm">{t('badge')}</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {title || t('title')}
              </h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {subtitle || t('subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl">
                  <Link href={`/${locale}/search`}>
                    {buttonText || t('button')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                  <Link href={`/${locale}/about`}>
                    {t('learnMore')}
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('feature1')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('feature2')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('feature3')}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
