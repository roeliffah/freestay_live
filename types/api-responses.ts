/**
 * API Response Type Definitions
 * Based on Swagger documentation: http://localhost:5240/swagger/v1/swagger.json
 * 
 * Note: HotelDetailApiResponse is already defined in types/sunhotels.ts
 * This file contains additional API types for booking, checkout, and settings
 */

// Re-export hotel types from sunhotels.ts for convenience
export type { 
  HotelDetailApiResponse,
  HotelDetail,
  HotelRoom,
  RoomPrice,
  RoomPricing,
  RoomAvailability,
  RoomPolicies,
  HotelLocation,
  HotelContact,
  HotelPricing,
  HotelReviews
} from './sunhotels';

// ==================== Common Types ====================

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  message?: string;
}

// ==================== Booking Types ====================

export interface Guest {
  firstName: string;
  lastName: string;
}

export interface ChildGuest extends Guest {
  age: number;
}

export interface PreBookRequest {
  hotelId: number;
  roomId: number;
  roomTypeId: number;
  mealId: number;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  currency: string;
  language: string;
  customerCountry: string;
  b2C: boolean;
  searchPrice: number;
}

export interface PreBookResponse {
  preBookCode: string;
  totalPrice: number;
  currency: string;
  tax?: number;
  fees?: Array<{ name: string; amount: number }>;
  expiresAt: string;
  priceChanged: boolean;
  originalPrice?: number;
  message?: string;
}

export interface CheckoutRequest {
  hotelId: number;
  roomId: number;
  roomTypeId: number;
  mealId: number;
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  adults: number;
  children: number;
  childrenAges?: string;
  guestName: string;
  guestEmail: string;
  phone: string;
  specialRequests?: string;
  searchPrice: number;
  currency: string;
  isSuperDeal?: boolean;
  customerCountry?: string;
  preBookCode?: string;
  successUrl: string;
  cancelUrl: string;
}
