'use client';

import { useState, useCallback } from 'react';
import { api, Booking, BookingRequest, PaginatedResponse } from '@/lib/api';

interface UseBookingsResult {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  loadBookings: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useBookings = (): UseBookingsResult => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const loadBookings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bookings.getMyBookings(page, 10);
      const data = response.data as PaginatedResponse<Booking>;
      
      if (page === 1) {
        setBookings(data.data);
      } else {
        setBookings((prev) => [...prev, ...data.data]);
      }
      
      setPagination({
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (pagination.page >= pagination.totalPages) return;
    await loadBookings(pagination.page + 1);
  }, [pagination.page, pagination.totalPages, loadBookings]);

  return {
    bookings,
    isLoading,
    error,
    pagination,
    loadBookings,
    loadMore,
  };
};

interface UseBookingDetailResult {
  booking: Booking | null;
  isLoading: boolean;
  error: string | null;
  loadBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<boolean>;
  downloadVoucher: (id: string) => Promise<void>;
}

export const useBookingDetail = (): UseBookingDetailResult => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBooking = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bookings.getById(id);
      setBooking(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bookings.cancel(id);
      setBooking(response.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadVoucher = useCallback(async (id: string) => {
    try {
      const blob = await api.bookings.downloadVoucher(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download voucher');
    }
  }, []);

  return {
    booking,
    isLoading,
    error,
    loadBooking,
    cancelBooking,
    downloadVoucher,
  };
};

interface UseCreateBookingResult {
  isLoading: boolean;
  error: string | null;
  createBooking: (data: BookingRequest) => Promise<Booking | null>;
  validateCoupon: (code: string, amount: number, type: 'hotel' | 'flight' | 'car') => Promise<{
    valid: boolean;
    discountAmount?: number;
    finalAmount?: number;
    message?: string;
  }>;
}

export const useCreateBooking = (): UseCreateBookingResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCallback(async (data: BookingRequest): Promise<Booking | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.bookings.create(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(
    async (code: string, amount: number, type: 'hotel' | 'flight' | 'car') => {
      try {
        const response = await api.coupons.validate(code, amount, type);
        const data = response.data;
        
        if (data.valid && data.coupon) {
          return {
            valid: true,
            discountAmount: data.coupon.discountAmount,
            finalAmount: data.coupon.finalAmount,
          };
        }
        
        return {
          valid: false,
          message: data.message || 'Invalid coupon',
        };
      } catch (err) {
        return {
          valid: false,
          message: err instanceof Error ? err.message : 'Failed to validate coupon',
        };
      }
    },
    []
  );

  return {
    isLoading,
    error,
    createBooking,
    validateCoupon,
  };
};
