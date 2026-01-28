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

// Hotel Detail API Response Types (New Format)
export interface HotelContact {
  address: string;
  city: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  website: string;
}

export interface HotelResort {
  id: number;
  name: string;
}

export interface HotelDestination {
  id: string;
  name: string;
}

export interface HotelLocation {
  latitude: number;
  longitude: number;
  destination?: HotelDestination;
  resort: HotelResort;
  giataCode: string;
}

export interface HotelPricing {
  minPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
}

export interface HotelReviews {
  score: number;
  count: number;
  rating: string;
}

export interface HotelFeature {
  id: number;
  name: string;
}

export interface HotelTheme {
  id: number;
  name: string;
}

export interface HotelDetail {
  hotelId: number;  // SunHotels hotel ID
  name: string;
  description: string;
  category: number;
  stars: number;
  contact: HotelContact;
  location: HotelLocation;
  images: string[];
  pricing: HotelPricing;
  reviews: HotelReviews;
  features: HotelFeature[];
  themes: HotelTheme[];
  totalRooms: number;
}

export interface RoomPrice {
  total: number;
  perNight: number;
  currency: string;
  nights: number;
}

export interface RoomPricing {
  originalPrice: number;
  currentPrice: number;
  discount: number;
  discountPercentage: number;
}

export interface RoomAvailability {
  availableRooms: number;
  isAvailable: boolean;
}

export interface RoomCancellationPolicy {
  fromDate: string;
  percentage: number;
  fixedAmount: number | null;
  nightsCharged: number;
}

export interface RoomPolicies {
  isRefundable: boolean;
  isSuperDeal: boolean;
  cancellationPolicies: RoomCancellationPolicy[];
  earliestFreeCancellation: string;
}

export interface HotelRoom {
  roomId: number;
  roomTypeId: number;
  roomTypeName: string;
  name: string;
  description: string;
  images: string[];
  mealId: number;
  mealName: string;
  price: RoomPrice;
  pricing: RoomPricing;
  availability: RoomAvailability;
  policies: RoomPolicies;
  paymentMethods: number[];
}

export interface RoomsAvailability {
  hasAvailableRooms: boolean;
  totalAvailableRooms: number;
}

export interface HotelDetailApiResponse {
  hotel: HotelDetail;
  rooms: HotelRoom[];
  availability: RoomsAvailability;
}
