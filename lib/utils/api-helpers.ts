// API Error Handler ve Empty State Utility

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiException extends Error {
  status?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiException) {
    return {
      message: error.message,
      status: error.status,
      errors: error.errors,
    };
  }

  if (error.response) {
    // API response error
    return {
      message: error.response.data?.message || 'Bir hata oluştu',
      status: error.response.status,
      errors: error.response.data?.errors,
    };
  }

  if (error.request) {
    // Network error
    return {
      message: 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.',
    };
  }

  // Unknown error
  return {
    message: error.message || 'Beklenmeyen bir hata oluştu',
  };
};

export const isNetworkError = (error: any): boolean => {
  return (
    error.message === 'Network Error' ||
    error.message === 'Failed to fetch' ||
    !error.response
  );
};

export const isAuthError = (error: any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

export const isValidationError = (error: any): boolean => {
  return error.response?.status === 400 && error.response?.data?.errors;
};

// Safe data fetcher with fallback
export async function safeFetch<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  onError?: (error: ApiError) => void
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    const apiError = handleApiError(error);
    if (onError) {
      onError(apiError);
    } else {
      console.error('API Error:', apiError);
    }
    return fallback;
  }
}

// Empty state messages
export const emptyStateMessages = {
  tr: {
    noData: 'Henüz veri bulunmuyor',
    noResults: 'Sonuç bulunamadı',
    noHotels: 'Otel bulunamadı',
    noBookings: 'Rezervasyon bulunamadı',
    noCoupons: 'Kupon bulunamadı',
    tryAgain: 'Tekrar deneyin',
    searchAgain: 'Farklı kriterlerle arayın',
  },
  en: {
    noData: 'No data available',
    noResults: 'No results found',
    noHotels: 'No hotels found',
    noBookings: 'No bookings found',
    noCoupons: 'No coupons found',
    tryAgain: 'Try again',
    searchAgain: 'Try different search criteria',
  },
};
