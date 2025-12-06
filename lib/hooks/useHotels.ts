'use client';

import { useState, useCallback } from 'react';
import { api, Hotel, Room, HotelSearchParams, PaginatedResponse } from '@/lib/api';

interface UseHotelSearchResult {
  hotels: Hotel[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  search: (params: HotelSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const useHotelSearch = (): UseHotelSearchResult => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [lastParams, setLastParams] = useState<HotelSearchParams | null>(null);

  const search = useCallback(async (params: HotelSearchParams) => {
    setIsLoading(true);
    setError(null);
    setLastParams(params);

    try {
      const response = await api.hotels.search({ ...params, page: 1 });
      const data = response.data as PaginatedResponse<Hotel>;
      setHotels(data.data);
      setPagination({
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastParams || pagination.page >= pagination.totalPages) return;

    setIsLoading(true);
    try {
      const response = await api.hotels.search({
        ...lastParams,
        page: pagination.page + 1,
      });
      const data = response.data as PaginatedResponse<Hotel>;
      setHotels((prev) => [...prev, ...data.data]);
      setPagination({
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoading(false);
    }
  }, [lastParams, pagination.page, pagination.totalPages]);

  const reset = useCallback(() => {
    setHotels([]);
    setError(null);
    setPagination({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
    setLastParams(null);
  }, []);

  return {
    hotels,
    isLoading,
    error,
    pagination,
    search,
    loadMore,
    reset,
  };
};

interface UseHotelDetailResult {
  hotel: Hotel | null;
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  loadHotel: (id: string) => Promise<void>;
  loadRooms: (id: string, checkIn: string, checkOut: string, guests: number) => Promise<void>;
}

export const useHotelDetail = (): UseHotelDetailResult => {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHotel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.hotels.getById(id);
      setHotel(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hotel');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRooms = useCallback(
    async (id: string, checkIn: string, checkOut: string, guests: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.hotels.getRooms(id, checkIn, checkOut, guests);
        setRooms(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rooms');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    hotel,
    rooms,
    isLoading,
    error,
    loadHotel,
    loadRooms,
  };
};

interface UseFeaturedHotelsResult {
  hotels: Hotel[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const useFeaturedHotels = (): UseFeaturedHotelsResult => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.hotels.getFeatured();
      setHotels(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load featured hotels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { hotels, isLoading, error, load };
};

interface PopularDestination {
  name: string;
  image: string;
  count: number;
}

interface UsePopularDestinationsResult {
  destinations: PopularDestination[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const usePopularDestinations = (): UsePopularDestinationsResult => {
  const [destinations, setDestinations] = useState<PopularDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.hotels.getPopularDestinations();
      setDestinations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load destinations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { destinations, isLoading, error, load };
};
