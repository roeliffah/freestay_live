'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import featuredDestinations from '@/data/featured-destinations.json';

interface CascadingDestinationSelectorProps {
  onSelect: (country: string, city: string) => void;
  defaultCountry?: string;
  defaultCity?: string;
}

export function CascadingDestinationSelector({
  onSelect,
  defaultCountry,
  defaultCity,
}: CascadingDestinationSelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry || '');
  const [selectedCity, setSelectedCity] = useState(defaultCity || '');

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedCity(''); // Reset city when country changes
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    if (selectedCountry) {
      onSelect(selectedCountry, cityName);
    }
  };

  const availableCities = selectedCountry
    ? featuredDestinations.countries.find(c => c.code === selectedCountry)?.cities || []
    : [];

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Country Selector */}
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Ülke Seçin</label>
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Ülke seçin..." />
          </SelectTrigger>
          <SelectContent>
            {featuredDestinations.countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({country.cities.length} şehir)
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selector */}
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Şehir Seçin</label>
        <Select 
          value={selectedCity} 
          onValueChange={handleCityChange}
          disabled={!selectedCountry}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectedCountry ? "Şehir seçin..." : "Önce ülke seçin"} />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city.id} value={city.name}>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{city.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
