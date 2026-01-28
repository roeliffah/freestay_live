'use client';

import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
import { getCountryName } from '@/lib/functions/functions';
import { StickySearchBar } from '@/components/search/StickySearchBar';
import { validateAndMapLocale } from '@/lib/utils/language-mapping';

interface Room {
  roomId: string;
  name: string;
  roomTypeName: string;
  mealName: string;
  price: number;
  availableRooms: number;
  isRefundable: boolean;
  isSuperDeal: boolean;
}

interface Hotel {
  hotelId: number;
  name: string;
  description: string;
  category: number;
  stars?: number;
  city: string;
  country: string;
  countryCode: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  images?: string[];  // Backward compatibility
  minPrice: number;
  currency: string;
  reviewScore: number | null;
  reviewCount: number | null;
  checkInDate?: string;
  checkOutDate?: string;
  rooms?: Room[];
}

interface SearchResponse {
  hotels: Hotel[];
  totalCount: number;
  searchType: string;
  hasPricing: boolean;
}

interface Filters {
  starRating?: number[];
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  countries?: string[];
  cities?: string[];
  destinations?: string[]; // UUID strings for destinations
  hotelName?: string; // Hotel name search
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

interface Destination {
  id: string; // Backend UUID
  sunHotelsId?: number; // SunHotels integer ID
  name: string;
  countryCode: string;
}

function SearchPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('search');

  // Map locale to SunHotels language code
  // API dili sabit kalsın; locale değişse bile backend'e hep aynı dil ile gidiyoruz
  const selectedLang = 'en';

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>(''); // Loading durumu mesajı
  const [retryCount, setRetryCount] = useState(0); // Retry sayacı
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [profitMargin, setProfitMargin] = useState(0); // Kar marjı %
  const [defaultVatRate, setDefaultVatRate] = useState(0); // KDV %
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
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  // Cache filter options to avoid re-fetching
  const filterOptionsCache = useRef<Record<string, { themes: Theme[], features: Feature[], roomTypes: RoomType[], resorts: Resort[] }>>({});
  
  // Debounce timer for filter changes
  const filterDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fiyat hesaplama fonksiyonu
  // basePrice: API'den gelen otel fiyatı
  // Returns: basePrice + (basePrice * profitMargin% * (1 + vatRate%))
  const calculateFinalPrice = (basePrice: number): number => {
    if (!basePrice) return 0;
    const profitAmount = basePrice * (profitMargin / 100); // Kar tutarı
    const vatAmount = profitAmount * (defaultVatRate / 100); // Kar üzerine KDV
    return Math.round((basePrice + profitAmount + vatAmount) * 100) / 100; // Son fiyat, 2 ondalık
  };

  // Settings'ten kar marjı ve KDV'yi yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/public/settings/site`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfitMargin(data.profitMargin || 0);
          setDefaultVatRate(data.defaultVatRate || 0);
          console.log('✅ Settings yüklendi:', { profitMargin: data.profitMargin, defaultVatRate: data.defaultVatRate });
        }
      } catch (error) {
        console.warn('⚠️ Settings yüklenemedi, varsayılan değerler kullanılıyor:', error);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search params change
    loadHotels(1);
  }, [searchParams]);

  // Debounced filter effect - wait before making API call
  useEffect(() => {
    if (filterDebounceTimer.current) {
      clearTimeout(filterDebounceTimer.current);
    }
    filterDebounceTimer.current = setTimeout(() => {
      loadHotels(1);
    }, 300); // Wait 300ms after filter change before making request

    return () => {
      if (filterDebounceTimer.current) {
        clearTimeout(filterDebounceTimer.current);
      }
    };
  }, [filters.starRating, filters.countries, filters.cities, filters.themes, filters.features, filters.resorts, filters.roomTypes, filters.checkIn, filters.checkOut, filters.hotelName, filters.destinations]);

  // Separate pagination effect - immediate response
  useEffect(() => {
    if (currentPage > 1) {
      loadHotels(currentPage);
    }
  }, [currentPage]);
  
  // Load destinations when country is selected (for non-static searches)
  useEffect(() => {
    const isNonStatic = filters.checkIn && filters.checkOut;
    
    if (isNonStatic && filters.countries && filters.countries.length > 0) {
      loadDestinations(filters.countries);
    } else {
      setDestinations([]);
    }
  }, [filters.countries, filters.checkIn, filters.checkOut]);
  
  // Load filter options on mount - with caching
  useEffect(() => {
    const lang = selectedLang;
    
    // Check cache first
    if (filterOptionsCache.current[lang]) {
      const cached = filterOptionsCache.current[lang];
      setThemes(cached.themes);
      setFeatures(cached.features);
      setRoomTypes(cached.roomTypes);
      setResorts(cached.resorts);
      return;
    }
    
    loadFilterOptions();
  }, []);
  
  const loadFilterOptions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const lang = selectedLang;
      const filterStartTime = performance.now();
      
      console.log('🔧 Loading filter options for language:', lang, '(original locale:', locale, ')');
      
      // Load only themes and features (room-types and resorts are too large and not needed for search filters)
      const [themesRes, featuresRes] = await Promise.all([
        fetch(`${API_URL}/sunhotels/themes?language=${lang}`, {
          headers: {
            'Accept-Language': lang,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${API_URL}/sunhotels/features?language=${lang}`, {
          headers: {
            'Accept-Language': lang,
            'Content-Type': 'application/json',
          }
        })
      ]);

      let themesData: Theme[] = [];
      let featuresData: Feature[] = [];

      if (themesRes.ok) {
        themesData = await themesRes.json();
        console.log('✅ Themes loaded:', themesData.length);
      } else {
        console.error('❌ Failed to load themes:', themesRes.status);
      }

      if (featuresRes.ok) {
        featuresData = await featuresRes.json();
        console.log('✅ Features loaded:', featuresData.length);
      } else {
        console.error('❌ Failed to load features:', featuresRes.status);
      }

      const filterEndTime = performance.now();
      console.log(`⏱️ Filter options loading took: ${(filterEndTime - filterStartTime).toFixed(2)}ms`);

      // Update state
      setThemes(themesData);
      setFeatures(featuresData);
      // Empty room types and resorts (not needed for search)
      setRoomTypes([]);
      setResorts([]);

      // Cache the results
      filterOptionsCache.current[lang] = {
        themes: themesData,
        features: featuresData,
        roomTypes: [],
        resorts: []
      };
    } catch (error) {
      console.error('❌ Failed to load filter options:', error);
    }
  };

  const loadDestinations = async (countryCodes: string[]) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      console.log('🌍 Loading destinations for countries:', countryCodes);
      
      // Fetch destinations for each country
      const destinationRes = await fetch(`${API_URL}/sunhotels/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCodes: countryCodes,
          language: selectedLang
        }),
      });

      if (destinationRes.ok) {
        const destinationsData: Destination[] = await destinationRes.json();
        console.log('✅ Destinations loaded:', destinationsData.length);
        setDestinations(destinationsData);
      } else {
        console.error('❌ Failed to load destinations:', destinationRes.status);
        setDestinations([]);
      }
    } catch (error) {
      console.error('❌ Error loading destinations:', error);
      setDestinations([]);
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
      let destinationId = searchParams.get('destinationId');
      const hotelId = searchParams.get('hotelId');
      let resortId = searchParams.get('resortId');
      const countryCode = searchParams.get('country');
      const themeId = searchParams.get('themeId');
      // Tarihleri önce filters'dan al, yoksa query string'den al
      const checkIn = filters.checkIn || searchParams.get('checkInDate') || searchParams.get('checkindate') || searchParams.get('checkIn');
      const checkOut = filters.checkOut || searchParams.get('checkOutDate') || searchParams.get('checkoutdate') || searchParams.get('checkOut');
      const adults = parseInt(searchParams.get('adults') || '2');
      const children = parseInt(searchParams.get('children') || '0');

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // If hotelId is provided but no destinationId/resortId, fetch hotel info first
      // This is needed because the search API requires at least one of these parameters
      if (hotelId && !destinationId && !resortId) {
        console.log('🏨 Fetching hotel info to get destinationId/resortId for hotelId:', hotelId);
        try {
          const hotelInfoResponse = await fetch(`${API_URL}/sunhotels/hotels/${hotelId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept-Language': locale || 'en',
            },
          });
          
          if (hotelInfoResponse.ok) {
            const hotelInfo = await hotelInfoResponse.json();
            console.log('✅ Hotel info fetched:', { 
              hotelId: hotelInfo.hotelId || hotelInfo.id,
              destinationId: hotelInfo.destinationId,
              resortId: hotelInfo.resortId,
              name: hotelInfo.name
            });
            
            // Use hotel's destinationId and resortId for search
            if (hotelInfo.destinationId) {
              destinationId = String(hotelInfo.destinationId);
            }
            if (hotelInfo.resortId) {
              resortId = String(hotelInfo.resortId);
            }
          } else {
            console.warn('⚠️ Failed to fetch hotel info:', hotelInfoResponse.status);
          }
        } catch (hotelFetchError) {
          console.warn('⚠️ Error fetching hotel info:', hotelFetchError);
        }
      }

      console.log('🔍 Unified Search Parameters:', {
        destination,
        destinationId,
        hotelId,
        resortId,
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

      // Measure API call time
      const apiStartTime = performance.now();
      console.log('🚀 API request starting at:', new Date().toLocaleTimeString());
      
      // Call backend search endpoint with retry mechanism
      const SEARCH_TIMEOUT = 45000; // 45 saniye timeout (SunHotels V3 yavaş olabilir)
      const MAX_RETRIES = 2;
      
      // Retry mekanizmalı fetch fonksiyonu
      const fetchWithRetry = async (url: string, options: RequestInit, retries: number = MAX_RETRIES): Promise<Response> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
          
          try {
            setLoadingMessage(attempt > 0 
              ? `Yeniden deneniyor... (${attempt}/${retries})` 
              : 'Oteller aranıyor...');
            setRetryCount(attempt);
            
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok || attempt === retries) {
              return response;
            }
            
            // Başarısız ama retry hakkı var
            console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
          } catch (error: any) {
            clearTimeout(timeoutId);
            if (attempt === retries) throw error;
            
            if (error.name === 'AbortError') {
              console.warn(`⏱️ Attempt ${attempt + 1} timed out, retrying...`);
              setLoadingMessage(`Zaman aşımı, yeniden deneniyor... (${attempt + 1}/${retries})`);
            }
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
        throw new Error('Max retries exceeded');
      };
      
      try {
        // Build query string for GET request (Swagger: /api/v1/public/hotels/search)
        // Prepare themeIds and featureIds as comma-separated strings (e.g., "7,12")
        const themeIdsFromQuery = searchParams.get('themeIds') || searchParams.get('themeId') || '';
        const featureIdsFromQuery = searchParams.get('featureIds') || searchParams.get('featureId') || '';

        // Map selected filter UUIDs to SunHotels numeric IDs when available
        const selectedThemeIds = (filters.themes || [])
          .map(uuid => themes.find(t => t.id === uuid)?.sunHotelsId)
          .filter((id): id is number => typeof id === 'number');
        const selectedFeatureIds = (filters.features || [])
          .map(uuid => features.find(f => f.id === uuid)?.sunHotelsId)
          .filter((id): id is number => typeof id === 'number');

        const themeIdsCSV = selectedThemeIds.length > 0
          ? selectedThemeIds.join(',')
          : (themeIdsFromQuery || '');
        const featureIdsCSV = selectedFeatureIds.length > 0
          ? selectedFeatureIds.join(',')
          : (featureIdsFromQuery || '');

        // resortId'yi URL'den veya hotel info'dan al
        const finalResortId = resortId || searchParams.get('resortId');
        
        const queryParams = new URLSearchParams({
          ...(destination && { destination }),
          ...(destinationId && { destinationId }),
          ...(finalResortId && { resortIds: finalResortId }),
          ...(checkIn && { checkIn }),
          ...(checkOut && { checkOut }),
          adults: adults.toString(),
          children: children.toString(),
          ...(themeIdsCSV && { themeIds: themeIdsCSV }),
          ...(featureIdsCSV && { featureIds: featureIdsCSV }),
        });

        const response = await fetchWithRetry(
          `${API_URL}/public/hotels/search?${queryParams}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept-Language': locale || 'en',
            },
          }
        );
        const apiEndTime = performance.now();
        const apiDuration = apiEndTime - apiStartTime;
        console.log(`⏱️ API response received in: ${apiDuration.toFixed(2)}ms (${(apiDuration / 1000).toFixed(2)}s)`);

        if (response.ok) {
          const jsonStartTime = performance.now();
          const result: any = await response.json();
          const jsonEndTime = performance.now();
          console.log(`⏱️ JSON parsing took: ${(jsonEndTime - jsonStartTime).toFixed(2)}ms`);
          
          console.log('✅ Backend search result:', result);
          console.log('📊 Hotels count:', result.hotels?.length);
          
          // Log first hotel to debug structure
          if (result.hotels && result.hotels.length > 0) {
            console.log('🔍 First hotel structure:', result.hotels[0]);
          }
          
          // Map backend response to our format
          const mappedHotels = (result.hotels || [])
            .map((h: any, index: number) => {
              const hotelId = h.hotel_id || h.hotelId || h.id;
              
              if (!hotelId) {
                console.warn(`⚠️ Hotel at index ${index} has no ID:`, h);
                return null;
              }
              
              return {
                hotelId,
                name: h.name || `Hotel #${hotelId}`,
                description: h.description || '',
                category: h.category || 0,
                stars: h.star_rating || h.stars || 0,
                city: h.city || '',
                country: h.country || '',
                countryCode: h.country_code || h.countryCode || '',
                address: h.address || '',
                latitude: h.latitude || 0,
                longitude: h.longitude || 0,
                imageUrls: h.images || h.imageUrls || [],
                minPrice: h.min_price || h.minPrice || 0,
                currency: 'EUR',
                reviewScore: h.review_score || h.reviewScore,
                reviewCount: h.review_count || h.reviewCount,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                destinationId: h.destination_id || h.destinationId,
                resortId: h.resort_id || h.resortId,
                resortName: h.resort_name || h.resortName,
              };
            })
            .filter(Boolean); // Remove null entries
          
          setSearchResponse({ 
            hotels: mappedHotels, 
            totalCount: mappedHotels.length, 
            searchType: 'backend', 
            hasPricing: checkIn && checkOut ? true : false 
          });
          
          // Extract unique countries and cities from results
          const countries = Array.from(new Set(mappedHotels.map((h: any) => h.country).filter(Boolean)));
          const cities = Array.from(new Set(mappedHotels.map((h: any) => h.city).filter(Boolean)));
          setAvailableCountries(countries as string[]);
          setAvailableCities(cities as string[]);
        } else {
          // Log detailed error
          const errorText = await response.text();
          console.error('❌ Backend search failed:', response.status);
          console.error('❌ Error details:', errorText);
          setSearchResponse({ hotels: [], totalCount: 0, searchType: 'error', hasPricing: false });
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error('⏱️ API request TIMEOUT - took more than 45 seconds after retries');
          console.error('⚠️ Backend is very slow or unresponsive');
          setLoadingMessage('Sunucu yanıt vermiyor. Lütfen daha sonra tekrar deneyin.');
        } else {
          console.error('❌ Fetch error:', fetchError);
          setLoadingMessage('Bağlantı hatası oluştu.');
        }
        setSearchResponse({ hotels: [], totalCount: 0, searchType: 'error', hasPricing: false });
      }
    } catch (error) {
      console.error('❌ Hotel search error:', error);
      setSearchResponse({ hotels: [], totalCount: 0, searchType: 'error', hasPricing: false });
    } finally {
      setLoading(false);
    }
  };

  const hotels = searchResponse?.hotels || [];
  const isStaticSearch = !searchParams.get('checkInDate') && !searchParams.get('checkindate') && !searchParams.get('checkIn') && !searchParams.get('checkOutDate') && !searchParams.get('checkoutdate') && !searchParams.get('checkOut');

  const filteredAndSortedHotels = hotels
    // Client-side filtering (backend cityNames parametresini görmezden geldiği için)
    .filter(hotel => {
      // Şehir filtresi - backend bunu uygulamıyor, client-side'da filtreleyelim
      if (filters.cities && filters.cities.length > 0) {
        if (!hotel.city || !filters.cities.includes(hotel.city)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price') {
        const priceA = a.minPrice || 0;
        const priceB = b.minPrice || 0;
        return filters.sortOrder === 'asc'
          ? priceA - priceB
          : priceB - priceA;
      }
      if (filters.sortBy === 'rating') {
        const ratingA = a.stars || a.category || 0;
        const ratingB = b.stars || b.category || 0;
        return filters.sortOrder === 'asc'
          ? ratingA - ratingB
          : ratingB - ratingA;
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
  
  const toggleDestinationFilter = (destinationId: string) => {
    const current = filters.destinations || [];
    const updated = current.includes(destinationId)
      ? current.filter((id) => id !== destinationId)
      : [...current, destinationId];
    setFilters({ ...filters, destinations: updated });
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
      checkIn: undefined,
      checkOut: undefined,
      hotelName: undefined,
      destinations: undefined,
    });
    setCurrentPage(1);
  };
  
  const activeFilterCount = 
    (filters.starRating?.length || 0) +
    (filters.countries?.length || 0) +
    (filters.cities?.length || 0) +
    (filters.destinations?.length || 0) +
    (filters.hotelName ? 1 : 0) +
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
        return hotelsInCity.some(h => filters.countries?.includes(h.country));
      })
    : availableCities;

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      {/* Sticky Search Bar */}
      <StickySearchBar
        initialCheckIn={filters.checkIn}
        initialCheckOut={filters.checkOut}
        initialAdults={parseInt(searchParams.get('adults') || '1')}
        initialChildren={parseInt(searchParams.get('children') || '0')}
        onUpdate={({ checkIn, checkOut, adults, children }) => {
          setFilters({ 
            ...filters, 
            checkIn, 
            checkOut 
          });
          setCurrentPage(1);
        }}
        locale={locale}
      />
      
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
            {searchResponse && searchResponse.hasPricing && (
              <Badge variant="default" className="ml-2 text-xs bg-green-600">
                ✓ Fiyatlı
              </Badge>
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

                {/* Otel Adı Arama */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Otel Adı</label>
                  <Input
                    placeholder="Otel adını yazın..."
                    value={filters.hotelName || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, hotelName: e.target.value || undefined });
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
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
                          {hotels.filter((h) => h.stars === star).length}
                        </span>
                      </button>
                    ))}
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
                              {getCountryName(country)}
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

                {/* Destination/Bölge Filtresi */}
                {destinations && destinations.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-3 block">
                      🌍 Bölge/Destinasyon
                      {filters.destinations && filters.destinations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.destinations.length}</Badge>
                      )}
                    </label>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-3">
                        {destinations.map((dest) => (
                          <div key={dest.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`destination-${dest.id}`}
                              checked={filters.destinations?.includes(dest.id) || false}
                              onCheckedChange={() => toggleDestinationFilter(dest.id)}
                            />
                            <Label
                              htmlFor={`destination-${dest.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {dest.name}
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

                {/* Resort Filtresi - DISABLED: Too much data (34k+) */}
                {/* {resorts.length > 0 && (
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
                )} */}

                {/* Oda Tipi Filtresi - DISABLED: Too much data (184k+) */}
                {/* {roomTypes.length > 0 && (
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
                )} */}
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
                // Loading State - Geliştirilmiş versiyon
                <div className="space-y-4">
                  {/* Loading Message Card */}
                  <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                        {loadingMessage || 'Oteller aranıyor...'}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        {retryCount > 0 ? `Deneme: ${retryCount + 1}` : 'Sunhotels veritabanında arama yapılıyor'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Bu işlem 30-45 saniye sürebilir
                      </p>
                    </div>
                  </Card>
                  {/* Skeleton Cards */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-6 opacity-50">
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
                  ))}
                </div>
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
                  <HotelCard 
                    key={hotel.hotelId || `hotel-${Math.random()}`} 
                    hotel={hotel} 
                  />
                ))
              )}
            </div>

            {/* Pagination - Removed: Backend doesn't support pagination yet */}
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
