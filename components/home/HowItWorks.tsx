'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Search, Calendar, CreditCard, CheckCircle } from 'lucide-react';

interface HowItWorksProps {
  title?: string;
  subtitle?: string;
}

export function HowItWorks({ title, subtitle }: HowItWorksProps) {
  const t = useTranslations('home.howItWorks');

  const steps = [
    {
      icon: Search,
      title: t('step1.title'),
      description: t('step1.description'),
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Calendar,
      title: t('step2.title'),
      description: t('step2.description'),
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: CreditCard,
      title: t('step3.title'),
      description: t('step3.description'),
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: CheckCircle,
      title: t('step4.title'),
      description: t('step4.description'),
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title || t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle || t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="relative p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-4 mx-auto mt-2`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
