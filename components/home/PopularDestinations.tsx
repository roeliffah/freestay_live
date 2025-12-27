'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Destination {
  id: string;
  name: string;
  country: string;
  hotelCount: number;
  image: string;
}

const fallbackDestinations: Destination[] = [
  { id: '1', name: 'Paris', country: 'France', hotelCount: 2850, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800' },
  { id: '2', name: 'Barcelona', country: 'Spain', hotelCount: 1920, image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800' },
  { id: '3', name: 'Rome', country: 'Italy', hotelCount: 2100, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800' },
  { id: '4', name: 'Santorini', country: 'Greece', hotelCount: 890, image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800' },
  { id: '5', name: 'Istanbul', country: 'Turkey', hotelCount: 3200, image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800' },
];

export function PopularDestinations({ 
  locale, 
  destinationIds, 
  title 
}: { 
  locale: string;
  destinationIds?: string[];
  title?: string;
}) {
  const t = useTranslations('home');
  const [destinations, setDestinations] = useState<Destination[]>(fallbackDestinations);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        // Public featured destinations endpoint'ini kullan
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/featured-destinations?count=5`
        );
        
        if (response.ok) {
          const result = await response.json();
          // API response format: {"destinations": [...], "count": 5}
          const data = result.destinations || result.data || result;
          
          if (data && Array.isArray(data) && data.length > 0) {
            // API'den gelen destinationları kullan
            const formattedDestinations = data.map((dest: any) => {
              // Images array'inden ilk resmi al, yoksa imageUrl'i kullan
              let imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
              if (dest.images && Array.isArray(dest.images) && dest.images.length > 0) {
                imageUrl = dest.images[0].url || dest.images[0];
              } else if (dest.imageUrl) {
                imageUrl = dest.imageUrl;
              } else if (dest.image) {
                imageUrl = dest.image;
              }

              return {
                id: dest.destinationId || dest.id,
                name: dest.destinationName || dest.name,
                country: dest.country,
                hotelCount: dest.hotelCount || 0,
                image: imageUrl
              };
            });
            setDestinations(formattedDestinations);
          }
        }
      } catch (error) {
        console.log('Using fallback destinations data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDestinations();
  }, []);

  // Hydration error önlemek için mounted kontrolü
  if (!mounted) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">{t('popularDestinations.title')}</h2>
          <p className="text-center text-muted-foreground mb-12">
            {t('popularDestinations.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto opacity-50">
            {destinations.map((dest) => (
              <Card key={dest.id} className="overflow-hidden h-full">
                <div className="relative h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  const [mainDestination, ...smallDestinations] = destinations;

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-3">{t('popularDestinations.title')}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {t('popularDestinations.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Sol taraf - 1 büyük destinasyon */}
          <Link
            href={`/${locale}/search?destination=${mainDestination.name}`}
            className="md:col-span-1 md:row-span-2"
          >
            <Card className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all h-full">
              <div className="relative h-full min-h-[400px]">
                <Image
                  src={mainDestination.image}
                  alt={mainDestination.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-sm font-medium">{mainDestination.country}</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{mainDestination.name}</h3>
                  <p className="text-white/90 mb-4">
                    {mainDestination.hotelCount} {t('popularDestinations.hotels')}
                  </p>
                  <Button variant="secondary" size="sm" className="bg-white text-primary hover:bg-gray-100">
                    {t('popularDestinations.viewHotels')}
                  </Button>
                </div>
              </div>
            </Card>
          </Link>

          {/* Sağ taraf - 4 küçük destinasyon (2x2 grid) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {smallDestinations.map((destination) => (
              <Link
                key={destination.id}
                href={`/${locale}/search?destination=${destination.name}`}
              >
                <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                  <div className="relative h-48">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs font-medium">{destination.country}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{destination.name}</h3>
                      <p className="text-sm text-white/90">
                        {destination.hotelCount} {t('popularDestinations.hotels')}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
