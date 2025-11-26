// SunHotels API için TypeScript tip tanımlamaları

export interface SearchRequest {
  username: string;
  password: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nationality: string;
  currency: string;
  language: string;
  rooms: RoomRequest[];
  destination?: string;
  hotelId?: string;
}

export interface RoomRequest {
  adults: number;
  children: number;
  childAges?: number[];
}

export interface Hotel {
  id: string;
  name: string;
  category: number; // Yıldız sayısı
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  facilities: string[];
  rating?: number;
  reviewCount?: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  bedType: string;
  roomSize?: number;
  features: string[];
  images: string[];
}

export interface RoomOffer {
  id: string;
  roomId: string;
  roomName: string;
  boardType: string; // BB, HB, FB, AI
  boardTypeDescription: string;
  price: number;
  currency: string;
  available: boolean;
  cancellationPolicy: string;
  specialOffers?: string[];
}

export interface HotelSearchResult {
  hotel: Hotel;
  minPrice: number;
  currency: string;
  available: boolean;
  roomOffers: RoomOffer[];
}

export interface BookingRequest {
  offerId: string;
  hotelId: string;
  guests: Guest[];
  contactInfo: ContactInfo;
}

export interface Guest {
  firstName: string;
  lastName: string;
  age?: number;
  roomNumber: number;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface BookingResponse {
  bookingId: string;
  status: string;
  confirmationNumber: string;
  totalPrice: number;
  currency: string;
}

export interface SearchFilters {
  priceRange?: [number, number];
  starRating?: number[];
  facilities?: string[];
  boardTypes?: string[];
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}
