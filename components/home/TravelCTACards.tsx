'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Car, Plane } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface AffiliateService {
  active: boolean;
  affiliateCode: string;
  widgetCode?: string;
}

interface AffiliateData {
  excursions: AffiliateService;
  carRental: AffiliateService;
  flightBooking: AffiliateService;
}

export function TravelCTACards({ 
  title, 
  configuration 
}: { 
  title?: string;
  configuration?: any;
}) {
  const t = useTranslations('home.travelCTA');
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);

  useEffect(() => {
    const fetchAffiliatePrograms = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/settings/affiliate-programs`);
        if (response.ok) {
          const data = await response.json();
          setAffiliateData(data);
        }
      } catch (error) {
        console.error('Failed to fetch affiliate programs:', error);
      }
    };

    fetchAffiliatePrograms();
  }, []);

  const cards = [
    {
      icon: Compass,
      title: t('excursionsTitle'),
      description: t('excursionsDesc'),
      color: 'from-blue-500 to-cyan-500',
      active: affiliateData?.excursions.active,
      link: affiliateData?.excursions.affiliateCode,
    },
    {
      icon: Car,
      title: t('carRentalTitle'),
      description: t('carRentalDesc'),
      color: 'from-purple-500 to-pink-500',
      active: affiliateData?.carRental.active,
      link: affiliateData?.carRental.affiliateCode,
    },
    {
      icon: Plane,
      title: t('flightBookingTitle'),
      description: t('flightBookingDesc'),
      color: 'from-orange-500 to-red-500',
      active: affiliateData?.flightBooking.active,
      link: affiliateData?.flightBooking.affiliateCode,
    },
  ];

  // Filter only active cards
  const activeCards = cards.filter(card => card.active && card.link);

  if (activeCards.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('sectionTitle')}</h2>
          <p className="text-muted-foreground text-lg">{t('sectionSubtitle')}</p>
        </div>

        <div className={activeCards.length === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-8' : activeCards.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'grid grid-cols-1 gap-8'}>
          {activeCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="p-8 relative z-10">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className="text-muted-foreground mb-6">{card.description}</p>
                  
                  <Button
                    asChild
                    className={`w-full bg-gradient-to-r ${card.color} hover:opacity-90 transition-opacity`}
                  >
                    <a href={card.link} target="_blank" rel="noopener noreferrer">
                      {t('exploreNow')}
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
