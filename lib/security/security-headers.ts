/**
 * Security Headers - HTTP güvenlik başlıkları
 * XSS, Clickjacking, MIME-sniffing gibi ataklara karşı koruma
 */

export const securityHeaders = {
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Content Type sniffing önleme
  'X-Content-Type-Options': 'nosniff',
  
  // Clickjacking önleme
  'X-Frame-Options': 'DENY',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (önceden Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:5240 https://www.google.com",
    "frame-src https://www.google.com",
  ].join('; '),
};

/**
 * Next.js middleware için security headers
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * API Response için güvenlik başlıkları ekle
 */
export function getSecureApiHeaders(): HeadersInit {
  return {
    ...securityHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}
