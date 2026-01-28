'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Building2, ChevronDown, Search, X } from 'lucide-react';

interface Destination {
  destinationId: number;
  name: string;
  countryName: string;
}

interface Resort {
  resortId: number;
  resortName: string;
  destinationId: number;
}

interface StickySearchBarProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialDestinationId?: number;
  initialDestinationName?: string;
  initialResortId?: number;
  initialResortName?: string;
  onUpdate?: (params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    destinationId?: number;
    resortId?: number;
  }) => void;
  locale: string;
  currentPath?: string; // For updating URL
}

export function StickySearchBar({
  initialCheckIn,
  initialCheckOut,
  initialAdults = 1,
  initialChildren = 0,
  initialDestinationId,
  initialDestinationName,
  initialResortId,
  initialResortName,
  onUpdate,
  locale,
  currentPath,
}: StickySearchBarProps) {
  const t = useTranslations('hotelDetail');
  const tSearch = useTranslations('search');
  const router = useRouter();

  // Default dates: check-in 7 days from now, check-out 14 days from now
  const getDefaultCheckIn = () => {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  const getDefaultCheckOut = () => {
    const date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  const [searchCheckIn, setSearchCheckIn] = useState(
    initialCheckIn || getDefaultCheckIn()
  );
  const [searchCheckOut, setSearchCheckOut] = useState(
    initialCheckOut || getDefaultCheckOut()
  );
  const [searchAdults, setSearchAdults] = useState(initialAdults);
  const [searchChildren, setSearchChildren] = useState(initialChildren);

  // Destination state
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(
    initialDestinationId && initialDestinationName 
      ? { destinationId: initialDestinationId, name: initialDestinationName, countryName: '' }
      : null
  );
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Resort state
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [selectedResort, setSelectedResort] = useState<Resort | null>(
    initialResortId && initialResortName 
      ? { resortId: initialResortId, resortName: initialResortName, destinationId: initialDestinationId || 0 }
      : null
  );
  const [showResortDropdown, setShowResortDropdown] = useState(false);
  const [loadingResorts, setLoadingResorts] = useState(false);

  const destinationRef = useRef<HTMLDivElement>(null);
  const resortRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
      if (resortRef.current && !resortRef.current.contains(event.target as Node)) {
        setShowResortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch destinations
  useEffect(() => {
    if (destinationSearch.length >= 2) {
      setLoadingDestinations(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5240';
      fetch(`${apiUrl}/sunhotels/destinations/search?query=${encodeURIComponent(destinationSearch)}&language=${locale}`)
        .then(res => res.json())
        .then(data => {
          setDestinations(data.data || []);
          setShowDestinationDropdown(true);
        })
        .catch(() => setDestinations([]))
        .finally(() => setLoadingDestinations(false));
    } else {
      setDestinations([]);
    }
  }, [destinationSearch, locale]);

  // Fetch resorts when destination changes
  useEffect(() => {
    if (selectedDestination) {
      setLoadingResorts(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5240';
      fetch(`${apiUrl}/sunhotels/resorts/by-destination/${selectedDestination.destinationId}?language=${locale}`)
        .then(res => res.json())
        .then(data => {
          setResorts(data.data || []);
        })
        .catch(() => setResorts([]))
        .finally(() => setLoadingResorts(false));
    } else {
      setResorts([]);
      setSelectedResort(null);
    }
  }, [selectedDestination, locale]);

  // Update state when props change
  useEffect(() => {
    if (initialCheckIn) setSearchCheckIn(initialCheckIn);
    if (initialCheckOut) setSearchCheckOut(initialCheckOut);
    if (initialAdults !== undefined) setSearchAdults(initialAdults);
    if (initialChildren !== undefined) setSearchChildren(initialChildren);
  }, [initialCheckIn, initialCheckOut, initialAdults, initialChildren]);

  const handleSearchUpdate = () => {
    const params = {
      checkIn: searchCheckIn,
      checkOut: searchCheckOut,
      adults: searchAdults,
      children: searchChildren,
      destinationId: selectedDestination?.destinationId,
      resortId: selectedResort?.resortId,
    };

    if (onUpdate) {
      onUpdate(params);
    }

    // If currentPath is provided, update URL
    if (currentPath) {
      const searchParams = new URLSearchParams();
      searchParams.set('checkIn', searchCheckIn);
      searchParams.set('checkOut', searchCheckOut);
      searchParams.set('adults', searchAdults.toString());
      searchParams.set('children', searchChildren.toString());
      if (selectedDestination) {
        searchParams.set('destinationId', selectedDestination.destinationId.toString());
        searchParams.set('destinationName', selectedDestination.name);
      }
      if (selectedResort) {
        searchParams.set('resortId', selectedResort.resortId.toString());
        searchParams.set('resortName', selectedResort.resortName);
      }
      
      router.push(`${currentPath}?${searchParams.toString()}`);
    }
  };

  const clearDestination = () => {
    setSelectedDestination(null);
    setSelectedResort(null);
    setDestinationSearch('');
    setResorts([]);
  };

  return (
    <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          {/* Destination */}
          <div className="md:col-span-1 relative" ref={destinationRef}>
            <Label htmlFor="destination" className="text-xs font-medium mb-1 block">
              <MapPin className="inline w-3 h-3 mr-1" />
              {tSearch('destination') || 'Destinasyon'}
            </Label>
            <div className="relative">
              <Input
                id="destination"
                type="text"
                placeholder={tSearch('selectDestination') || 'Destinasyon ara...'}
                value={selectedDestination ? selectedDestination.name : destinationSearch}
                onChange={(e) => {
                  setDestinationSearch(e.target.value);
                  if (selectedDestination) {
                    setSelectedDestination(null);
                    setSelectedResort(null);
                  }
                }}
                onFocus={() => destinationSearch.length >= 2 && setShowDestinationDropdown(true)}
                className="w-full pr-8 text-sm"
              />
              {selectedDestination && (
                <button
                  type="button"
                  onClick={clearDestination}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showDestinationDropdown && destinations.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {loadingDestinations ? (
                  <div className="p-2 text-center text-gray-500 text-sm">Yükleniyor...</div>
                ) : (
                  destinations.map((dest) => (
                    <button
                      key={dest.destinationId}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        setSelectedDestination(dest);
                        setShowDestinationDropdown(false);
                        setDestinationSearch('');
                      }}
                    >
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{dest.name}</span>
                      <span className="text-xs text-gray-400">({dest.countryName})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Resort */}
          <div className="md:col-span-1 relative" ref={resortRef}>
            <Label htmlFor="resort" className="text-xs font-medium mb-1 block">
              <Building2 className="inline w-3 h-3 mr-1" />
              {tSearch('resort') || 'Resort'}
            </Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => selectedDestination && setShowResortDropdown(!showResortDropdown)}
                disabled={!selectedDestination || loadingResorts}
                className={`w-full h-10 px-3 text-left text-sm border rounded-md flex items-center justify-between ${
                  !selectedDestination ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-gray-400'
                }`}
              >
                <span className="truncate">
                  {loadingResorts 
                    ? 'Yükleniyor...' 
                    : selectedResort 
                      ? selectedResort.resortName 
                      : (tSearch('selectResort') || 'Resort seçin')}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
              {selectedResort && (
                <button
                  type="button"
                  onClick={() => setSelectedResort(null)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showResortDropdown && resorts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {resorts.map((resort) => (
                  <button
                    key={resort.resortId}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setSelectedResort(resort);
                      setShowResortDropdown(false);
                    }}
                  >
                    <Building2 className="w-3 h-3 text-gray-400" />
                    <span>{resort.resortName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Check In */}
          <div className="md:col-span-1">
            <Label htmlFor="checkIn" className="text-xs font-medium mb-1 block">
              {t('checkIn')}
            </Label>
            <Input
              id="checkIn"
              type="date"
              value={searchCheckIn}
              onChange={(e) => setSearchCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="checkOut" className="text-xs font-medium mb-1 block">
              {t('checkOut')}
            </Label>
            <Input
              id="checkOut"
              type="date"
              value={searchCheckOut}
              onChange={(e) => setSearchCheckOut(e.target.value)}
              min={searchCheckIn}
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="adults" className="text-xs font-medium mb-1 block">
              {t('adults')}
            </Label>
            <Input
              id="adults"
              type="number"
              min={1}
              max={10}
              value={searchAdults}
              onChange={(e) => setSearchAdults(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="children" className="text-xs font-medium mb-1 block">
              {t('children')}
            </Label>
            <Input
              id="children"
              type="number"
              min={0}
              max={10}
              value={searchChildren}
              onChange={(e) => setSearchChildren(parseInt(e.target.value) || 0)}
              className="w-full"
            />
          </div>
          <div className="md:col-span-1">
            <Button
              onClick={handleSearchUpdate}
              className="w-full"
              size="default"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {t('updateSearch')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
