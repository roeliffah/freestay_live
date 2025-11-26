import { create } from 'zustand';
import { SearchRequest, SearchFilters } from '@/types/sunhotels';

interface SearchStore {
  searchParams: Partial<SearchRequest>;
  filters: SearchFilters;
  setSearchParams: (params: Partial<SearchRequest>) => void;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  searchParams: {
    checkIn: '',
    checkOut: '',
    nationality: 'TR',
    currency: 'EUR',
    language: 'en',
    rooms: [{ adults: 2, children: 0 }],
  },
  filters: {
    sortBy: 'price',
    sortOrder: 'asc',
  },
  setSearchParams: (params) =>
    set((state) => ({
      searchParams: { ...state.searchParams, ...params },
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () =>
    set({
      filters: {
        sortBy: 'price',
        sortOrder: 'asc',
      },
    }),
}));
