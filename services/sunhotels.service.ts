import axios from 'axios';
import { SearchRequest, HotelSearchResult, Hotel, BookingRequest, BookingResponse } from '@/types/sunhotels';

const API_BASE_URL = process.env.NEXT_PUBLIC_SUNHOTELS_API_URL || '';
const API_USERNAME = process.env.NEXT_PUBLIC_SUNHOTELS_USERNAME || '';
const API_PASSWORD = process.env.NEXT_PUBLIC_SUNHOTELS_PASSWORD || '';

// Mock data - Gerçek API entegrasyonu için placeholder
// İlerleyen aşamada .NET Core API üzerinden SunHotels XML API'ye bağlanılacak

export const searchHotels = async (searchParams: SearchRequest): Promise<HotelSearchResult[]> => {
  // Demo amaçlı mock data
  return generateMockHotels(searchParams);
};

export const getHotelDetails = async (hotelId: string): Promise<Hotel> => {
  // Demo amaçlı mock data
  return generateMockHotelDetail(hotelId);
};

export const createBooking = async (bookingRequest: BookingRequest): Promise<BookingResponse> => {
  // Demo amaçlı mock booking
  return {
    bookingId: `BK${Date.now()}`,
    status: 'confirmed',
    confirmationNumber: `CNF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    totalPrice: 0,
    currency: 'EUR',
  };
};

// Mock data generators
function generateMockHotels(searchParams: SearchRequest): HotelSearchResult[] {
  const mockHotels: HotelSearchResult[] = [
    {
      hotel: {
        id: 'HTL001',
        name: 'Grand Seaside Resort',
        category: 5,
        address: 'Lara Beach, Antalya',
        city: 'Antalya',
        country: 'Turkey',
        phone: '+90 242 xxx xxxx',
        email: 'info@grandseaside.com',
        description: 'Muhteşem deniz manzaralı lüks 5 yıldızlı tatil köyü. All-inclusive konsept, geniş plaj alanı ve zengin aktivite imkanları.',
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        ],
        latitude: 36.8685,
        longitude: 30.7153,
        facilities: ['Pool', 'Spa', 'Restaurant', 'WiFi', 'Gym', 'Beach', 'Parking'],
        rating: 4.7,
        reviewCount: 1243,
      },
      minPrice: 120,
      currency: 'EUR',
      available: true,
      roomOffers: [
        {
          id: 'OFF001',
          roomId: 'RM001',
          roomName: 'Deluxe Double Room',
          boardType: 'AI',
          boardTypeDescription: 'All Inclusive',
          price: 120,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 7 days before check-in',
          specialOffers: ['Early Booking -15%'],
        },
        {
          id: 'OFF002',
          roomId: 'RM002',
          roomName: 'Family Suite',
          boardType: 'AI',
          boardTypeDescription: 'All Inclusive',
          price: 180,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 7 days before check-in',
        },
      ],
    },
    {
      hotel: {
        id: 'HTL002',
        name: 'Boutique Hotel Kaleiçi',
        category: 4,
        address: 'Kaleiçi, Old Town',
        city: 'Antalya',
        country: 'Turkey',
        phone: '+90 242 xxx xxxx',
        email: 'info@boutiquehotel.com',
        description: 'Tarihi Kaleiçi\'nin kalbinde butik otel. Osmanlı mimarisi ve modern konfor bir arada.',
        images: [
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        ],
        latitude: 36.8839,
        longitude: 30.7047,
        facilities: ['Pool', 'Restaurant', 'WiFi', 'Air Conditioning'],
        rating: 4.5,
        reviewCount: 567,
      },
      minPrice: 85,
      currency: 'EUR',
      available: true,
      roomOffers: [
        {
          id: 'OFF003',
          roomId: 'RM003',
          roomName: 'Standard Room',
          boardType: 'BB',
          boardTypeDescription: 'Bed & Breakfast',
          price: 85,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 3 days before check-in',
        },
      ],
    },
    {
      hotel: {
        id: 'HTL003',
        name: 'Belek Golf & Spa Resort',
        category: 5,
        address: 'Belek Tourism Center',
        city: 'Antalya',
        country: 'Turkey',
        phone: '+90 242 xxx xxxx',
        email: 'info@belekresort.com',
        description: 'Premium golf oteli. Şampiyonluk seviyesi golf sahası, spa merkezi ve özel plaj.',
        images: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
          'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
        ],
        latitude: 36.8615,
        longitude: 31.0532,
        facilities: ['Golf', 'Spa', 'Pool', 'Restaurant', 'WiFi', 'Beach', 'Tennis', 'Gym'],
        rating: 4.8,
        reviewCount: 892,
      },
      minPrice: 200,
      currency: 'EUR',
      available: true,
      roomOffers: [
        {
          id: 'OFF004',
          roomId: 'RM004',
          roomName: 'Executive Room',
          boardType: 'HB',
          boardTypeDescription: 'Half Board',
          price: 200,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 14 days before check-in',
          specialOffers: ['Last Minute -20%', 'Free Golf'],
        },
      ],
    },
    {
      hotel: {
        id: 'HTL004',
        name: 'City Center Business Hotel',
        category: 4,
        address: 'Konyaaltı, City Center',
        city: 'Antalya',
        country: 'Turkey',
        phone: '+90 242 xxx xxxx',
        email: 'info@citycenter.com',
        description: 'Şehir merkezinde modern iş oteli. Konferans salonları ve metro erişimi.',
        images: [
          'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
        ],
        latitude: 36.8897,
        longitude: 30.6925,
        facilities: ['WiFi', 'Restaurant', 'Meeting Rooms', 'Parking', 'Gym'],
        rating: 4.3,
        reviewCount: 445,
      },
      minPrice: 75,
      currency: 'EUR',
      available: true,
      roomOffers: [
        {
          id: 'OFF005',
          roomId: 'RM005',
          roomName: 'Business Room',
          boardType: 'BB',
          boardTypeDescription: 'Bed & Breakfast',
          price: 75,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 1 day before check-in',
        },
      ],
    },
    {
      hotel: {
        id: 'HTL005',
        name: 'Luxury Marina Hotel',
        category: 5,
        address: 'Kemer Marina',
        city: 'Antalya',
        country: 'Turkey',
        phone: '+90 242 xxx xxxx',
        email: 'info@luxurymarina.com',
        description: 'Marina manzaralı ultra lüks otel. Yacht turları ve özel plaj hizmeti.',
        images: [
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
          'https://images.unsplash.com/photo-1598605384940-14d7c2c53530?w=800',
        ],
        latitude: 36.6000,
        longitude: 30.5590,
        facilities: ['Pool', 'Spa', 'Restaurant', 'WiFi', 'Beach', 'Marina', 'Yacht', 'Bar'],
        rating: 4.9,
        reviewCount: 678,
      },
      minPrice: 250,
      currency: 'EUR',
      available: true,
      roomOffers: [
        {
          id: 'OFF006',
          roomId: 'RM006',
          roomName: 'Marina View Suite',
          boardType: 'FB',
          boardTypeDescription: 'Full Board',
          price: 250,
          currency: 'EUR',
          available: true,
          cancellationPolicy: 'Free cancellation until 14 days before check-in',
          specialOffers: ['Honeymoon Package'],
        },
      ],
    },
  ];

  return mockHotels;
}

function generateMockHotelDetail(hotelId: string): Hotel {
  const mockHotels = generateMockHotels({} as SearchRequest);
  const found = mockHotels.find(h => h.hotel.id === hotelId);
  
  if (found) {
    return found.hotel;
  }

  // Default hotel
  return mockHotels[0].hotel;
}

// SunHotels API için yardımcı fonksiyonlar
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getBoardTypeLabel = (boardType: string): string => {
  const labels: Record<string, string> = {
    'RO': 'Room Only',
    'BB': 'Bed & Breakfast',
    'HB': 'Half Board',
    'FB': 'Full Board',
    'AI': 'All Inclusive',
    'UAI': 'Ultra All Inclusive',
  };
  return labels[boardType] || boardType;
};
