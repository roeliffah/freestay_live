'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, Search, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DatePicker } from 'antd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

import { useSearchStore } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { sunhotelsAPI } from '@/lib/api/client';

const { RangePicker } = DatePicker;

dayjs.locale('tr');

// Search result type - can be destination, resort, or hotel
type SearchResultType = 'destination' | 'resort' | 'hotel';

interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  // For destinations
  destinationId?: string | number;
  countryCode?: string;
  countryName?: string;
  resortCount?: number;
  // For resorts
  resortId?: number;
  destinationName?: string;
  // For hotels
  hotelId?: number;
  city?: string;
  country?: string;
  stars?: number;
}

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home.search');
  const { searchParams, setSearchParams } = useSearchStore();
  
  const [destination, setDestination] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [selectedResortId, setSelectedResortId] = useState<number | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<SearchResultType | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [rooms, setRooms] = useState([{ adults: 2, children: 0 }]);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (!destination || destination.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        // Paralel olarak destination, resort ve hotel ara
        const [destResponse, resortResponse, hotelResponse] = await Promise.all([
          sunhotelsAPI.searchDestinations(destination).catch(() => []),
          sunhotelsAPI.searchResorts(destination).catch(() => []),
          sunhotelsAPI.searchHotels(destination).catch(() => []),
        ]);

        const results: SearchResult[] = [];

        // Destinasyonları ekle
        const destData = destResponse as any;
        const destinations = Array.isArray(destResponse) ? destResponse : destData?.data || destData?.destinations || [];
        destinations.slice(0, 5).forEach((dest: any) => {
          results.push({
            id: `dest-${dest.id || dest.destinationId}`,
            type: 'destination',
            name: dest.name,
            destinationId: dest.destinationId || dest.id,
            countryCode: dest.countryCode,
            countryName: dest.countryName || dest.country,
            resortCount: dest.resortCount,
          });
        });

        // Resortları ekle
        const resortData = resortResponse as any;
        const resorts = Array.isArray(resortResponse) ? resortResponse : resortData?.data || [];
        resorts.slice(0, 5).forEach((resort: any) => {
          results.push({
            id: `resort-${resort.id || resort.resortId}`,
            type: 'resort',
            name: resort.name,
            resortId: resort.resortId || resort.id,
            destinationName: resort.destinationName,
            countryName: resort.countryName || resort.country,
          });
        });

        // Otelleri ekle
        const hotelData = hotelResponse as any;
        const hotels = Array.isArray(hotelResponse) ? hotelResponse : hotelData?.data || [];
        hotels.slice(0, 5).forEach((hotel: any) => {
          results.push({
            id: `hotel-${hotel.id || hotel.hotelId}`,
            type: 'hotel',
            name: hotel.name,
            hotelId: hotel.hotelId || hotel.id,
            city: hotel.city,
            country: hotel.country,
            stars: hotel.category || hotel.stars,
          });
        });

        setSearchResults(results);
      } catch (error) {
        console.error('❌ Arama hatası:', error);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination]);

  const handleSearch = () => {
    const searchUrl = new URLSearchParams({
      destination,
      adults: rooms.reduce((sum, room) => sum + room.adults, 0).toString(),
      children: rooms.reduce((sum, room) => sum + room.children, 0).toString(),
    });

    if (dateRange && dateRange[0] && dateRange[1]) {
      // Tutarlılık için checkIn/checkOut kullan (hotel detay sayfasıyla uyumlu)
      searchUrl.append('checkIn', dateRange[0].format('YYYY-MM-DD'));
      searchUrl.append('checkOut', dateRange[1].format('YYYY-MM-DD'));
      searchUrl.append('mode', 'realtime');
    } else {
      searchUrl.append('mode', 'static');
    }

    // Seçilen tipe göre uygun parametre ekle
    if (selectedType === 'hotel' && selectedHotelId) {
      searchUrl.append('hotelId', selectedHotelId.toString());
    } else if (selectedType === 'resort' && selectedResortId) {
      searchUrl.append('resortId', selectedResortId.toString());
      if (selectedDestinationId) {
        searchUrl.append('destinationId', selectedDestinationId.toString());
      }
    } else if (selectedDestinationId) {
      searchUrl.append('destinationId', selectedDestinationId.toString());
    }

    setSearchParams({
      destination,
      checkIn: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
      checkOut: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
      rooms,
    });

    router.push(`/${locale}/search?${searchUrl.toString()}`);
  };
  const addRoom = () => {
    if (rooms.length < 5) {
      setRooms([...rooms, { adults: 2, children: 0 }]);
    }
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index: number, field: 'adults' | 'children', value: number) => {
    const newRooms = [...rooms];
    newRooms[index][field] = Math.max(0, value);
    setRooms(newRooms);
  };

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.children, 0);

  return (
    <div className="w-full">
      <Card className="p-6 shadow-xl bg-background/95 backdrop-blur">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Destination / Hotel / Resort */}
          <div className="relative">
            <label className="text-sm font-medium mb-2 block">{t('where')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <Input
                placeholder={t('wherePlaceholder')}
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  // Reset selections when typing
                  setSelectedDestinationId(null);
                  setSelectedResortId(null);
                  setSelectedHotelId(null);
                  setSelectedType(null);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="pl-10"
              />
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-72 overflow-auto">
                  {/* Destinasyonlar */}
                  {searchResults.filter(r => r.type === 'destination').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                        📍 {t('destinations') || 'Destinations'}
                      </div>
                      {searchResults.filter(r => r.type === 'destination').map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                          onClick={() => {
                            setDestination(result.name);
                            setSelectedDestinationId(Number(result.destinationId));
                            setSelectedResortId(null);
                            setSelectedHotelId(null);
                            setSelectedType('destination');
                            setShowResults(false);
                          }}
                        >
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-sm">{result.name}</div>
                            {result.countryName && (
                              <div className="text-xs text-muted-foreground">
                                {result.countryName} {result.resortCount ? `• ${result.resortCount} resort` : ''}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Resortlar */}
                  {searchResults.filter(r => r.type === 'resort').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
                        🏖️ {t('resorts') || 'Resorts'}
                      </div>
                      {searchResults.filter(r => r.type === 'resort').map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                          onClick={() => {
                            setDestination(result.name);
                            setSelectedResortId(result.resortId || null);
                            setSelectedDestinationId(null);
                            setSelectedHotelId(null);
                            setSelectedType('resort');
                            setShowResults(false);
                          }}
                        >
                          <MapPin className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium text-sm">{result.name}</div>
                            {(result.destinationName || result.countryName) && (
                              <div className="text-xs text-muted-foreground">
                                {result.destinationName || result.countryName}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {/* Oteller */}
                  {searchResults.filter(r => r.type === 'hotel').length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-t">
                        🏨 {t('hotels') || 'Hotels'}
                      </div>
                      {searchResults.filter(r => r.type === 'hotel').map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                          onClick={() => {
                            setDestination(result.name);
                            setSelectedHotelId(result.hotelId || null);
                            setSelectedDestinationId(null);
                            setSelectedResortId(null);
                            setSelectedType('hotel');
                            setShowResults(false);
                          }}
                        >
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium text-sm">{result.name}</div>
                            {(result.city || result.country) && (
                              <div className="text-xs text-muted-foreground">
                                {result.city && result.country ? `${result.city}, ${result.country}` : result.city || result.country}
                                {result.stars && ` • ${'★'.repeat(result.stars)}`}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
              {showResults && loadingSearch && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                  {t('searching')}
                </div>
              )}
            </div>
          </div>

          {/* Date Range Picker - Ant Design */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">{t('checkIn')} - {t('checkOut')}</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              format="DD MMM YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              className="w-full h-10"
              placeholder={[t('selectDate'), t('selectDate')]}
            />
          </div>

          {/* Guest Count */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('guests')}</label>
            <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Users className="mr-2 h-4 w-4" />
                  {rooms.length} {t('room')}, {totalGuests} {t('guest')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('selectGuests')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {rooms.map((room, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">{t('room')} {index + 1}</h4>
                        {rooms.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeRoom(index)}>
                            Sil
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('adults')}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateRoom(index, 'adults', room.adults - 1)}
                              disabled={room.adults <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{room.adults}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateRoom(index, 'adults', room.adults + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('children')}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateRoom(index, 'children', room.children - 1)}
                              disabled={room.children <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{room.children}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateRoom(index, 'children', room.children + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rooms.length < 5 && (
                    <Button variant="outline" className="w-full" onClick={addRoom}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addRoom')}
                    </Button>
                  )}
                  <Button className="w-full" onClick={() => setShowGuestDialog(false)}>
                    {t('done')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full md:w-auto mt-6"
          onClick={handleSearch}
          disabled={!destination}
        >
          <Search className="mr-2 h-5 w-5" />
          {t('searchButton')}
        </Button>
      </Card>

      {/* Feature Badges - App.js'den esinlenerek */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="p-4 border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">{t('badges.freeRoom')}</h3>
              <p className="text-xs text-muted-foreground">{t('badges.freeRoomDesc')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">{t('badges.discount')}</h3>
              <p className="text-xs text-muted-foreground">{t('badges.discountDesc')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">{t('badges.guarantee')}</h3>
              <p className="text-xs text-muted-foreground">{t('badges.guaranteeDesc')}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

