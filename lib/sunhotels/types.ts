// SunHotels API Types

export interface SearchRequest {
  checkIn: string;
  checkOut: string;
  nationality: string;
  currency?: string;
  language?: string;
  destination?: string;
  destinationId?: string;
  type?: string;
  rooms: Room[];
}

export interface Room {
  adult: number;
  child: number;
  childAges?: number[];
}

export interface Hotel {
  hotelId: string;
  hotelName: string;
  hotelCode: string;
  category: number;
  categoryName: string;
  destinationId: string;
  destinationName: string;
  regionId: string;
  regionName: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  images: HotelImage[];
  facilities: string[];
  description: string;
  checkInTime: string;
  checkOutTime: string;
  minPrice?: number;
  currency?: string;
}

export interface HotelImage {
  url: string;
  order: number;
  description?: string;
}

export interface RoomType {
  roomTypeId: string;
  roomTypeName: string;
  boardTypeId: string;
  boardTypeName: string;
  price: number;
  currency: string;
  available: number;
  description?: string;
  maxGuests: number;
}

export interface SearchResponse {
  hotels: Hotel[];
  total: number;
  searchId: string;
  isFromAPI?: boolean; // Flag to indicate if results are from live API or fallback
}

export interface HotelDetailResponse {
  hotel: Hotel;
  rooms: RoomType[];
}
