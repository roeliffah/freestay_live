// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1';

// Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff' | 'customer';
  avatar?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Hotel Types
export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children?: number;
  childrenAges?: number[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  stars: number;
  images: string[];
  amenities: string[];
  latitude: number;
  longitude: number;
  priceFrom: number;
  currency: string;
}

export interface Room {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  maxGuests: number;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  amenities: string[];
  mealPlan: string;
  cancellationPolicy: string;
  available: number;
}

// Booking Types
export interface BookingRequest {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    childrenAges?: number[];
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    nationality?: string;
  };
  specialRequests?: string;
  couponCode?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'hotel' | 'flight' | 'car';
  hotel?: {
    id: string;
    name: string;
    image: string;
  };
  room?: {
    id: string;
    name: string;
  };
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  currency: string;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: string;
}

// Coupon Types
export interface CouponValidation {
  valid: boolean;
  coupon?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
  };
  message?: string;
}

// Settings Types
export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  email: string;
  phone: string;
  address: string;
  defaultCurrency: string;
  defaultLocale: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage?: string;
}

// Translation Types
export type Translations = Record<string, string>;

// Static Page Types
export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

// API Error Handler
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || 'An error occurred',
      data.errors
    );
  }

  return data;
}

// API Service
export const api = {
  // Authentication
  auth: {
    login: (data: LoginRequest) =>
      fetchApi<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    register: (data: RegisterRequest) =>
      fetchApi<ApiResponse<{ user: User; tokens: AuthTokens }>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      fetchApi<ApiResponse<null>>('/auth/logout', { method: 'POST' }),

    refreshToken: (refreshToken: string) =>
      fetchApi<ApiResponse<AuthTokens>>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    forgotPassword: (email: string) =>
      fetchApi<ApiResponse<null>>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      fetchApi<ApiResponse<null>>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),

    me: () => fetchApi<ApiResponse<User>>('/auth/me'),

    updateProfile: (data: Partial<User>) =>
      fetchApi<ApiResponse<User>>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    changePassword: (currentPassword: string, newPassword: string) =>
      fetchApi<ApiResponse<null>>('/auth/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  // Hotels
  hotels: {
    search: (params: HotelSearchParams) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      return fetchApi<ApiResponse<PaginatedResponse<Hotel>>>(
        `/hotels/search?${searchParams.toString()}`
      );
    },

    getById: (id: string) =>
      fetchApi<ApiResponse<Hotel>>(`/hotels/${id}`),

    getRooms: (id: string, checkIn: string, checkOut: string, guests: number) =>
      fetchApi<ApiResponse<Room[]>>(
        `/hotels/${id}/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
      ),

    getReviews: (id: string, page = 1, pageSize = 10) =>
      fetchApi<ApiResponse<PaginatedResponse<any>>>(
        `/hotels/${id}/reviews?page=${page}&pageSize=${pageSize}`
      ),

    getFeatured: () =>
      fetchApi<ApiResponse<Hotel[]>>('/hotels/featured'),

    getPopularDestinations: () =>
      fetchApi<ApiResponse<{ name: string; image: string; count: number }[]>>(
        '/hotels/popular'
      ),
  },

  // Bookings
  bookings: {
    create: (data: BookingRequest) =>
      fetchApi<ApiResponse<Booking>>('/bookings/hotel', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMyBookings: (page = 1, pageSize = 10) =>
      fetchApi<ApiResponse<PaginatedResponse<Booking>>>(
        `/bookings?page=${page}&pageSize=${pageSize}`
      ),

    getById: (id: string) =>
      fetchApi<ApiResponse<Booking>>(`/bookings/${id}`),

    cancel: (id: string) =>
      fetchApi<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {
        method: 'PUT',
      }),

    downloadVoucher: async (id: string): Promise<Blob> => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/bookings/${id}/voucher`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download voucher');
      return response.blob();
    },
  },

  // Coupons
  coupons: {
    validate: (code: string, amount: number, type: 'hotel' | 'flight' | 'car') =>
      fetchApi<ApiResponse<CouponValidation>>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, amount, type }),
      }),
  },

  // Settings
  settings: {
    getSite: () =>
      fetchApi<ApiResponse<SiteSettings>>('/settings/site'),

    getSeo: (pageType: string, locale: string) =>
      fetchApi<ApiResponse<SeoSettings>>(
        `/settings/seo?page=${pageType}&locale=${locale}`
      ),
  },

  // Translations
  translations: {
    get: (locale: string) =>
      fetchApi<ApiResponse<Translations>>(`/translations/${locale}`),

    getByNamespace: (locale: string, namespace: string) =>
      fetchApi<ApiResponse<Translations>>(
        `/translations/${locale}/${namespace}`
      ),
  },

  // Static Pages
  pages: {
    getBySlug: (slug: string, locale: string) =>
      fetchApi<ApiResponse<StaticPage>>(`/pages/${slug}/${locale}`),
  },

  // Payments
  payments: {
    createIntent: (bookingId: string) =>
      fetchApi<ApiResponse<{ clientSecret: string }>>('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      }),

    confirm: (paymentIntentId: string) =>
      fetchApi<ApiResponse<{ success: boolean }>>('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      }),
  },
};

// Admin API
export const adminApi = {
  // Dashboard
  dashboard: {
    getStats: () =>
      fetchApi<ApiResponse<{
        totalBookings: number;
        totalRevenue: number;
        totalCustomers: number;
        commission: number;
        bookingsGrowth: number;
        revenueGrowth: number;
      }>>('/admin/dashboard/stats'),

    getRecentBookings: () =>
      fetchApi<ApiResponse<Booking[]>>('/admin/dashboard/recent-bookings'),

    getRevenueChart: (period: 'week' | 'month' | 'year') =>
      fetchApi<ApiResponse<{ date: string; amount: number }[]>>(
        `/admin/dashboard/revenue?period=${period}`
      ),
  },

  // Bookings
  bookings: {
    list: (params: { page?: number; status?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });
      return fetchApi<ApiResponse<PaginatedResponse<Booking>>>(
        `/admin/bookings?${searchParams.toString()}`
      );
    },

    updateStatus: (id: string, status: string) =>
      fetchApi<ApiResponse<Booking>>(`/admin/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    refund: (id: string, amount: number, reason: string) =>
      fetchApi<ApiResponse<null>>(`/admin/bookings/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      }),
  },

  // Users
  users: {
    list: (params?: { page?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, String(value));
        });
      }
      return fetchApi<ApiResponse<PaginatedResponse<User>>>(
        `/admin/users?${searchParams.toString()}`
      );
    },

    create: (data: { name: string; email: string; password: string; role: string }) =>
      fetchApi<ApiResponse<User>>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<User>) =>
      fetchApi<ApiResponse<User>>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<ApiResponse<null>>(`/admin/users/${id}`, {
        method: 'DELETE',
      }),

    resetPassword: (id: string) =>
      fetchApi<ApiResponse<null>>(`/admin/users/${id}/password`, {
        method: 'PUT',
      }),
  },

  // Customers
  customers: {
    list: (params?: { page?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, String(value));
        });
      }
      return fetchApi<ApiResponse<PaginatedResponse<any>>>(
        `/admin/customers?${searchParams.toString()}`
      );
    },

    getById: (id: string) =>
      fetchApi<ApiResponse<any>>(`/admin/customers/${id}`),

    block: (id: string, blocked: boolean) =>
      fetchApi<ApiResponse<null>>(`/admin/customers/${id}/block`, {
        method: 'PUT',
        body: JSON.stringify({ blocked }),
      }),
  },

  // Coupons
  coupons: {
    list: (params?: { page?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, String(value));
        });
      }
      return fetchApi<ApiResponse<PaginatedResponse<any>>>(
        `/admin/coupons?${searchParams.toString()}`
      );
    },

    create: (data: any) =>
      fetchApi<ApiResponse<any>>('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchApi<ApiResponse<any>>(`/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<ApiResponse<null>>(`/admin/coupons/${id}`, {
        method: 'DELETE',
      }),
  },

  // Translations
  translations: {
    list: (locale: string, namespace?: string) => {
      const params = namespace ? `?namespace=${namespace}` : '';
      return fetchApi<ApiResponse<any[]>>(`/admin/translations/${locale}${params}`);
    },

    update: (id: string, value: string) =>
      fetchApi<ApiResponse<any>>(`/admin/translations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),

    create: (data: { key: string; namespace: string; values: Record<string, string> }) =>
      fetchApi<ApiResponse<any>>('/admin/translations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Static Pages
  pages: {
    list: () =>
      fetchApi<ApiResponse<any[]>>('/admin/pages'),

    getById: (id: string) =>
      fetchApi<ApiResponse<any>>(`/admin/pages/${id}`),

    create: (data: any) =>
      fetchApi<ApiResponse<any>>('/admin/pages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      fetchApi<ApiResponse<any>>(`/admin/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchApi<ApiResponse<null>>(`/admin/pages/${id}`, {
        method: 'DELETE',
      }),
  },

  // Email Templates
  emailTemplates: {
    list: () =>
      fetchApi<ApiResponse<any[]>>('/admin/email-templates'),

    update: (id: string, data: any) =>
      fetchApi<ApiResponse<any>>(`/admin/email-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    sendTest: (id: string, email: string) =>
      fetchApi<ApiResponse<null>>(`/admin/email-templates/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  // Settings
  settings: {
    getSite: () =>
      fetchApi<ApiResponse<SiteSettings>>('/admin/settings/site'),

    updateSite: (data: Partial<SiteSettings>) =>
      fetchApi<ApiResponse<SiteSettings>>('/admin/settings/site', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getSeo: () =>
      fetchApi<ApiResponse<any>>('/admin/settings/seo'),

    updateSeo: (locale: string, pageType: string, data: any) =>
      fetchApi<ApiResponse<any>>(`/admin/settings/seo/${locale}/${pageType}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getPayment: () =>
      fetchApi<ApiResponse<any>>('/admin/settings/payment'),

    updatePayment: (data: any) =>
      fetchApi<ApiResponse<any>>('/admin/settings/payment', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getServices: () =>
      fetchApi<ApiResponse<any[]>>('/admin/settings/services'),

    updateService: (id: string, data: any) =>
      fetchApi<ApiResponse<any>>(`/admin/settings/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    testService: (id: string) =>
      fetchApi<ApiResponse<{ success: boolean; message: string }>>(
        `/admin/settings/services/${id}/test`,
        { method: 'POST' }
      ),
  },
};

export { ApiError };
