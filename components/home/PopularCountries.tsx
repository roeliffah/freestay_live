'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

interface Country {
  name: string;
  code: string;
  countryId: string;
  destinationCount: number;
}

interface PopularCountriesProps {
  locale: string;
  countryIds?: string[];
  title?: string;
}

export function PopularCountries({ locale, countryIds, title }: PopularCountriesProps) {
  const t = useTranslations('home');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Bir hafta sonrası tarihini hesapla
  const getNextWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const checkInDate = getNextWeekDate();

  useEffect(() => {
    loadCountries();
  }, [countryIds]);

  const loadCountries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sunhotels/countries`);
      
      if (response.ok) {
        const result = await response.json();
        let countriesData = result.data || result;
        
        // Filter by countryIds if provided
        if (countryIds && countryIds.length > 0) {
          countriesData = countriesData.filter((country: Country) => 
            countryIds.includes(country.countryId)
          );
        }
        
        setCountries(countriesData);
      } else {
        console.error('Failed to fetch countries, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map country codes to flag emojis
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Get country image (you can replace with actual images later)
  const getCountryImage = (countryCode: string): string => {
    // Placeholder images from Unsplash based on country
    const imageMap: { [key: string]: string } = {
      'TR': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80', // Turkey
      'GR': 'https://images.unsplash.com/photo-1503152394-c571994fd383?w=400&q=80', // Greece
      'ES': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&q=80', // Spain
      'IT': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&q=80', // Italy
      'FR': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', // France
      'PT': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&q=80', // Portugal
      'HR': 'https://images.unsplash.com/photo-1555990538-c3d8f7d3b2b2?w=400&q=80', // Croatia
      'AE': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80', // UAE
      'EG': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&q=80', // Egypt
      'TH': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80', // Thailand
    };
    return imageMap[countryCode] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (countries.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {title || t('countries.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('countries.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {countries.map((country, index) => {
            const countryUrl = `/${locale}/search?country=${country.code}&checkInDate=${checkInDate}`;
            console.log('🔗 Country link:', country.name, '→', countryUrl, 'code:', country.code);
            
            return (
              <Link
                key={country.countryId || country.code || `country-${index}`}
                href={countryUrl}
                className="group"
              >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                <div className="relative h-48">
                  <img
                    src={getCountryImage(country.code)}
                    alt={country.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className="text-4xl">{getFlagEmoji(country.code)}</div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-xl mb-1">{country.name}</h3>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{country.destinationCount} destinations</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
