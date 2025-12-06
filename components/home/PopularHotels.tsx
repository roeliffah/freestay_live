'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Loader2 } from 'lucide-react';
import { api, Hotel } from '@/lib/api';
import { useTranslations } from 'next-intl';

// Fallback data for when API is not available
const fallbackHotels = [
  { id: '1', name: 'Grand Resort & Spa', city: 'Antalya', country: 'Turkey', rating: 4.8, stars: 5, priceFrom: 120, currency: 'EUR', images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'] },
  { id: '2', name: 'Sunset Beach Hotel', city: 'Bodrum', country: 'Turkey', rating: 4.6, stars: 4, priceFrom: 95, currency: 'EUR', images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'] },
  { id: '3', name: 'Blue Lagoon Resort', city: 'Fethiye', country: 'Turkey', rating: 4.7, stars: 5, priceFrom: 150, currency: 'EUR', images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'] },
  { id: '4', name: 'Paradise Bay Hotel', city: 'Marmaris', country: 'Turkey', rating: 4.5, stars: 4, priceFrom: 85, currency: 'EUR', images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'] },
  { id: '5', name: 'Crystal Palace Resort', city: 'Alanya', country: 'Turkey', rating: 4.9, stars: 5, priceFrom: 180, currency: 'EUR', images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'] },
];

export function PopularHotels({ locale }: { locale: string }) {
  const t = useTranslations('home');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedHotels = async () => {
      try {
        const response = await api.hotels.getFeatured();
        setHotels(response.data);
      } catch {
        // Use fallback data when API is not available
        setHotels(fallbackHotels as unknown as Hotel[]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedHotels();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-3">{t('popularHotels.title')}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {t('popularHotels.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {hotels.slice(0, 10).map((hotel) => (
            <Link
              key={hotel.id}
              href={`/${locale}/hotel/${hotel.id}`}
            >
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={hotel.images[0] || '/images/hotel-placeholder.jpg'}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3 bg-white/90 text-primary backdrop-blur">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {hotel.rating}
                  </Badge>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hotel.city}, {hotel.country}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">
                      {hotel.currency === 'EUR' ? '€' : hotel.currency === 'USD' ? '$' : hotel.currency}
                      {hotel.priceFrom}
                    </span>
                    <span className="text-xs text-muted-foreground">/{t('popularHotels.perNight')}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/search`}
            className="inline-block bg-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('popularHotels.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
