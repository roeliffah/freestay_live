'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';

interface StickySearchBarProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  onUpdate?: (params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => void;
  locale: string;
  currentPath?: string; // For updating URL
}

export function StickySearchBar({
  initialCheckIn,
  initialCheckOut,
  initialAdults = 1,
  initialChildren = 0,
  onUpdate,
  locale,
  currentPath,
}: StickySearchBarProps) {
  const t = useTranslations('hotelDetail');
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
      
      router.push(`${currentPath}?${searchParams.toString()}`);
    }
  };

  return (
    <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
