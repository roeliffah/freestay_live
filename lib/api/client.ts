// API Client for FreeStays Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5240/api/v1';

// Rate limiting için
import { rateLimiter, apiRateLimiter } from '@/lib/security/rate-limiter';
import { addCsrfToHeaders } from '@/lib/security/csrf-protection';

// Helper function to get token
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token') || localStorage.getItem('token');
  }
  return null;
};

// Helper function to get user identifier for rate limiting
const getUserIdentifier = (): string => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('admin_user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.email || 'anonymous';
      } catch {
        return 'anonymous';
      }
    }
  }
  return 'anonymous';
};

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipRateLimit: boolean = false
  ): Promise<T> {
    // Rate limiting kontrolü (login ve public endpointler hariç)
    if (!skipRateLimit && typeof window !== 'undefined') {
      const identifier = getUserIdentifier();
      const rateCheck = rateLimiter.check(identifier, apiRateLimiter);
      
      if (!rateCheck.allowed) {
        const minutesLeft = Math.ceil((rateCheck.resetTime! - Date.now()) / 60000);
        throw new Error(`Çok fazla istek! Lütfen ${minutesLeft} dakika sonra tekrar deneyin.`);
      }
    }

    const token = getToken();
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // CSRF protection ekle
    if (typeof window !== 'undefined') {
      headers = addCsrfToHeaders(headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }

      const error = await response.json().catch(() => ({ 
        message: response.status === 401 ? 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' : 'Bir hata oluştu' 
      }));
      
      throw new Error(error.message || error.title || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, any>, skipRateLimit: boolean = false): Promise<T> {
    let url = endpoint;
    if (params) {
      // Filter out null/undefined values
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const queryString = new URLSearchParams(filteredParams).toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' }, skipRateLimit);
  }

  async post<T>(endpoint: string, data?: any, skipRateLimit: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, skipRateLimit);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiClient.post('/Auth/login', { email, password });
  },

  register: async (data: { email: string; password: string; name: string; phone?: string; locale?: string }) => {
    return apiClient.post('/Auth/register', data);
  },

  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/Auth/refresh-token', { refreshToken });
  },

  forgotPassword: async (email: string) => {
    return apiClient.post('/Auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiClient.post('/Auth/reset-password', { token, newPassword });
  },
};

// Admin APIs
export const adminAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),

  // Users
  getUsers: (params?: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get('/admin/users', params),
  
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  
  updateUserStatus: (id: string, data: { isActive: boolean; reason?: string }) =>
    apiClient.patch(`/admin/users/${id}/status`, data),

  // Customers
  getCustomers: (params?: { page?: number; pageSize?: number; search?: string; isBlocked?: boolean; sortBy?: string; sortDesc?: boolean }) =>
    apiClient.get('/admin/customers', params),
  
  getCustomer: (id: string) => apiClient.get(`/admin/customers/${id}`),
  
  updateCustomer: (id: string, data: { notes?: string; isBlocked?: boolean; blockReason?: string }) =>
    apiClient.put(`/admin/customers/${id}`, data),
  
  deleteCustomer: (id: string) => apiClient.delete(`/admin/customers/${id}`),
  
  getCustomerBookings: (id: string, params?: { page?: number; pageSize?: number }) =>
    apiClient.get(`/admin/customers/${id}/bookings`, params),

  // Bookings
  getBookings: (params?: { page?: number; pageSize?: number; status?: number; type?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/admin/bookings', params),
  
  updateBookingStatus: (id: string, data: { status: number; notes?: string }) =>
    apiClient.patch(`/admin/bookings/${id}/status`, data),

  // Coupons
  getCoupons: (params?: { page?: number; pageSize?: number; isActive?: boolean }) =>
    apiClient.get('/admin/coupons', params),
  
  getCoupon: (id: string) => apiClient.get(`/admin/coupons/${id}`),
  
  createCoupon: (data: any) => apiClient.post('/admin/coupons', data),
  
  updateCoupon: (id: string, data: any) => apiClient.put(`/admin/coupons/${id}`, data),
  
  deleteCoupon: (id: string) => apiClient.delete(`/admin/coupons/${id}`),

  // Services
  getServices: () => apiClient.get('/admin/services'),
  
  updateService: (serviceId: string, data: any) => apiClient.put(`/admin/services/${serviceId}`, data),

  // Jobs - SunHotels Sync
  syncSunHotelsAll: () => apiClient.post('/admin/jobs/sunhotels/sync-all'),
  
  syncSunHotelsBasic: () => apiClient.post('/admin/jobs/sunhotels/sync-basic'),
  
  getSunHotelsStatistics: () => apiClient.get('/sunhotels/statistics'),

  // Email Templates
  getEmailTemplates: (params?: { isActive?: boolean }) =>
    apiClient.get('/admin/email-templates', params),
  
  getEmailTemplate: (code: string) => apiClient.get(`/admin/email-templates/${code}`),
  
  updateEmailTemplate: (code: string, data: any) =>
    apiClient.put(`/admin/email-templates/${code}`, data),
  
  sendTestEmail: (code: string, data: { email: string; locale?: string; testVariables?: Record<string, string> }) =>
    apiClient.post(`/admin/email-templates/${code}/test`, data),

  // Pages
  getPages: (params?: { isActive?: boolean }) => apiClient.get('/admin/pages', params),
  
  getPageBySlug: (slug: string) => apiClient.get(`/admin/pages/${slug}`),
  
  getPage: (id: string) => apiClient.get(`/admin/pages/${id}`),
  
  createPage: (data: any) => apiClient.post('/admin/pages', data),
  
  updatePage: (id: string, data: any) => apiClient.put(`/admin/pages/${id}`, data),
  
  deletePage: (id: string) => apiClient.delete(`/admin/pages/${id}`),

  // Translations
  getTranslations: (params?: { locale?: string; ns?: string }) =>
    apiClient.get('/admin/translations', params),
  
  getTranslationsByLocale: (locale: string, params?: { ns?: string }) =>
    apiClient.get(`/admin/translations/${locale}`, params),
  
  updateTranslations: (locale: string, data: { translations: Record<string, Record<string, string>> }) =>
    apiClient.put(`/admin/translations/${locale}`, data),
  
  addTranslationKey: (locale: string, data: { namespace?: string; key: string; value: string }) =>
    apiClient.post(`/admin/translations/${locale}/key`, data),

  // Settings
  getSiteSettings: () => apiClient.get('/admin/settings/site'),
  
  updateSiteSettings: (data: any) => apiClient.put('/admin/settings/site', data),
  
  getSeoSettings: () => apiClient.get('/admin/settings/seo'),
  
  updateSeoSettings: (data: any) => apiClient.put('/admin/settings/seo', data),
  
  getLocaleSeoSettings: (locale: string) => apiClient.get(`/admin/settings/seo/${locale}`),
  
  updateLocaleSeoSettings: (locale: string, data: any) =>
    apiClient.put(`/admin/settings/seo/${locale}`, data),
  
  getPaymentSettings: () => apiClient.get('/admin/settings/payment'),
  
  updatePaymentSettings: (data: any) => apiClient.put('/admin/settings/payment', data),
  
  testPaymentConnection: (data: { provider: string }) =>
    apiClient.post('/admin/settings/payment/test-connection', data),

  // Reports
  getRevenueReport: (params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get('/admin/reports/revenue', params),
};

// Hotels API
export const hotelsAPI = {
  search: (params: { Destination?: string; CheckIn?: string; CheckOut?: string; Guests?: number; MinCategory?: number; MaxPrice?: number }) =>
    apiClient.get('/Hotels/search', params),
  
  getDetail: (id: string) => apiClient.get(`/Hotels/${id}`),
  
  checkRoomAvailability: (id: string, params: { checkIn?: string; checkOut?: string; adults?: number; children?: number }) =>
    apiClient.get(`/Hotels/${id}/rooms`, params),
  
  getFeatured: (count: number = 10) => apiClient.get('/Hotels/featured', { count }),
  
  getDestinations: (query?: string) => apiClient.get('/Hotels/destinations', { Query: query }),
  
  getDestinationHotels: (destinationId: string, params?: { checkIn?: string; checkOut?: string; adults?: number }) =>
    apiClient.get(`/Hotels/destinations/${destinationId}/hotels`, params),
};

// Bookings API
export const bookingsAPI = {
  list: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/Bookings', params),
  
  getDetail: (id: string) => apiClient.get(`/Bookings/${id}`),
  
  createHotelBooking: (data: any) => apiClient.post('/Bookings/hotels', data),
  
  createFlightBooking: (data: any) => apiClient.post('/Bookings/flights', data),
  
  createCarRental: (data: any) => apiClient.post('/Bookings/cars', data),
  
  cancel: (id: string, reason?: string) =>
    apiClient.post(`/Bookings/${id}/cancel`, { reason }),
};

// Coupons API
export const couponsAPI = {
  validate: (code: string) => apiClient.post('/Coupons/validate', { code }),
  
  apply: (data: { code: string; amount: number; bookingType: string }) =>
    apiClient.post('/Coupons/apply', data),
  
  getMyCoupons: () => apiClient.get('/Coupons/my-coupons'),
};

// Pages API
export const pagesAPI = {
  getPage: (slug: string, locale?: string) => {
    const url = locale ? `/Pages/${slug}/${locale}` : `/Pages/${slug}`;
    return apiClient.get(url);
  },
};

// Payments API
export const paymentsAPI = {
  initiate: (data: { bookingId: string; amount: number; currency: string; paymentMethod: string }) =>
    apiClient.post('/Payments/initiate', data),
  
  checkStatus: (paymentId: string) => apiClient.get(`/Payments/${paymentId}/status`),
  
  refund: (paymentId: string, data: { reason?: string; amount?: number }) =>
    apiClient.post(`/Payments/${paymentId}/refund`, data),
  
  getHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/Payments/history', params),
};

// Flights API
export const flightsAPI = {
  search: (params: any) => apiClient.get('/Flights/search', params),
  
  getDetail: (id: string) => apiClient.get(`/Flights/${id}`),
  
  searchAirports: (query: string) => apiClient.get('/Flights/airports', { query }),
  
  getPopularRoutes: (count: number = 10) => apiClient.get('/Flights/popular-routes', { count }),
};

// Cars API
export const carsAPI = {
  search: (params: any) => apiClient.get('/Cars/search', params),
  
  getDetail: (id: string) => apiClient.get(`/Cars/${id}`),
  
  searchLocations: (query: string) => apiClient.get('/Cars/locations', { query }),
  
  getCategories: () => apiClient.get('/Cars/categories'),
};

export default apiClient;
