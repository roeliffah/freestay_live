'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface HotelSlide {
  id: string;
  name: string;
  city: string;
  image: string;
  rating: number;
}

const turkeyHotels: HotelSlide[] = [
  {
    id: '1',
    name: 'Mardan Palace',
    city: 'Antalya',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Regnum Carya',
    city: 'Belek',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Four Seasons Bosphorus',
    city: 'İstanbul',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Hillside Beach Club',
    city: 'Fethiye',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    rating: 4.7,
  },
  {
    id: '5',
    name: 'Çırağan Palace Kempinski',
    city: 'İstanbul',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    rating: 4.9,
  },
  {
    id: '6',
    name: 'Maxx Royal Belek',
    city: 'Belek',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    rating: 4.8,
  },
  {
    id: '7',
    name: 'D-Hotel Maris',
    city: 'Marmaris',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    rating: 4.7,
  },
  {
    id: '8',
    name: 'Titanic Deluxe',
    city: 'Belek',
    image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
    rating: 4.6,
  },
  {
    id: '9',
    name: 'Mandarin Oriental',
    city: 'Bodrum',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    rating: 4.9,
  },
  {
    id: '10',
    name: 'Gloria Serenity Resort',
    city: 'Belek',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
    rating: 4.7,
  },
];

export function HotelSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesToShow = 4;

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
            <Card
              key={`${hotel.id}-${index}`}
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
                <div className="absolute bottom-3 left-3 text-white">
                  <h4 className="font-bold text-sm mb-1">{hotel.name}</h4>
                  <p className="text-xs opacity-90">{hotel.city}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded font-semibold">
                      ⭐ {hotel.rating}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
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
