/**
 * Environment configuration
 * This file provides a single source of truth for environment variables
 * and handles runtime configuration for different environments
 */

// API URL with fallback chain:
// 1. Runtime environment variable (from Dokploy/Docker)
// 2. Build-time NEXT_PUBLIC_API_URL
// 3. Default localhost for development
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:5240/api/v1';

// Check if we're in production
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Check if we're in development
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Default locale
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';

// Stripe public key
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Log configuration in development
if (IS_DEVELOPMENT) {
  console.log('🔧 Environment Configuration:');
  console.log('  API URL:', API_URL);
  console.log('  Environment:', process.env.NODE_ENV);
  console.log('  Default Locale:', DEFAULT_LOCALE);
}
