'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Gift, 
  Check, 
  ArrowRight,
  Building2,
  Users,
  Heart,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function HowItWorksPage() {
  const t = useTranslations('howItWorks');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
              <Sparkles className="w-4 h-4 mr-1" /> {t('badge')}
            </Badge>
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">
              {t('title')}
            </h1>
            <div className="text-muted-foreground text-lg md:text-xl max-w-4xl mx-auto space-y-4">
              <p>{t('description1')}</p>
              <p>{t('description2')}</p>
              <p className="text-primary font-medium">{t('description3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{t('step1.title')}</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>{t('step1.desc1')}</p>
                  <p>{t('step1.desc2')}</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">2</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{t('step2.title')}</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>{t('step2.desc1')}</p>
                  <p>{t('step2.desc2')}</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">3</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{t('step3.title')}</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>{t('step3.desc1')}</p>
                  <p>{t('step3.desc2')}</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-accent to-blue-400 rounded-3xl p-8 shadow-xl h-full hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg">
                  <Gift className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3 text-white">{t('step4.title')}</h3>
                <div className="text-white/90 text-sm space-y-3">
                  <p>{t('step4.desc1')}</p>
                  <p className="text-lg">💙 {t('step4.desc2')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why FreeStays Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
              {t('whyTitle')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t('whyDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="p-8 rounded-3xl bg-card border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-3">{t('feature1.title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('feature1.description')}
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 rounded-3xl bg-card border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-3">{t('feature2.title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('feature2.description')}
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 rounded-3xl bg-card border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-3">{t('feature3.title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('feature3.description')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Comparison */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
              {t('comparisonTitle')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('comparisonDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional Platforms */}
            <Card className="p-8 rounded-3xl bg-muted/50 border-2 border-border/50">
              <h3 className="font-serif text-2xl font-semibold mb-6 text-center">
                {t('traditional.title')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 dark:text-red-400 text-xs">✗</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('traditional.point1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 dark:text-red-400 text-xs">✗</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('traditional.point2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 dark:text-red-400 text-xs">✗</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('traditional.point3')}</p>
                </div>
              </div>
            </Card>

            {/* FreeStays */}
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-6">
                <h3 className="font-serif text-2xl font-semibold text-center">FreeStays</h3>
                <Star className="w-6 h-6 text-primary fill-primary" />
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{t('freestays.point1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{t('freestays.point2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{t('freestays.point3')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* This Is Not A Deal - CTA Section */}
      <section className="py-12 md:py-16 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border border-border/50 text-center">
            <h2 className="font-serif text-2xl md:text-4xl font-bold mb-4">{t('ctaSection.title')}</h2>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-8">{t('ctaSection.subtitle')}</p>
            
            <p className="text-muted-foreground mb-6">{t('ctaSection.forWho')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="text-2xl mb-2">⚡</div>
                <p className="font-medium text-sm">{t('ctaSection.persona1')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="text-2xl mb-2">💚</div>
                <p className="font-medium text-sm">{t('ctaSection.persona2')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="text-2xl mb-2">✈️</div>
                <p className="font-medium text-sm">{t('ctaSection.persona3')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="text-2xl mb-2">⭐</div>
                <p className="font-medium text-sm">{t('ctaSection.persona4')}</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">{t('ctaSection.statement')}</p>
            
            <div className="space-y-3">
              <p className="text-lg font-semibold">{t('ctaSection.question')}</p>
              <p className="text-primary text-xl font-bold">{t('ctaSection.action')}</p>
              <p className="text-3xl font-serif font-bold text-primary mt-6">{t('ctaSection.welcome')}</p>
            </div>

            <div className="mt-10">
              <Link href={`/${locale}`}>
                <Button size="lg" className="rounded-full px-10 text-lg h-14">
                  {t('ctaSection.createAccountButton')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Original CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-white/90 text-lg md:text-xl mb-10">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}`}>
              <Button 
                size="lg" 
                variant="secondary"
                className="rounded-full px-8 font-semibold text-lg"
              >
                {t('cta.searchButton')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href={`/${locale}/about`}>
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full px-8 font-semibold text-lg bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                {t('cta.learnMoreButton')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
