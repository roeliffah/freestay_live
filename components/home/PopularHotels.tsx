'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SunHotel {
  hotelId: number;
  name: string;
  address: string;
  city: string;
  country: string;
  category: number; // Yıldız sayısı
  reviewScore?: number;
  images: Array<{ url: string; order: number }>;
}

// Fallback data for when API is not available
const fallbackHotels = [
  { hotelId: 1, name: 'Grand Resort & Spa', city: 'Antalya', country: 'Turkey', category: 5, reviewScore: 4.8, address: '', images: [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 1 }] },
  { hotelId: 2, name: 'Sunset Beach Hotel', city: 'Bodrum', country: 'Turkey', category: 5, reviewScore: 4.7, address: '', images: [{ url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', order: 1 }] },
  { hotelId: 3, name: 'Blue Lagoon Resort', city: 'Fethiye', country: 'Turkey', category: 5, reviewScore: 4.9, address: '', images: [{ url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', order: 1 }] },
  { hotelId: 4, name: 'Paradise Bay Hotel', city: 'Marmaris', country: 'Turkey', category: 4, reviewScore: 4.5, address: '', images: [{ url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', order: 1 }] },
  { hotelId: 5, name: 'Crystal Palace Resort', city: 'Alanya', country: 'Turkey', category: 5, reviewScore: 4.8, address: '', images: [{ url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', order: 1 }] },
  { hotelId: 6, name: 'Aegean Dream Hotel', city: 'Çeşme', country: 'Turkey', category: 4, reviewScore: 4.4, address: '', images: [{ url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', order: 1 }] },
  { hotelId: 7, name: 'Mediterranean Pearl', city: 'Kaş', country: 'Turkey', category: 5, reviewScore: 4.7, address: '', images: [{ url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', order: 1 }] },
  { hotelId: 8, name: 'Golden Sands Resort', city: 'Side', country: 'Turkey', category: 4, reviewScore: 4.6, address: '', images: [{ url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', order: 1 }] },
  { hotelId: 9, name: 'Turquoise Coast Hotel', city: 'Kalkan', country: 'Turkey', category: 5, reviewScore: 4.8, address: '', images: [{ url: 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800', order: 1 }] },
  { hotelId: 10, name: 'Royal Beach Resort', city: 'Kemer', country: 'Turkey', category: 4, reviewScore: 4.5, address: '', images: [{ url: 'https://images.unsplash.com/photo-1559599238-2e0ef3f505b8?w=800', order: 1 }] },
];

export function PopularHotels({ 
  locale, 
  hotelIds, 
  title 
}: { 
  locale: string;
  hotelIds?: string[];
  title?: string;
}) {
  const t = useTranslations('home');
  const [hotels, setHotels] = useState<SunHotel[]>(fallbackHotels);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadFeaturedHotels = async () => {
      try {
        // Public featured hotels endpoint'ini kullan
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/featured-hotels?stars=5&count=10`
        );
        
        if (response.ok) {
          const result = await response.json();
          // API response format: {"hotels": [...], "stars": 5, "count": 10}
          const data = result.hotels || result.data || result;
          
          if (data && Array.isArray(data) && data.length > 0) {
            // API'den gelen veriyi SunHotel formatına dönüştür
            const formattedHotels = data.map((hotel: any) => {
              // Images - direkt string array olarak geliyor
              let images: Array<{ url: string; order: number }> = [];
              
              if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
                images = hotel.images.map((img: any, idx: number) => ({
                  url: typeof img === 'string' ? img : (img.url || img),
                  order: idx
                }));
              }
              
              // Fallback image
              if (images.length === 0) {
                images = [{ url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 0 }];
              }

              return {
                hotelId: hotel.id?.toString() || '',
                name: hotel.name || 'Unknown Hotel',
                address: hotel.address || '',
                city: hotel.city || '',
                country: hotel.country || hotel.countryCode || '',
                category: hotel.stars || 5,
                reviewScore: hotel.reviewScore,
                images: images
              };
            });

            // Yıldız sayısına (category) göre azalan sırada sırala
            const sortedHotels = formattedHotels.sort((a, b) => {
              if (b.category !== a.category) {
                return b.category - a.category;
              }
              return (b.reviewScore || 0) - (a.reviewScore || 0);
            });
            
            setHotels(sortedHotels.slice(0, 10));
          }
        }
      } catch (error) {
        console.log('Using fallback hotels data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedHotels();
  }, []);

  // Hydration error önlemek için mounted kontrolü
  if (!mounted) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">{t('popularHotels.title')}</h2>
          <p className="text-center text-muted-foreground mb-12">
            {t('popularHotels.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {hotels.slice(0, 10).map((hotel) => (
              <Card key={hotel.hotelId} className="overflow-hidden h-full opacity-50">
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
          {hotels.map((hotel) => (
            <Link
              key={hotel.hotelId}
              href={`/${locale}/hotel/${hotel.hotelId}`}
            >
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={hotel.images?.[0]?.url || '/images/hotel-placeholder.jpg'}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    {hotel.reviewScore && (
                      <Badge className="bg-white/90 text-primary backdrop-blur">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        {hotel.reviewScore.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  {/* Yıldız sayısı gösterimi */}
                  <div className="absolute top-3 left-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: hotel.category || 0 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hotel.city}, {hotel.country}
                  </p>
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
