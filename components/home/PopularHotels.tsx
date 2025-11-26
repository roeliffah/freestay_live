import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import hotelsData from '@/data/featured-hotels.json';

export function PopularHotels({ locale }: { locale: string }) {
  // Get random 10 featured hotels
  const randomHotels = [...hotelsData]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-3">Popüler Oteller</h2>
        <p className="text-center text-muted-foreground mb-12">
          Dünya çapında en çok tercih edilen tatil otelleri
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {randomHotels.map((hotel) => (
            <Link
              key={hotel.hotelId}
              href={`/${locale}/hotel/${hotel.hotelId}`}
            >
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={hotel.images[0]?.url}
                    alt={hotel.hotelName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3 bg-white/90 text-primary backdrop-blur">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {hotel.category}
                  </Badge>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {hotel.hotelName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    {hotel.destinationName}, {hotel.country}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">€{hotel.minPrice}</span>
                    <span className="text-xs text-muted-foreground">/gece</span>
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
            Tüm Otelleri Gör
          </Link>
        </div>
      </div>
    </section>
  );
}
