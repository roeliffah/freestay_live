// API Client for FreeStays Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://freestays-api-bi5laf-517ca3-3-72-175-63.traefik.me/api/v1';

// Rate limiting için
import { rateLimiter, apiRateLimiter } from '@/lib/security/rate-limiter';
import { getCsrfToken, initCsrfProtection } from '@/lib/security/csrf-protection';

// SEO Settings Types
interface SeoSettings {
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  robotsTxt?: string;
  sitemapEnabled?: boolean;
  // Organization Schema
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationDescription?: string;
  socialProfiles?: string[];
  // Contact Information
  contactPhone?: string;
  contactEmail?: string;
  businessAddress?: string;
}

interface UpdateSeoSettingsRequest {
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  robotsTxt?: string;
  sitemapEnabled?: boolean;
  // Organization Schema
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationDescription?: string;
  socialProfiles?: string[];
  // Contact Information
  contactPhone?: string;
  contactEmail?: string;
  businessAddress?: string;
}

interface PageSeoRequest {
  pageType: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  // Extended Open Graph
  ogType?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;
  // Twitter Card
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterImage?: string;
  // Schema.org Structured Data
  structuredDataJson?: string;
  // Hotel Schema (for hotel_detail page type)
  hotelSchemaType?: string;
  hotelName?: string;
  hotelImage?: string[];
  hotelAddress?: string;
  hotelTelephone?: string;
  hotelPriceRange?: string;
  hotelStarRating?: number;
  hotelAggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface LocaleSeoSettings {
  pages?: PageSeoRequest[];
}

interface UpdateLocaleSeoSettingsRequest {
  pages?: PageSeoRequest[];
}

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
    // Token kontrolü - token yoksa login'e yönlendir (ama login sayfasında değilse)
    if (typeof window !== 'undefined') {
      const token = getToken();
      const isLoginEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      const isOnLoginPage = window.location.pathname === '/admin/login';
      
      // Admin sayfalarındaysa, login sayfasında değilse ve token yoksa login'e yönlendir
      if (!token && !isLoginEndpoint && !isOnLoginPage && window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        document.cookie = 'admin_token=; path=/; max-age=0';
        window.location.href = '/admin/login';
        throw new Error('Token bulunamadı. Login sayfasına yönlendiriliyorsunuz.');
      }
    }

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add any additional headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    // CSRF protection ekle
    if (typeof window !== 'undefined') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
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
        document.cookie = 'admin_token=; path=/; max-age=0';
        
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          // Token süresi dolmuş mesajını göster
          alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          window.location.href = '/admin/login';
          // Return a rejected promise to stop execution
          return Promise.reject(new Error('Token expired. Session ended.'));
        }
      }

      // Try to parse error response
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { message: text || `HTTP ${response.status}` };
        }
      } catch {
        errorData = { 
          message: response.status === 401 
            ? 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.' 
            : `API Error: ${response.status} ${response.statusText}` 
        };
      }
      
      // Log detailed error information
      console.error('❌ API Error:', { 
        status: response.status, 
        statusText: response.statusText,
        endpoint: `${this.baseURL}${endpoint}`, 
        method: options.method || 'GET',
        error: errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Handle validation errors (.NET Core format)
      if (errorData.errors && typeof errorData.errors === 'object') {
        console.error('🔍 Detailed validation errors:', JSON.stringify(errorData, null, 2));
        
        const validationMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('\n');
        
        const error = new Error(validationMessages || errorData.title || 'Validation failed');
        (error as any).validationErrors = errorData.errors;
        throw error;
      }
      
      throw new Error(errorData.message || errorData.title || `HTTP ${response.status}`);
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
    
    // Debug log for FAQ and Featured Content endpoints
    if (endpoint.includes('/admin/faqs') || endpoint.includes('/admin/featured-content')) {
      const token = getToken();
      console.log('🔐 FAQ/Featured Content Request:', {
        endpoint: url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        fullUrl: `${this.baseURL}${url}`
      });
    }
    
    return this.request<T>(url, { method: 'GET' }, skipRateLimit);
  }

  async post<T>(endpoint: string, data?: any, skipRateLimit: boolean = false): Promise<T> {
    // Log the request body for debugging
    if (endpoint.includes('/admin/users')) {
      console.log('🔵 POST Request to:', endpoint);
      console.log('🔵 Request Body:', JSON.stringify(data, null, 2));
      console.log('🔵 Role type:', typeof data?.role, 'Value:', data?.role);
    }
    
    // Debug log for Auth endpoints
    if (endpoint.includes('/Auth/login')) {
      console.log('🔐 Auth/login Request:', {
        endpoint: `${this.baseURL}${endpoint}`,
        body: JSON.stringify(data, null, 2),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Debug log for FAQ and Featured Content endpoints
    if (endpoint.includes('/admin/faqs') || endpoint.includes('/admin/featured-content')) {
      const token = getToken();
      console.log('🔐 FAQ/Featured Content POST:', {
        endpoint,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        data: JSON.stringify(data, null, 2)
      });
    }
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, skipRateLimit);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Log the request body for debugging
    if (endpoint.includes('/admin/users')) {
      console.log('🟣 PUT Request to:', endpoint);
      console.log('🟣 Request Body:', JSON.stringify(data, null, 2));
      console.log('🟣 Command Role:', data?.command?.role, 'Type:', typeof data?.command?.role);
    }
    
    // Debug log for FAQ and Featured Content endpoints
    if (endpoint.includes('/admin/faqs') || endpoint.includes('/admin/featured-content')) {
      const token = getToken();
      console.log('🔐 FAQ/Featured Content PUT:', {
        endpoint,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        data: JSON.stringify(data, null, 2)
      });
    }
    
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (endpoint.includes('/admin/users')) {
      console.log('🟣 PUT Response:', JSON.stringify(response, null, 2));
    }
    
    return response;
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    // Debug log for FAQ and Featured Content endpoints
    if (endpoint.includes('/admin/faqs') || endpoint.includes('/admin/featured-content')) {
      const token = getToken();
      console.log('🔐 FAQ/Featured Content PATCH:', {
        endpoint,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        data: JSON.stringify(data, null, 2)
      });
    }
    
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    // Debug log for FAQ and Featured Content endpoints
    if (endpoint.includes('/admin/faqs') || endpoint.includes('/admin/featured-content')) {
      const token = getToken();
      console.log('🔐 FAQ/Featured Content DELETE:', {
        endpoint,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
      });
    }
    
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }> => {
    console.log('🔐 Login attempt:', {
      email,
      passwordLength: password.length,
      endpoint: `${API_BASE_URL}/Auth/login`
    });
    
    try {
      const response: any = await apiClient.post('/Auth/login', { email, password }, true);
      console.log('✅ Login successful:', {
        hasToken: !!response.accessToken,
        user: response.user?.email
      });
      return response;
    } catch (error: any) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.status,
        validationErrors: error.validationErrors
      });
      throw error;
    }
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
  // Dashboard - Single endpoint that returns all dashboard data
  getDashboard: (): Promise<{
    stats: {
      totalBookings: number;
      totalRevenue: number;
      totalCustomers: number;
      commission: number;
      bookingsGrowth: number;
      revenueGrowth: number;
    };
    recentBookings: Array<{
      id: string;
      customer: string;
      type: string;
      hotel: string;
      amount: number;
      status: string;
      date: string;
    }>;
    topDestinations: Array<{
      name: string;
      bookings: number;
      percent: number;
    }>;
  }> => apiClient.get('/admin/dashboard'),

  // Users
  getUsers: (params?: { page?: number; pageSize?: number; search?: string }): Promise<{
    items: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      role: number;
      isActive: boolean;
      createdAt: string;
      lastLogin?: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => apiClient.get('/admin/users', params),
  
  getUser: (id: string): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'staff';
    status: 'active' | 'inactive';
    createdAt: string;
    lastLogin: string;
  }> => apiClient.get(`/admin/users/${id}`),

  // Note: Backend doesn't have create/update/delete endpoints yet
  // These are placeholders for when they are implemented
  createUser: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'admin' | 'staff';
    status?: 'active' | 'inactive';
  }): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: number;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
  }> => {
    // Backend expects CreateAdminUserCommand directly (not wrapped in 'command')
    // UserRole enum: 0=Customer, 1=Staff, 2=Admin, 3=SuperAdmin
    // Backend validation: Only Admin (2) or SuperAdmin (3) can be assigned for admin users
    
    console.log('📥 Received data from form:', data);
    
    const roleValue = data.role === 'admin' ? 2 : 3; // 2 for Admin, 3 for SuperAdmin (staff maps to superadmin)
    
    const requestData = {
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: roleValue, // Backend expects direct enum value for POST
    };
    
    console.log('📤 Creating user - sending to backend:', JSON.stringify(requestData, null, 2));
    console.log('📤 Role mapping:', { input: data.role, output: roleValue, type: typeof roleValue });
    
    return apiClient.post('/admin/users', requestData);
  },
  
  updateUser: (id: string, data: {
    name?: string;
    phone?: string;
    role?: 'admin' | 'staff';
    status?: 'active' | 'inactive';
    newPassword?: string;
  }): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: number;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
  }> => {
    // Backend expects UpdateAdminUserCommand wrapped in 'command'
    // Note: id must be in the command as well
    // UserRole enum: 0=Customer, 1=Staff, 2=Admin, 3=SuperAdmin
    const command: any = {
      id: id, // Required in UpdateAdminUserCommand
    };
    
    if (data.name !== undefined) command.name = data.name;
    if (data.phone !== undefined) command.phone = data.phone;
    if (data.role !== undefined) {
      // Send as number: 2 for Admin, 3 for SuperAdmin
      command.role = data.role === 'admin' ? 2 : 3;
    }
    if (data.status !== undefined) command.isActive = data.status === 'active';
    if (data.newPassword !== undefined) command.newPassword = data.newPassword;
    
    const requestData = { command };
    
    console.log('📤 Updating user - sending to backend:', JSON.stringify(requestData, null, 2));
    
    return apiClient.put(`/admin/users/${id}`, requestData);
  },

  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),


  // Password reset - uses Auth endpoint
  sendPasswordReset: (email: string): Promise<{ message: string }> =>
    apiClient.post('/Auth/forgot-password', { email }),

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

  // External Services (SunHotels, Kiwi.com, DiscoverCars, Stripe)
  getExternalServices: () => apiClient.get('/admin/external-services'),
  
  getExternalService: (id: string) => apiClient.get(`/admin/external-services/${id}`),
  
  getExternalServiceByName: (serviceName: string) => apiClient.get(`/admin/external-services/by-name/${serviceName}`),
  
  updateExternalService: (id: string, data: {
    baseUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    affiliateCode?: string;
    integrationMode?: number;
    isActive?: boolean;
    settings?: string;
  }) => apiClient.put(`/admin/external-services/${id}`, data),
  
  toggleExternalServiceStatus: (id: string) => apiClient.patch(`/admin/external-services/${id}/toggle-status`),
  
  testExternalServiceConnection: (id: string) => apiClient.post(`/admin/external-services/${id}/test-connection`),

  // Legacy - Deprecated (use External Services endpoints above)
  getServices: () => apiClient.get('/admin/external-services'),
  
  updateService: (serviceId: string, data: any) => apiClient.put(`/admin/external-services/${serviceId}`, data),

  // Jobs - SunHotels Sync
  syncSunHotels: (): Promise<{
    jobId: string;
    message: string;
    status: string;
  }> => apiClient.post('/admin/services/sunhotels/sync'),
  
  getJobHistory: (params?: { page?: number; pageSize?: number }): Promise<{
    items: Array<{
      id: string;
      jobType: string;
      status: string;
      startTime: string;
      endTime?: string;
      duration?: number;
      message?: string;
      errorMessage?: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
  }> => apiClient.get('/admin/jobs/history', params),
  
  getSunHotelsStatistics: (): Promise<{
    destinationCount: number;
    resortCount: number;
    mealCount: number;
    roomTypeCount: number;
    featureCount: number;
    themeCount: number;
    languageCount: number;
    transferTypeCount: number;
    noteTypeCount: number;
    hotelCount: number;
    roomCount: number;
    lastSyncTime: string | null;
  }> => apiClient.get('/sunhotels/statistics'),

  // Hangfire Management
  getRecurringJobs: () => apiClient.get('/admin/hangfire/recurring-jobs'),
  
  triggerRecurringJob: (jobId: string) => apiClient.post(`/admin/hangfire/recurring-jobs/${jobId}/trigger`),
  
  deleteRecurringJob: (jobId: string) => apiClient.delete(`/admin/hangfire/recurring-jobs/${jobId}`),
  
  updateJobSchedule: (jobId: string, cronExpression: string) => 
    apiClient.put(`/admin/hangfire/recurring-jobs/${jobId}/schedule`, { cronExpression }),
  
  getProcessingJobs: () => apiClient.get('/admin/hangfire/processing-jobs'),
  
  cancelJob: (jobId: string) => apiClient.delete(`/admin/hangfire/jobs/${jobId}`),
  
  getQueueStats: () => apiClient.get('/admin/hangfire/queue/stats'),
  
  clearFailedJobs: () => apiClient.delete('/admin/hangfire/queue/failed'),
  
  cancelProcessingJobs: () => apiClient.delete('/admin/hangfire/queue/processing'),
  
  getHangfireHistory: (params?: { page?: number; pageSize?: number; jobType?: string; status?: string }) =>
    apiClient.get('/admin/hangfire/history', params),
  
  cleanupStuckJobs: (olderThanMinutes: number = 30) =>
    apiClient.post('/admin/hangfire/history/cleanup-stuck', { olderThanMinutes }),
  
  getCronPresets: () => apiClient.get('/admin/hangfire/cron-presets'),
  
  getHangfireServers: () => apiClient.get('/admin/hangfire/servers'),

  // SunHotels Job Triggers
  enqueueSyncAll: () => apiClient.post('/admin/jobs/sunhotels/enqueue-sync-all'),
  
  enqueueSyncBasic: () => apiClient.post('/admin/jobs/sunhotels/enqueue-sync-basic'),
  
  getSunHotelsJobStatus: () => apiClient.get('/admin/jobs/sunhotels/status'),

  // Email Templates
  getEmailTemplates: (params?: { isActive?: boolean }) =>
    apiClient.get('/admin/email-templates', params),
  
  getEmailTemplate: (id: string) => apiClient.get(`/admin/email-templates/${id}`),
  
  getEmailTemplateByCode: (code: string, locale?: string) => 
    apiClient.get(`/admin/email-templates/by-code/${code}`, { locale }),
  
  createEmailTemplate: (data: any) => apiClient.post('/admin/email-templates', data),
  
  updateEmailTemplate: (id: string, data: any) =>
    apiClient.put(`/admin/email-templates/${id}`, data),
  
  deleteEmailTemplate: (id: string) => apiClient.delete(`/admin/email-templates/${id}`),
  
  toggleEmailTemplateStatus: (id: string) =>
    apiClient.patch(`/admin/email-templates/${id}/toggle-status`, {}),
  
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
  
  getSocialSettings: () => apiClient.get('/admin/settings/social'),
  
  updateSocialSettings: (data: any) => apiClient.put('/admin/settings/social', data),
  
  getBrandingSettings: () => apiClient.get('/admin/settings/branding'),
  
  updateBrandingSettings: (data: any) => apiClient.put('/admin/settings/branding', data),
  
  getContactSettings: () => apiClient.get('/admin/settings/contact'),
  
  updateContactSettings: (data: any) => apiClient.put('/admin/settings/contact', data),
  
  // Email/SMTP Settings (Backend: /smtp)
  getEmailSettings: () => apiClient.get('/admin/settings/smtp'),
  
  updateEmailSettings: (data: any) => apiClient.put('/admin/settings/smtp', data),
  
  testEmail: (data: { toEmail: string }) => apiClient.post('/admin/settings/smtp/test-connection', data),
  
  // SEO Settings
  getSeoSettings: () => apiClient.get<SeoSettings>('/admin/settings/seo'),
  
  updateSeoSettings: (data: UpdateSeoSettingsRequest) => 
    apiClient.put('/admin/settings/seo', data),
  
  getLocaleSeoSettings: (locale: string) => 
    apiClient.get<LocaleSeoSettings>(`/admin/settings/seo/${locale}`),
  
  updateLocaleSeoSettings: (locale: string, data: UpdateLocaleSeoSettingsRequest) =>
    apiClient.put(`/admin/settings/seo/${locale}`, data),
  
  getPaymentSettings: () => apiClient.get('/admin/settings/payment'),
  
  updatePaymentSettings: (data: any) => apiClient.put('/admin/settings/payment', data),
  
  testPaymentConnection: (data: { provider: string }) =>
    apiClient.post('/admin/settings/payment/test-connection', data),

  // Reports
  getRevenueReport: (params?: { fromDate?: string; toDate?: string }) =>
    apiClient.get('/admin/reports/revenue', params),

  // FAQs
  getFaqs: (params?: { page?: number; pageSize?: number; category?: string; isActive?: boolean }) =>
    apiClient.get('/admin/faqs', params),

  getFaq: (id: string) => apiClient.get(`/admin/faqs/${id}`),

  createFaq: (data: any) => apiClient.post('/admin/faqs', data),

  updateFaq: (id: string, data: any) => apiClient.put(`/admin/faqs/${id}`, data),

  deleteFaq: (id: string) => apiClient.delete(`/admin/faqs/${id}`),

  updateFaqOrder: (data: { items: Array<{ id: string; order: number }> }) =>
    apiClient.patch('/admin/faqs/reorder', data),

  // Featured Content - Hotels
  getFeaturedHotels: (params?: { page?: number; pageSize?: number; status?: string; season?: string; category?: string }) =>
    apiClient.get('/admin/featured-content/hotels', params),

  createFeaturedHotel: (data: any) => apiClient.post('/admin/featured-content/hotels', data),

  updateFeaturedHotel: (id: string, data: any) => apiClient.put(`/admin/featured-content/hotels/${id}`, data),

  deleteFeaturedHotel: (id: string) => apiClient.delete(`/admin/featured-content/hotels/${id}`),

  updateFeaturedHotelPriority: (id: string, priority: number) =>
    apiClient.patch(`/admin/featured-content/hotels/${id}/priority`, { priority }),

  bulkUpdateFeaturedHotelPriority: (data: { items: Array<{ id: string; priority: number }> }) =>
    apiClient.patch('/admin/featured-content/hotels/bulk-priority', data),

  // Featured Content - Destinations
  getFeaturedDestinations: (params?: { page?: number; pageSize?: number; status?: string; season?: string }) =>
    apiClient.get('/admin/featured-content/destinations', params),

  createFeaturedDestination: (data: any) => apiClient.post('/admin/featured-content/destinations', data),

  updateFeaturedDestination: (id: string, data: any) => apiClient.put(`/admin/featured-content/destinations/${id}`, data),

  deleteFeaturedDestination: (id: string) => apiClient.delete(`/admin/featured-content/destinations/${id}`),

  bulkUpdateFeaturedDestinationPriority: (data: { items: Array<{ id: string; priority: number }> }) =>
    apiClient.patch('/admin/featured-content/destinations/bulk-priority', data),

  // File Upload
  uploadImage: async (file: File, folder?: string): Promise<{ success: boolean; url: string; fileName: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const queryParams = folder ? `?folder=${folder}` : '';
    const token = getToken();
    
    const response = await fetch(`${API_BASE_URL}/admin/upload/image${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  deleteFile: async (fileUrl: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/admin/upload?fileUrl=${encodeURIComponent(fileUrl)}`);
  },
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
