'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { sunhotelsAPI } from '@/lib/api/client';
import { HotelCard } from '@/components/hotel/HotelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, Star, MapPin } from 'lucide-react';

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
  giataCode: string;
  resortId: number;
  resortName: string;
  minPrice: number;
  currency: string;
  reviewScore?: number;
  reviewCount?: number;
  images: Array<{ url: string; order: number }>;
  rooms: Array<any>;
  featureIds: number[];
  themeIds: number[];
}

interface Filters {
  priceRange?: [number, number];
  starRating?: number[];
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

function SearchPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('search');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'static' | 'realtime'>('static');
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'price',
    sortOrder: 'asc',
  });

  useEffect(() => {
    const loadHotels = async () => {
      setLoading(true);
      try {
        // Get search parameters
        const destination = searchParams.get('destination') || '';
        const destinationId = searchParams.get('destinationId') || '';
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');
        const mode = searchParams.get('mode') as 'static' | 'realtime' || 'static';
        const adults = parseInt(searchParams.get('adults') || '2');
        const children = parseInt(searchParams.get('children') || '0');

        setSearchMode(mode);
        console.log('🔍 Search Mode:', mode);
        console.log('🔍 Search Parameters:', { destination, destinationId, checkIn, checkOut, adults, children });

        // 2 AŞAMALI STRATEJİ
        if (mode === 'static' || !checkIn || !checkOut) {
          // STATIC SEARCH - Tarih yok, DB'den statik otel listesi
          console.log('📦 Static search - loading from database');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/hotels/static?` +
            new URLSearchParams({
              destination: destination || '',
              destinationId: destinationId || '',
              limit: '100'
            }).toString()
          );
          
          if (response.ok) {
            const result = await response.json();
            const staticHotels = result.data || result;
            console.log('✅ Static hotels loaded:', staticHotels.length);
            setHotels(Array.isArray(staticHotels) ? staticHotels : []);
          } else {
            console.error('❌ Static search failed:', response.status);
            setHotels([]);
          }
        } else {
          // REAL-TIME SEARCH - Tarih var, SunHotels API'den güncel fiyat/müsaitlik
          console.log('⚡ Real-time search - querying SunHotels API');
          const results = await sunhotelsAPI.search({
            destinationId: destinationId || undefined,
            destination: !destinationId && destination ? destination : undefined,
            checkIn,
            checkOut,
            numberOfRooms: 1,
            adults,
            children: children || 0,
            currency: 'EUR',
            language: locale.toLowerCase(),
            customerCountry: 'TR',
            b2C: true,
          }) as Hotel[];
          
          console.log('✅ Real-time search results:', results.length);
          setHotels(Array.isArray(results) ? results : []);
        }
      } catch (error) {
        console.error('❌ Hotel search error:', error);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, [searchParams, locale]);

  const filteredAndSortedHotels = hotels
    .filter((hotel) => {
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        const price = hotel.minPrice || 0;
        if (price < min || price > max) return false;
      }
      if (filters.starRating && filters.starRating.length > 0) {
        if (!filters.starRating.includes(hotel.category)) return false;
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

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {t('title')}
            </h1>
            {searchMode === 'static' ? (
              <Badge variant="secondary" className="text-xs">
                📦 {t('staticMode')}
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-600">
                ⚡ {t('realtimeMode')}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {filteredAndSortedHotels.length} {t('hotelsFound')}
            {searchParams.get('destination') && ` - ${searchParams.get('destination')}`}
          </p>
          {searchMode === 'static' && (
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
              <h2 className="font-bold text-lg mb-4">{t('filters')}</h2>

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

              {/* Fiyat Aralığı */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">{t('priceRange')}</label>
                <div className="space-y-2">
                  <Button
                    variant={!filters.priceRange ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setFilters({ ...filters, priceRange: undefined })}
                  >
                    {t('all')}
                  </Button>
                  <Button
                    variant={
                      JSON.stringify(filters.priceRange) === JSON.stringify([0, 1000])
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() => setFilters({ ...filters, priceRange: [0, 1000] })}
                  >
                    {t('priceRanges.budget')}
                  </Button>
                  <Button
                    variant={
                      JSON.stringify(filters.priceRange) === JSON.stringify([1000, 2000])
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() => setFilters({ ...filters, priceRange: [1000, 2000] })}
                  >
                    {t('priceRanges.mid')}
                  </Button>
                  <Button
                    variant={
                      JSON.stringify(filters.priceRange) === JSON.stringify([2000, 5000])
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() => setFilters({ ...filters, priceRange: [2000, 5000] })}
                  >
                    {t('priceRanges.high')}
                  </Button>
                  <Button
                    variant={
                      JSON.stringify(filters.priceRange) === JSON.stringify([5000, 999999])
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() => setFilters({ ...filters, priceRange: [5000, 999999] })}
                  >
                    {t('priceRanges.luxury')}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilters({
                    sortBy: 'price',
                    sortOrder: 'asc',
                  });
                }}
              >
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
              {(filters.starRating?.length || filters.priceRange) && (
                <Badge className="ml-2" variant="secondary">
                  Aktif
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
