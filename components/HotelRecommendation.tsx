'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

interface RecommendedHotel {
  id: string;
  name: string;
  image: string;
  destination: string;
  rating: number;
  price: number;
  discount?: number;
  type: 'similar' | 'trending' | 'suggested';
  badge?: string;
}

interface HotelRecommendationProps {
  currentHotelId?: string;
  recommendations: RecommendedHotel[];
  title?: string;
}

export default function HotelRecommendation({
  currentHotelId,
  recommendations,
  title
}: HotelRecommendationProps) {
  const t = useTranslations('recommendations');
  const locale = useLocale();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'similar':
        return t('type.similar');
      case 'trending':
        return t('type.trending');
      case 'suggested':
        return t('type.suggested');
      default:
        return t('type.recommended');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return '🔥';
      case 'suggested':
        return '✨';
      default:
        return '🏨';
    }
  };

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            {getTypeIcon(recommendations[0]?.type)} {getTypeLabel(recommendations[0]?.type)}
          </Badge>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            {title || t('title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.slice(0, 4).map((hotel) => (
            <Link key={hotel.id} href={`/${locale}/hotel/${hotel.id}`}>
              <Card className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-full hover:scale-105">
                {/* Image Container */}
                <div className="relative w-full h-48 bg-gradient-to-br from-secondary to-secondary/50 overflow-hidden group">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {hotel.rating.toFixed(1)}
                    </Badge>
                    {hotel.discount && (
                      <Badge className="bg-red-500 text-white">
                        -{hotel.discount}%
                      </Badge>
                    )}
                  </div>

                  {/* Type Badge */}
                  {hotel.badge && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-accent text-accent-foreground w-full justify-center">
                        {hotel.badge}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      📍 {hotel.destination}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-primary">
                        €{hotel.price}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('perNight')}
                      </span>
                    </div>
                    
                    <Button
                      className="w-full rounded-full mt-3 group"
                      variant="default"
                    >
                      {t('viewDetails')}
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        {recommendations.length > 4 && (
          <div className="text-center mt-12">
            <Link href={`/${locale}`}>
              <Button variant="outline" size="lg" className="rounded-full px-8">
                {t('viewMore')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
