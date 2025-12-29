'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HotelCard } from '@/components/hotel/HotelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal, Star, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Hotel {
  hotelId: number;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  countryCode: string;
  category: number;
  latitude: number;
  longitude: number;
  resortId: number;
  resortName: string;
  minPrice: number;
  imageUrls: string[];
  phone?: string;
  email?: string;
  website?: string;
  featureIds: number[];
  themeIds: number[];
}

interface SearchResponse {
  hotels: Hotel[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  searchType: string;
}

interface Filters {
  starRating?: number[];
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  countries?: string[];
  cities?: string[];
  themes?: string[]; // UUID strings, not numbers
  features?: string[]; // UUID strings, not numbers
  resorts?: string[]; // UUID strings, not numbers
  roomTypes?: string[]; // UUID strings, not numbers
  checkIn?: string;
  checkOut?: string;
}

interface Theme {
  id: string; // Backend UUID
  sunHotelsId?: number; // SunHotels integer ID
  name: string;
}

interface Feature {
  id: string; // Backend UUID
  sunHotelsId?: number; // SunHotels integer ID
  name: string;
}

interface RoomType {
  id: string; // Backend UUID
  sunHotelsId?: number; // SunHotels integer ID
  name: string;
}

interface Resort {
  id: string; // Backend UUID
  sunHotelsId?: number; // SunHotels integer ID
  name: string;
  destinationName?: string;
}


function SearchPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('search');

  // SunHotels destekli diller
  const sunhotelsLanguages = [
    'ja', 'cs', 'pt', 'sv', 'zh-Hant', 'en', 'da', 'nl', 'ko', 'ru', 'hu', 'fr', 'no', 'es', 'de', 'it', 'zh-Hans', 'fi', 'pl'
  ];
  // Kullanılacak dil: locale destekleniyorsa onu, yoksa 'en'
  const selectedLang = sunhotelsLanguages.includes(locale) ? locale : 'en';

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'price',
    sortOrder: 'asc',
    checkIn: searchParams.get('checkInDate') || searchParams.get('checkindate') || searchParams.get('checkIn') || undefined,
    checkOut: searchParams.get('checkOutDate') || searchParams.get('checkoutdate') || searchParams.get('checkOut') || undefined,
  });

  // Filter options
  const [themes, setThemes] = useState<Theme[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search params change
    loadHotels(1);
  }, [searchParams, locale]);

  useEffect(() => {
    loadHotels(currentPage);
  }, [currentPage, filters.starRating, filters.countries, filters.cities, filters.themes, filters.features, filters.resorts, filters.roomTypes, filters.checkIn, filters.checkOut]);
  
  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, [locale]);
  
  const loadFilterOptions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const lang = selectedLang; // Use selectedLang which falls back to 'en' if locale not supported
      
      console.log('🔧 Loading filter options for language:', lang, '(original locale:', locale, ')');
      
      // Load themes with proper headers
      const themesRes = await fetch(`${API_URL}/sunhotels/themes?language=${lang}`, {
        headers: {
          'Accept-Language': lang,
          'Content-Type': 'application/json',
        }
      });
      if (themesRes.ok) {
        const themesData = await themesRes.json();
        console.log('✅ Themes loaded:', themesData.length);
        console.log('📋 First theme sample:', themesData[0]);
        setThemes(themesData);
      } else {
        console.error('❌ Failed to load themes:', themesRes.status);
      }
      
      // Load features
      console.log('🌍 Requesting features for language:', lang);
      const featuresRes = await fetch(`${API_URL}/sunhotels/features?language=${lang}`, {
        headers: {
          'Accept-Language': lang,
          'Content-Type': 'application/json',
        }
      });
      if (featuresRes.ok) {
        const featuresData = await featuresRes.json();
        console.log('✅ Features loaded:', featuresData.length);
        console.log('📋 FULL Features data:', featuresData); // FULL veri
        console.log('📋 First feature detailed:', JSON.stringify(featuresData[0], null, 2)); // İlk öğenin tüm alanları
        console.log('⚠️ Checking languageCode field:', featuresData.map((f: any) => ({ id: f.id, name: f.name, languageCode: f.languageCode, sunHotelsId: f.sunHotelsId })));
        setFeatures(featuresData);
      } else {
        console.error('❌ Failed to load features:', featuresRes.status);
      }
      
      // Load room types
      const roomTypesRes = await fetch(`${API_URL}/sunhotels/room-types?language=${lang}`, {
        headers: {
          'Accept-Language': lang,
          'Content-Type': 'application/json',
        }
      });
      if (roomTypesRes.ok) {
        const roomTypesData = await roomTypesRes.json();
        console.log('✅ Room types loaded:', roomTypesData.length);
        console.log('📋 First room type sample:', roomTypesData[0]);
        setRoomTypes(roomTypesData);
      } else {
        console.error('❌ Failed to load room types:', roomTypesRes.status);
      }
      
      // Load resorts
      console.log('🌍 Requesting resorts for language:', lang);
      const resortsRes = await fetch(`${API_URL}/sunhotels/resorts?language=${lang}`, {
        headers: {
          'Accept-Language': lang,
          'Content-Type': 'application/json',
        }
      });
      if (resortsRes.ok) {
        const resortsData = await resortsRes.json();
        console.log('✅ Resorts loaded:', resortsData.length);
        console.log('📋 First 3 resort samples:', resortsData.slice(0, 3));
        console.log('⚠️ Check if resort names are in correct language:', lang);
        setResorts(resortsData);
      } else {
        console.error('❌ Failed to load resorts:', resortsRes.status);
      }
    } catch (error) {
      console.error('❌ Failed to load filter options:', error);
    }
  };

  const loadHotels = async (page: number) => {
    setLoading(true);
    try {
      // Validate page number - must be at least 1
      const validPage = Math.max(1, page);
      if (validPage !== page) {
        console.warn(`⚠️ Invalid page ${page} corrected to ${validPage}`);
        setCurrentPage(validPage);
        return;
      }

      // Get all search parameters
      const destination = searchParams.get('destination') || '';
      const destinationId = searchParams.get('destinationId');
      const countryCode = searchParams.get('country');
      const themeId = searchParams.get('themeId');
      // Tarihleri önce filters'dan al, yoksa query string'den al
      const checkIn = filters.checkIn || searchParams.get('checkInDate') || searchParams.get('checkindate') || searchParams.get('checkIn');
      const checkOut = filters.checkOut || searchParams.get('checkOutDate') || searchParams.get('checkoutdate') || searchParams.get('checkOut');
      const adults = parseInt(searchParams.get('adults') || '2');
      const children = parseInt(searchParams.get('children') || '0');

      console.log('🔍 Unified Search Parameters:', {
        destination,
        destinationId,
        countryCode,
        themeId,
        checkIn,
        checkOut,
        adults,
        children,
        page: validPage,
        backendPage: validPage - 1,
        starFilter: filters.starRating,
        filtersCheckIn: filters.checkIn,
        filtersCheckOut: filters.checkOut
      });

      // Build request body for unified endpoint
      const requestBody: any = {
        language: selectedLang, // Use selectedLang which falls back to 'en' if locale not supported
        adults,
        children,
        numberOfRooms: 1, // Varsayılan olarak 1 oda
        currency: 'EUR', // Varsayılan para birimi
        page: validPage - 1, // Backend uses 0-based indexing (now guaranteed >= 0)
        pageSize: 20,
      };

      // Add dates if provided (dynamic search)
      if (checkIn && checkOut) {
        requestBody.checkindate = checkIn;
        requestBody.checkoutdate = checkOut;
      }

      // Add filters
      if (destinationId) {
        requestBody.destinationIds = [destinationId];
      }
      if (countryCode && (!filters.countries || filters.countries.length === 0)) {
        requestBody.countryCodes = [countryCode];
      }
      if (themeId && (!filters.themes || filters.themes.length === 0)) {
        // themeId query param'ından geliyorsa sayı olarak gönder
        const themeIdNum = parseInt(themeId);
        if (!isNaN(themeIdNum)) {
          requestBody.themeIds = [themeIdNum];
        }
      }
      if (destination && !destinationId) {
        requestBody.searchTerm = destination;
      }
      if (filters.starRating && filters.starRating.length > 0) {
        requestBody.minStars = Math.min(...filters.starRating);
        requestBody.maxStars = Math.max(...filters.starRating);
      }
      // Yeni filtreler - sadece dolu olanları gönder
      if (filters.countries && filters.countries.length > 0) {
        requestBody.countryCodes = filters.countries;
      }
      if (filters.themes && filters.themes.length > 0) {
        // Theme ID'lerini sunHotelsId (sayı) olarak gönder
        const themeNumbers = filters.themes
          .map(themeId => {
            const theme = themes.find(t => t.id === themeId);
            return theme?.sunHotelsId;
          })
          .filter(id => id !== undefined && id !== null) as number[];
        if (themeNumbers.length > 0) {
          requestBody.themeIds = themeNumbers;
        }
      }
      if (filters.features && filters.features.length > 0) {
        // Feature ID'lerini sunHotelsId (sayı) olarak gönder
        const featureNumbers = filters.features
          .map(featureId => {
            const feature = features.find(f => f.id === featureId);
            return feature?.sunHotelsId;
          })
          .filter(id => id !== undefined && id !== null) as number[];
        if (featureNumbers.length > 0) {
          requestBody.featureIds = featureNumbers;
        }
      }
      if (filters.resorts && filters.resorts.length > 0) {
        // Resort ID'lerini sunHotelsId (sayı) olarak gönder
        const resortNumbers = filters.resorts
          .map(resortId => {
            const resort = resorts.find(r => r.id === resortId);
            return resort?.sunHotelsId;
          })
          .filter(id => id !== undefined && id !== null) as number[];
        if (resortNumbers.length > 0) {
          requestBody.resortIds = resortNumbers;
        }
      }
      if (filters.roomTypes && filters.roomTypes.length > 0) {
        // Room type ID'lerini sunHotelsId (sayı) olarak gönder
        const roomTypeNumbers = filters.roomTypes
          .map(roomTypeId => {
            const roomType = roomTypes.find(rt => rt.id === roomTypeId);
            return roomType?.sunHotelsId;
          })
          .filter(id => id !== undefined && id !== null) as number[];
        if (roomTypeNumbers.length > 0) {
          requestBody.roomTypeIds = roomTypeNumbers;
        }
      }

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('🔐 Using language:', selectedLang, '(original locale:', locale, ', supported languages:', sunhotelsLanguages.includes(locale) ? 'YES' : 'NO', ')');
      // Call unified search endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/search/unified`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const result: SearchResponse = await response.json();
        console.log('✅ Unified search result:', result);
        console.log('📊 Search Type:', result.searchType, '| Hotels count:', result.hotels.length, '| Total:', result.totalCount);
        console.log('🏨 FULL Hotels data:', result.hotels);
        if (result.hotels.length > 0) {
          console.log('📍 First hotel detailed:', JSON.stringify(result.hotels[0], null, 2));
        }
        setSearchResponse(result);
        
        // Extract unique countries and cities from results
        const countries = Array.from(new Set(result.hotels.map(h => h.countryCode).filter(Boolean)));
        const cities = Array.from(new Set(result.hotels.map(h => h.city).filter(Boolean)));
        setAvailableCountries(countries);
        setAvailableCities(cities);
      } else {
        // Log detailed error
        const errorText = await response.text();
        console.error('❌ Unified search failed:', response.status);
        console.error('❌ Error details:', errorText);
        console.error('❌ Request was:', JSON.stringify(requestBody, null, 2));
        setSearchResponse({ hotels: [], totalCount: 0, totalPages: 0, currentPage: 0, pageSize: 20, searchType: 'error' });
      }
    } catch (error) {
      console.error('❌ Hotel search error:', error);
      setSearchResponse({ hotels: [], totalCount: 0, totalPages: 0, currentPage: 0, pageSize: 20, searchType: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const hotels = searchResponse?.hotels || [];
  const isStaticSearch = !searchParams.get('checkInDate') && !searchParams.get('checkindate') && !searchParams.get('checkIn') && !searchParams.get('checkOutDate') && !searchParams.get('checkoutdate') && !searchParams.get('checkOut');

  const filteredAndSortedHotels = hotels
    .sort((a, b) => {
      if (filters.sortBy === 'price') {
        const priceA = a.minPrice || 0;
        const priceB = b.minPrice || 0;
        return filters.sortOrder === 'asc'
          ? priceA - priceB
          : priceB - priceA;
      }
      if (filters.sortBy === 'rating') {
        return filters.sortOrder === 'asc'
          ? a.category - b.category
          : b.category - a.category;
      }
      if (filters.sortBy === 'name') {
        return filters.sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });

  const toggleStarFilter = (star: number) => {
    const current = filters.starRating || [];
    const updated = current.includes(star)
      ? current.filter((s) => s !== star)
      : [...current, star];
    setFilters({ ...filters, starRating: updated });
  };
  
  const toggleCountryFilter = (country: string) => {
    const current = filters.countries || [];
    const updated = current.includes(country)
      ? current.filter((c) => c !== country)
      : [...current, country];
    setFilters({ ...filters, countries: updated, cities: [] }); // Reset cities when country changes
    setCurrentPage(1);
  };
  
  const toggleCityFilter = (city: string) => {
    const current = filters.cities || [];
    const updated = current.includes(city)
      ? current.filter((c) => c !== city)
      : [...current, city];
    setFilters({ ...filters, cities: updated });
    setCurrentPage(1);
  };
  
  const toggleThemeFilter = (themeId: string) => {
    const current = filters.themes || [];
    const updated = current.includes(themeId)
      ? current.filter((id) => id !== themeId)
      : [...current, themeId];
    setFilters({ ...filters, themes: updated });
    setCurrentPage(1);
  };
  
  const toggleFeatureFilter = (featureId: string) => {
    const current = filters.features || [];
    const updated = current.includes(featureId)
      ? current.filter((id) => id !== featureId)
      : [...current, featureId];
    setFilters({ ...filters, features: updated });
    setCurrentPage(1);
  };
  
  const toggleResortFilter = (resortId: string) => {
    const current = filters.resorts || [];
    const updated = current.includes(resortId)
      ? current.filter((id) => id !== resortId)
      : [...current, resortId];
    setFilters({ ...filters, resorts: updated });
    setCurrentPage(1);
  };
  
  const toggleRoomTypeFilter = (roomTypeId: string) => {
    const current = filters.roomTypes || [];
    const updated = current.includes(roomTypeId)
      ? current.filter((id) => id !== roomTypeId)
      : [...current, roomTypeId];
    setFilters({ ...filters, roomTypes: updated });
    setCurrentPage(1);
  };
  
  const clearAllFilters = () => {
    setFilters({
      sortBy: 'price',
      sortOrder: 'asc',
      // Tarihleri de temizle
      checkIn: undefined,
      checkOut: undefined,
    });
    setCurrentPage(1);
  };
  
  const activeFilterCount = 
    (filters.starRating?.length || 0) +
    (filters.countries?.length || 0) +
    (filters.cities?.length || 0) +
    (filters.themes?.length || 0) +
    (filters.features?.length || 0) +
    (filters.resorts?.length || 0) +
    (filters.roomTypes?.length || 0) +
    (filters.checkIn ? 1 : 0) +
    (filters.checkOut ? 1 : 0);
  
  // Filter cities based on selected countries
  const filteredCities = filters.countries && filters.countries.length > 0
    ? availableCities.filter(city => {
        const hotelsInCity = hotels.filter(h => h.city === city);
        return hotelsInCity.some(h => filters.countries?.includes(h.countryCode));
      })
    : availableCities;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {t('title')}
            </h1>
            {isStaticSearch ? (
              <Badge variant="secondary" className="text-xs">
                📦 {t('staticMode')}
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-600">
                ⚡ {t('realtimeMode')}
              </Badge>
            )}
            {searchResponse && (
              <Badge variant="outline" className="text-xs">
                {searchResponse.searchType}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {searchResponse?.totalCount || 0} {t('hotelsFound')}
            {searchParams.get('destination') && ` - ${searchParams.get('destination')}`}
            {searchResponse && searchResponse.totalPages > 1 && (
              <span className="ml-2">
                (Sayfa {searchResponse.currentPage + 1} / {searchResponse.totalPages})
              </span>
            )}
          </p>
          {isStaticSearch && (
            <div className="mt-3 flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <SlidersHorizontal className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-blue-900 dark:text-blue-100">
                {t('staticModeInfo')}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtreler - Sidebar */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <Card className="p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">{t('filters')}</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
              </div>

              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                {/* Sıralama */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">{t('sortBy')}</label>
                  <Select
                    value={filters.sortBy || 'price'}
                    onValueChange={(value: any) =>
                      setFilters({ ...filters, sortBy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">{t('sortOptions.priceAsc')}</SelectItem>
                      <SelectItem value="rating">{t('sortOptions.ratingDesc')}</SelectItem>
                      <SelectItem value="name">{t('sortOptions.nameAsc')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Yıldız Sayısı */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-3 block">{t('stars')}</label>
                  <div className="space-y-2">
                    {[5, 4, 3].map((star) => (
                      <button
                        key={star}
                        onClick={() => toggleStarFilter(star)}
                        className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                          filters.starRating?.includes(star)
                            ? 'bg-primary text-white'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center">
                          {Array.from({ length: star }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm">
                          {hotels.filter((h) => h.category === star).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tarih Filtresi */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-3 block">{t('dates')}</label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">{t('checkIn')}</Label>
                      <Input
                        type="date"
                        value={filters.checkIn || ''}
                        onChange={(e) => setFilters({ ...filters, checkIn: e.target.value || undefined })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">{t('checkOut')}</Label>
                      <Input
                        type="date"
                        value={filters.checkOut || ''}
                        onChange={(e) => setFilters({ ...filters, checkOut: e.target.value || undefined })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Ülke Filtresi */}
                {availableCountries.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('country')} 
                      {filters.countries && filters.countries.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.countries.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {availableCountries.map((country) => (
                          <div key={country} className="flex items-center space-x-2">
                            <Checkbox
                              id={`country-${country}`}
                              checked={filters.countries?.includes(country)}
                              onCheckedChange={() => toggleCountryFilter(country)}
                            />
                            <Label
                              htmlFor={`country-${country}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {country}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Şehir Filtresi */}
                {filteredCities.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('city')}
                      {filters.cities && filters.cities.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.cities.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {filteredCities.map((city) => (
                          <div key={city} className="flex items-center space-x-2">
                            <Checkbox
                              id={`city-${city}`}
                              checked={filters.cities?.includes(city)}
                              onCheckedChange={() => toggleCityFilter(city)}
                            />
                            <Label
                              htmlFor={`city-${city}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {city}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Tema Filtresi */}
                {themes.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('themes')}
                      {filters.themes && filters.themes.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.themes.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {themes
                          .filter(theme => (theme as any).languageCode ? (theme as any).languageCode === selectedLang : true)
                          .map((theme) => (
                            <div key={theme.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`theme-${theme.id}`}
                                checked={filters.themes?.includes(theme.id)}
                                onCheckedChange={() => toggleThemeFilter(theme.id)}
                              />
                              <Label
                                htmlFor={`theme-${theme.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {theme.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Özellikler Filtresi */}
                {features.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('features')}
                      {filters.features && filters.features.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.features.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {features
                          .filter(feature => (feature as any).languageCode ? (feature as any).languageCode === selectedLang : true)
                          .map((feature) => (
                            <div key={feature.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`feature-${feature.id}`}
                                checked={filters.features?.includes(feature.id)}
                                onCheckedChange={() => toggleFeatureFilter(feature.id)}
                              />
                              <Label
                                htmlFor={`feature-${feature.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {feature.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Resort Filtresi */}
                {resorts.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('resorts')}
                      {filters.resorts && filters.resorts.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.resorts.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {resorts
                          .filter(resort => (resort as any).languageCode ? (resort as any).languageCode === selectedLang : true)
                          .map((resort) => (
                            <div key={resort.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`resort-${resort.id}`}
                                checked={filters.resorts?.includes(resort.id)}
                                onCheckedChange={() => toggleResortFilter(resort.id)}
                              />
                              <Label
                                htmlFor={`resort-${resort.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {resort.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Oda Tipi Filtresi */}
                {roomTypes.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      {t('roomTypes')}
                      {filters.roomTypes && filters.roomTypes.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.roomTypes.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {roomTypes
                          .filter(roomType => (roomType as any).languageCode ? (roomType as any).languageCode === selectedLang : true)
                          .map((roomType) => (
                            <div key={roomType.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`roomType-${roomType.id}`}
                                checked={filters.roomTypes?.includes(roomType.id)}
                                onCheckedChange={() => toggleRoomTypeFilter(roomType.id)}
                              />
                              <Label
                                htmlFor={`roomType-${roomType.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {roomType.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </ScrollArea>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
              >
                <X className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            </Card>
          </aside>

          {/* Otel Listesi */}
          <div className="lg:col-span-3">
            {/* Mobil Filtre Butonu */}
            <Button
              variant="outline"
              className="lg:hidden w-full mb-4"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t('filters')}
              {activeFilterCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <div className="space-y-4">
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-48 w-full rounded-lg" />
                      <div className="md:col-span-2 space-y-3">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : filteredAndSortedHotels.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    {t('noResults')}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setFilters({ sortBy: 'price', sortOrder: 'asc' })}
                  >
                    {t('tryAgain')}
                  </Button>
                </Card>
              ) : (
                filteredAndSortedHotels.map((hotel) => (
                  <HotelCard key={hotel.hotelId} hotel={hotel} />
                ))
              )}
            </div>

            {/* Pagination */}
            {searchResponse && searchResponse.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('previous')}
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, searchResponse.totalPages) }, (_, i) => {
                    // Show pages around current page
                    const totalPages = searchResponse.totalPages;
                    let pageNum: number;
                    
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(searchResponse.totalPages, prev + 1))}
                  disabled={currentPage === searchResponse.totalPages || loading}
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}

export default SearchPageWrapper;
