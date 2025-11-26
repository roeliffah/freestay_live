'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { sunHotelsClient } from '@/lib/sunhotels/client';
import type { Hotel } from '@/lib/sunhotels/types';
import { HotelCard } from '@/components/hotel/HotelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, Star, MapPin } from 'lucide-react';

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
  const [isFromAPI, setIsFromAPI] = useState(true); // Track if results are from API or fallback
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
        const type = searchParams.get('type') || '';
        const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
        const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
        const adults = parseInt(searchParams.get('adults') || '2');
        const children = parseInt(searchParams.get('children') || '0');

        console.log('🔍 Search Parameters:', { destination, destinationId, checkIn, checkOut });

        // Try live API with destinationID (priority) or destination name
        const response = await sunHotelsClient.searchHotels({
          checkIn,
          checkOut,
          nationality: 'TR',
          currency: 'EUR',
          language: locale.toLowerCase(),
          destinationId: destinationId || undefined,
          destination: !destinationId && destination ? destination : undefined,
          type: type || undefined,
          rooms: [{ adult: adults, child: children }],
        });
        
        // If API returns hotels, use them
        // Otherwise, response.hotels will already contain mock/fallback data
        setHotels(response.hotels);
        setIsFromAPI(response.isFromAPI !== false); // Default to true if not specified
      } catch (error) {
        console.error('Otel arama hatası:', error);
        setHotels([]);
        setIsFromAPI(false);
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
          ? a.hotelName.localeCompare(b.hotelName)
          : b.hotelName.localeCompare(a.hotelName);
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
          <h1 className="text-3xl font-bold mb-2">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {filteredAndSortedHotels.length} {t('hotelsFound')}
            {searchParams.get('destination') && ` - ${searchParams.get('destination')}`}
          </p>
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
              {/* Fallback Notice - Show when using mock data */}
              {!loading && !isFromAPI && hotels.length > 0 && (
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">ℹ️</div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t('noResultsFromApi')}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('featuredHotelsInfo')}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        💎 {t('checkFeaturedHotels')}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

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
