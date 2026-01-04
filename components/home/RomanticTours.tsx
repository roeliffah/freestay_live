'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Heart, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RomanticHotel {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  stars: number;
  image: string;
}

const fallbackRomanticHotels: RomanticHotel[] = [
  { id: '1', name: 'Parisian Romance Hotel', city: 'Paris', country: 'France', rating: 4.9, stars: 5, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
  { id: '2', name: 'Venice Grand Canal Resort', city: 'Venice', country: 'Italy', rating: 4.8, stars: 5, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800' },
  { id: '3', name: 'Tuscan Vineyard Villa', city: 'Florence', country: 'Italy', rating: 4.7, stars: 4, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800' },
  { id: '4', name: 'Istanbul Bosphorus Palace', city: 'Istanbul', country: 'Turkey', rating: 4.8, stars: 5, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800' },
  { id: '5', name: 'Barcelona Beachfront Resort', city: 'Barcelona', country: 'Spain', rating: 4.6, stars: 4, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800' },
  { id: '6', name: 'Santorini Sunset Suites', city: 'Santorini', country: 'Greece', rating: 4.9, stars: 5, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800' },
];

export function RomanticTours({ 
  locale, 
  hotelIds, 
  title 
}: { 
  locale: string;
  hotelIds?: string[];
  title?: string;
}) {
  const t = useTranslations('home');
  const [hotels, setHotels] = useState<RomanticHotel[]>(fallbackRomanticHotels);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Bir hafta sonrası tarihini hesapla
  const getNextWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const checkInDate = getNextWeekDate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadRomanticHotels = async () => {
      try {
        // Public featured hotels endpoint'ini Romantic category ile kullan
        // Eğer romantic tag/theme varsa onu kullanabiliriz, yoksa yine stars=5
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/featured-hotels?stars=5&count=6`
        );
        
        if (response.ok) {
          const result = await response.json();
          const data = result.hotels || result.data || result;
          
          if (data && Array.isArray(data) && data.length > 0) {
            // API'den gelen romantic hotels'i kullan
            const formattedHotels = data.map((hotel: any) => {
              // Images - ilk resmi al
              let image = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
              if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
                image = typeof hotel.images[0] === 'string' ? hotel.images[0] : hotel.images[0].url || hotel.images[0];
              }
              
              return {
                id: hotel.id?.toString() || '',
                name: hotel.name || 'Unknown Hotel',
                city: hotel.city || '',
                country: hotel.country || hotel.countryCode || '',
                rating: hotel.reviewScore || 4.5,
                stars: hotel.stars || 5,
                image: image
              };
            });
            setHotels(formattedHotels.slice(0, 6));
          }
        }
      } catch (error) {
        console.log('Using fallback romantic hotels data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRomanticHotels();
  }, []);

  // Hydration error önlemek için mounted kontrolü
  if (!mounted) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
            <h2 className="text-3xl font-bold text-center">{t('romanticTours.title')}</h2>
          </div>
          <p className="text-center text-muted-foreground mb-12">
            {t('romanticTours.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
            {hotels.slice(0, 6).map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden h-full">
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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h2 className="text-3xl font-bold">{t('romanticTours.title')}</h2>
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t('romanticTours.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {hotels.slice(0, 6).map((hotel) => {
            const checkOutDate = new Date();
            checkOutDate.setDate(checkOutDate.getDate() + 14);
            const checkOutDateStr = checkOutDate.toISOString().split('T')[0];
            
            return (
            <Link
              key={hotel.id}
              href={`/${locale}/hotel/${hotel.id}?checkIn=${checkInDate}&checkOut=${checkOutDateStr}&adults=1&children=0`}
            >
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-primary backdrop-blur">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      {hotel.rating}
                    </Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="flex gap-1">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hotel.city}, {hotel.country}
                  </p>
                </div>
              </Card>
            </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/search?category=romantic&checkInDate=${checkInDate}`}
            className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
          >
            {t('romanticTours.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
