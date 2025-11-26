'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Users, Search, MapPin, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useSearchStore } from '@/store/searchStore';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import destinationsData from '@/data/destinations.json';
import featuredDestinations from '@/data/featured-destinations.json';

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home.search');
  const { searchParams, setSearchParams } = useSearchStore();
  
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [rooms, setRooms] = useState([{ adults: 2, children: 0 }]);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);

  // Filter destinations based on search input (prioritize featured destinations)
  const filteredDestinations = useMemo(() => {
    if (!destination || destination.length < 2) return [];
    const search = destination.toLowerCase();
    
    // First show featured destinations
    const featured = featuredDestinations.all.filter(d => 
      d.name.toLowerCase().includes(search) || 
      d.country.toLowerCase().includes(search)
    );
    
    // Then other destinations if needed
    const others = destinationsData.all
      .filter(d => 
        !featured.find(f => f.id === d.id) &&
        (d.name.toLowerCase().includes(search) || 
         d.country.toLowerCase().includes(search))
      )
      .slice(0, 5);
    
    return [...featured, ...others].slice(0, 8);
  }, [destination]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      alert(t('selectDate'));
      return;
    }

    setSearchParams({
      destination,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      rooms,
    });

    router.push(`/${locale}/search`);
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
    <Card className="p-6 shadow-xl bg-background/95 backdrop-blur">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destinasyon */}
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
            {showDestinations && filteredDestinations.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setDestination(dest.name);
                      setShowDestinations(false);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{dest.name}</div>
                      <div className="text-xs text-muted-foreground">{dest.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Giriş Tarihi */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('checkIn')}</label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, 'dd MMM yyyy', { locale: tr }) : t('selectDate')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-auto p-0">
              <DialogTitle className="sr-only">{t('checkIn')}</DialogTitle>
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Çıkış Tarihi */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('checkOut')}</label>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, 'dd MMM yyyy', { locale: tr }) : t('selectDate')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-auto p-0">
              <DialogTitle className="sr-only">{t('checkOut')}</DialogTitle>
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Misafir Sayısı */}
        <div>
          <label className="text-sm font-medium mb-2 block">{t('guests')}</label>
          <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Users className="mr-2 h-4 w-4" />
                {rooms.length} Oda, {totalGuests} Misafir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Oda ve Misafir Sayısı</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {rooms.map((room, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Oda {index + 1}</h4>
                      {rooms.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoom(index)}
                        >
                          Kaldır
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Yetişkin</span>
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
                        <span className="text-sm">Çocuk (0-12 yaş)</span>
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
                    Oda Ekle
                  </Button>
                )}

                <Button
                  className="w-full"
                  onClick={() => setShowGuestDialog(false)}
                >
                  Tamam
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
    </Card>
  );
}
