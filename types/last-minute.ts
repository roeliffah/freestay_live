export interface LastMinuteRoom {
  id: number;
  name: string;
  roomType: string;
  mealType: string;
  price: number;
  availableRooms: number;
  isRefundable: boolean;
  isSuperDeal: boolean;
}

export interface LastMinuteHotel {
  id: number;
  name: string;
  description: string;
  stars: number;
  city: string;
  country: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  minPrice: number;
  currency: string;
  reviewScore: number | null;
  reviewCount: number | null;
  rooms: LastMinuteRoom[];
  lastMinuteCheckIn: string;
  lastMinuteCheckOut: string;
  destinationId?: string | number;
  resortId?: number;
}

export interface LastMinuteResponse {
  hotels: LastMinuteHotel[];
  total: number;
  isLastMinute: boolean;
  checkIn: string;
  checkOut: string;
  title: string;
  subtitle: string;
  badgeText: string;
  language: string;
}
