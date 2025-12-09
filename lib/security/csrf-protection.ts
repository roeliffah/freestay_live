/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Form submission'larını güvenli hale getirir
 */

import crypto from 'crypto';

/**
 * CSRF token oluştur
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF token'ı session'a kaydet (client-side için localStorage)
 */
export function setCsrfToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrf_token', token);
  }
}

/**
 * CSRF token'ı al
 */
export function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('csrf_token');
  }
  return null;
}

/**
 * CSRF token doğrula
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken();
  return storedToken !== null && storedToken === token;
}

/**
 * Form submission için CSRF koruması ekle
 */
export function addCsrfToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }
  return headers;
}

/**
 * CSRF token'ı yenile (her form submission'dan sonra)
 */
export function refreshCsrfToken(): string {
  const newToken = generateCsrfToken();
  setCsrfToken(newToken);
  return newToken;
}

/**
 * Initial setup - sayfa yüklendiğinde CSRF token oluştur
 */
export function initCsrfProtection(): string {
  let token = getCsrfToken();
  if (!token) {
    token = generateCsrfToken();
    setCsrfToken(token);
  }
  return token;
}
