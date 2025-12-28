'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr as dateTr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, Search, MapPin, Plus, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DateRange } from 'react-day-picker';

import { useSearchStore } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { sunhotelsAPI } from '@/lib/api/client';

interface Destination {
  id: number;
  name: string;
  countryCode?: string;
  countryName?: string;
  resortCount?: number;
}

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home.search');
  const { searchParams, setSearchParams } = useSearchStore();
  
  const [destination, setDestination] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [rooms, setRooms] = useState([{ adults: 2, children: 0 }]);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Debounced destination search - Backend SunHotels API kullanıyor
  useEffect(() => {
    if (!destination || destination.length < 2) {
      setDestinations([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDestinations(true);
      try {
        const results = await sunhotelsAPI.searchDestinations(destination) as Destination[];
        setDestinations(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('❌ Destinasyon arama hatası:', error);
        setDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination]);

  const handleSearch = () => {
    // Tarih opsiyonel - yoksa static search, varsa real-time search
    const searchUrl = new URLSearchParams({
      destination,
      adults: rooms.reduce((sum, room) => sum + room.adults, 0).toString(),
      children: rooms.reduce((sum, room) => sum + room.children, 0).toString(),
    });

    // Tarihler varsa ekle (real-time search için)
    if (dateRange?.from && dateRange?.to) {
      searchUrl.append('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
      searchUrl.append('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
      searchUrl.append('mode', 'realtime');
    } else {
      searchUrl.append('mode', 'static');
    }

    if (selectedDestinationId) {
      searchUrl.append('destinationId', selectedDestinationId.toString());
    }

    setSearchParams({
      destination,
      checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
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

  const formatDateRange = () => {
    if (!dateRange?.from) return t('selectDate');
    if (!dateRange.to) return format(dateRange.from, 'dd MMM yyyy', { locale: dateTr });
    return `${format(dateRange.from, 'dd MMM', { locale: dateTr })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: dateTr })}`;
  };

  return (
    <Card className="p-6 shadow-xl bg-background/95 backdrop-blur">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div className="relative">
          <label className="text-sm font-medium mb-2 block">{t('where')}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
            <Input
              placeholder={t('wherePlaceholder')}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onFocus={() => setShowDestinations(true)}
              onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
              className="pl-10"
            />
            
            {/* Autocomplete Dropdown */}
            {showDestinations && destinations.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                {destinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    onClick={() => {
                      setDestination(dest.name);
                      setSelectedDestinationId(dest.id);
                      setShowDestinations(false);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{dest.name}</div>
                      {dest.countryName && (
                        <div className="text-xs text-muted-foreground">
                          {dest.countryName} {dest.resortCount ? `• ${dest.resortCount} resort` : ''}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDestinations && loadingDestinations && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                {t('searching')}
              </div>
            )}
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">{t('checkIn')} - {t('checkOut')}</label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-auto p-0">
              <DialogTitle className="sr-only">{t('selectDate')}</DialogTitle>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </DialogContent>
          </Dialog>
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
                <DialogTitle>{t('roomsAndGuests')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {rooms.map((room, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{t('room')} {index + 1}</h4>
                      {rooms.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoom(index)}
                        >
                          {t('remove')}
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t('adults')}</span>
                        <div className="flex items-center space-x-2">
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
                            disabled={room.adults >= 6}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t('children')}</span>
                        <div className="flex items-center space-x-2">
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
                            disabled={room.children >= 4}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {rooms.length < 5 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addRoom}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('addRoom')}
                  </Button>
                )}

                <Button
                  className="w-full"
                  onClick={() => setShowGuestDialog(false)}
                >
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
      >
        <Search className="mr-2 h-5 w-5" />
        {t('searchButton')}
      </Button>

      {/* Info badge - tarih seçilmemişse göster */}
      {(!dateRange?.from || !dateRange?.to) && (
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-blue-900 dark:text-blue-100">
            {t('noDatesInfo')}
          </p>
        </div>
      )}
    </Card>
  );
}
