'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import hotelsData from '@/data/featured-hotels.json';

// Get 12 featured hotels from Turkey
const turkeyHotels = hotelsData
  .filter(hotel => hotel.country === 'Turkey')
  .slice(0, 12)
  .map(hotel => ({
    id: hotel.hotelId,
    name: hotel.hotelName,
    city: hotel.destinationName,
    image: hotel.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    rating: hotel.category,
  }));

export function HotelSlider() {
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4);

  // Responsive slides based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 768) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(4);
      }
    };

    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + slidesToShow >= turkeyHotels.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? turkeyHotels.length - slidesToShow : prev - 1
    );
  };

  const visibleHotels = turkeyHotels.slice(currentIndex, currentIndex + slidesToShow);
  if (visibleHotels.length < slidesToShow) {
    visibleHotels.push(...turkeyHotels.slice(0, slidesToShow - visibleHotels.length));
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="shrink-0 h-12 w-12 rounded-full shadow-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
          {visibleHotels.map((hotel, index) => (
            <Link 
              key={`${hotel.id}-${index}`}
              href={`/${locale}/hotel/${hotel.id}`}
            >
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-white text-black px-2 py-1 rounded font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {hotel.rating}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <h4 className="font-bold text-sm mb-1">{hotel.name}</h4>
                    <p className="text-xs opacity-90">{hotel.city}, Turkey</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="shrink-0 h-12 w-12 rounded-full shadow-lg"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: turkeyHotels.length - slidesToShow + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              currentIndex === index ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
