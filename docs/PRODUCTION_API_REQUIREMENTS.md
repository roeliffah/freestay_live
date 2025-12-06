# FreeStays Production Architecture Document

## Overview
This document outlines the complete API requirements and architecture for the FreeStays travel booking platform.

---

## 1. API Endpoints Required

### 1.1 Site Configuration (Admin-Controlled)
```
GET  /api/v1/settings/site          - Get site settings (name, logo, contact info)
PUT  /api/v1/settings/site          - Update site settings (Admin)

GET  /api/v1/settings/seo           - Get SEO settings for a page/locale
PUT  /api/v1/settings/seo           - Update SEO settings (Admin)

GET  /api/v1/settings/social        - Get social media links
PUT  /api/v1/settings/social        - Update social links (Admin)

GET  /api/v1/settings/payment       - Get payment configuration
PUT  /api/v1/settings/payment       - Update payment settings (Admin)

GET  /api/v1/settings/services      - Get external service configs
PUT  /api/v1/settings/services/{id} - Update service config (Admin)
POST /api/v1/settings/services/test - Test service connection (Admin)
```

### 1.2 Translations (Admin-Controlled)
```
GET  /api/v1/translations                    - Get all translations for a locale
GET  /api/v1/translations/{locale}           - Get translations by locale
GET  /api/v1/translations/{locale}/{namespace} - Get translations by namespace
PUT  /api/v1/translations/{key}              - Update translation (Admin)
POST /api/v1/translations                    - Add new translation key (Admin)
DELETE /api/v1/translations/{key}            - Delete translation (Admin)
```

### 1.3 Static Pages (Admin-Controlled)
```
GET  /api/v1/pages                  - List all static pages
GET  /api/v1/pages/{slug}           - Get page by slug (with locale content)
GET  /api/v1/pages/{slug}/{locale}  - Get page content for specific locale
POST /api/v1/pages                  - Create new page (Admin)
PUT  /api/v1/pages/{id}             - Update page (Admin)
DELETE /api/v1/pages/{id}           - Delete page (Admin)
```

### 1.4 Email Templates (Admin-Controlled)
```
GET  /api/v1/email-templates                 - List all templates
GET  /api/v1/email-templates/{code}          - Get template by code
PUT  /api/v1/email-templates/{id}            - Update template (Admin)
POST /api/v1/email-templates/test            - Send test email (Admin)
```

### 1.5 Authentication
```
POST /api/v1/auth/register          - Customer registration
POST /api/v1/auth/login             - Login (returns JWT)
POST /api/v1/auth/logout            - Logout (invalidate token)
POST /api/v1/auth/refresh           - Refresh JWT token
POST /api/v1/auth/forgot-password   - Request password reset
POST /api/v1/auth/reset-password    - Reset password with token
POST /api/v1/auth/verify-email      - Verify email address
GET  /api/v1/auth/me                - Get current user profile
PUT  /api/v1/auth/me                - Update current user profile
PUT  /api/v1/auth/me/password       - Change password
```

### 1.6 Hotels (SunHotels Integration)
```
GET  /api/v1/hotels/search          - Search hotels (proxies to SunHotels)
    Query: destination, checkIn, checkOut, rooms, adults, children
    
GET  /api/v1/hotels/{id}            - Get hotel details
GET  /api/v1/hotels/{id}/rooms      - Get available rooms for dates
GET  /api/v1/hotels/{id}/reviews    - Get hotel reviews
GET  /api/v1/hotels/featured        - Get featured hotels (cached)
GET  /api/v1/hotels/popular         - Get popular destinations (cached)
```

### 1.7 Bookings
```
POST /api/v1/bookings/hotel         - Create hotel booking
POST /api/v1/bookings/flight        - Create flight booking
POST /api/v1/bookings/car           - Create car rental booking
GET  /api/v1/bookings               - List user's bookings
GET  /api/v1/bookings/{id}          - Get booking details
PUT  /api/v1/bookings/{id}/cancel   - Cancel booking
GET  /api/v1/bookings/{id}/voucher  - Download booking voucher (PDF)

# Admin
GET  /api/v1/admin/bookings         - List all bookings (Admin)
PUT  /api/v1/admin/bookings/{id}/status - Update booking status (Admin)
POST /api/v1/admin/bookings/{id}/refund - Process refund (Admin)
```

### 1.8 Coupons
```
POST /api/v1/coupons/validate       - Validate coupon code
    Body: { code, bookingType, amount }
    
# Admin
GET  /api/v1/admin/coupons          - List all coupons
POST /api/v1/admin/coupons          - Create coupon
PUT  /api/v1/admin/coupons/{id}     - Update coupon
DELETE /api/v1/admin/coupons/{id}   - Delete coupon
```

### 1.9 Users (Admin)
```
GET  /api/v1/admin/users            - List admin users
POST /api/v1/admin/users            - Create admin user
PUT  /api/v1/admin/users/{id}       - Update user
DELETE /api/v1/admin/users/{id}     - Delete user
PUT  /api/v1/admin/users/{id}/password - Reset user password
```

### 1.10 Customers (Admin)
```
GET  /api/v1/admin/customers        - List customers
GET  /api/v1/admin/customers/{id}   - Get customer details with bookings
PUT  /api/v1/admin/customers/{id}/block - Block/unblock customer
```

### 1.11 Dashboard (Admin)
```
GET  /api/v1/admin/dashboard/stats  - Get dashboard statistics
GET  /api/v1/admin/dashboard/recent-bookings - Get recent bookings
GET  /api/v1/admin/dashboard/revenue - Get revenue chart data
GET  /api/v1/admin/dashboard/popular-destinations - Get popular destinations
```

### 1.12 Payments (Stripe)
```
POST /api/v1/payments/create-intent      - Create payment intent
POST /api/v1/payments/confirm            - Confirm payment
POST /api/v1/webhooks/stripe             - Stripe webhook handler
```

---

## 2. Database Schema Changes

### New Tables Required:

```sql
-- Site Settings
CREATE TABLE site_settings (
    id UUID PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP
);

-- SEO Settings
CREATE TABLE seo_settings (
    id UUID PRIMARY KEY,
    page_type VARCHAR(50) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    meta_title VARCHAR(100),
    meta_description VARCHAR(200),
    keywords VARCHAR(255),
    og_image VARCHAR(255),
    UNIQUE(page_type, locale)
);

-- Static Pages
CREATE TABLE static_pages (
    id UUID PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE static_page_contents (
    id UUID PRIMARY KEY,
    page_id UUID REFERENCES static_pages(id),
    locale VARCHAR(5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meta_title VARCHAR(100),
    meta_description VARCHAR(200),
    UNIQUE(page_id, locale)
);

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE email_template_contents (
    id UUID PRIMARY KEY,
    template_id UUID REFERENCES email_templates(id),
    locale VARCHAR(5) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    UNIQUE(template_id, locale)
);

-- Translations
CREATE TABLE translations (
    id UUID PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    namespace VARCHAR(50) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    value TEXT NOT NULL,
    UNIQUE(key, locale)
);
```

---

## 3. Frontend Service Layer

Create a centralized API service layer to replace all mock data:

```typescript
// lib/api/index.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  // Settings
  settings: {
    getSite: () => fetch(`${API_BASE_URL}/settings/site`),
    getSeo: (pageType: string, locale: string) => 
      fetch(`${API_BASE_URL}/settings/seo?page=${pageType}&locale=${locale}`),
  },
  
  // Translations
  translations: {
    get: (locale: string) => fetch(`${API_BASE_URL}/translations/${locale}`),
  },
  
  // Hotels
  hotels: {
    search: (params: SearchParams) => 
      fetch(`${API_BASE_URL}/hotels/search?${new URLSearchParams(params)}`),
    getById: (id: string) => fetch(`${API_BASE_URL}/hotels/${id}`),
    getFeatured: () => fetch(`${API_BASE_URL}/hotels/featured`),
  },
  
  // Bookings
  bookings: {
    create: (data: BookingData) => 
      fetch(`${API_BASE_URL}/bookings/hotel`, { method: 'POST', body: JSON.stringify(data) }),
    getMyBookings: () => fetch(`${API_BASE_URL}/bookings`),
    cancel: (id: string) => fetch(`${API_BASE_URL}/bookings/${id}/cancel`, { method: 'PUT' }),
  },
  
  // Coupons
  coupons: {
    validate: (code: string, amount: number, type: string) =>
      fetch(`${API_BASE_URL}/coupons/validate`, { 
        method: 'POST', 
        body: JSON.stringify({ code, amount, type }) 
      }),
  },
  
  // Auth
  auth: {
    login: (email: string, password: string) =>
      fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data: RegisterData) =>
      fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetch(`${API_BASE_URL}/auth/me`),
  },
  
  // Pages
  pages: {
    getBySlug: (slug: string, locale: string) => 
      fetch(`${API_BASE_URL}/pages/${slug}/${locale}`),
  },
};
```

---

## 4. Admin-Controlled Frontend Content

### 4.1 What will be controlled from Admin:

1. **Site Settings**
   - Site name, logo, favicon
   - Contact information
   - Social media links
   - Maintenance mode

2. **SEO Settings**
   - Meta titles and descriptions per page/locale
   - Open Graph images
   - Robots.txt, sitemap settings

3. **Translations**
   - All UI text in 9 languages
   - Dynamic content translations

4. **Static Pages**
   - Privacy Policy
   - Terms & Conditions
   - About Us
   - Contact page content
   - FAQ

5. **Email Templates**
   - Booking confirmation
   - Welcome email
   - Password reset
   - Cancellation notification

6. **Coupons**
   - Create/edit/delete coupon codes
   - Set validity dates
   - Set usage limits
   - View usage statistics

7. **Content**
   - Featured hotels
   - Popular destinations
   - Homepage banners

---

## 5. Implementation Priority

### Phase 1: Core API (Week 1-2)
- [ ] Authentication endpoints
- [ ] Hotel search/details (SunHotels proxy)
- [ ] Basic booking creation
- [ ] Settings endpoints
- [ ] Translations endpoint

### Phase 2: Admin Features (Week 3-4)
- [ ] User/Customer management
- [ ] Booking management
- [ ] Coupon CRUD
- [ ] Email templates

### Phase 3: Content Management (Week 4-5)
- [ ] Static pages CRUD
- [ ] SEO settings
- [ ] Translation management
- [ ] Site settings

### Phase 4: Payment & Advanced (Week 5-6)
- [ ] Stripe integration
- [ ] Refund processing
- [ ] Dashboard analytics
- [ ] Background jobs (sync, cache)

---

## 6. Environment Variables Needed

```env
# API
NEXT_PUBLIC_API_URL=https://api.freestays.com/api/v1

# External Services (stored in DB, managed via admin)
# These are initial values, will be managed from admin panel

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/freestays

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 7. Caching Strategy

### Redis Keys:
```
translations:{locale}           - 1 hour
hotels:featured                 - 15 minutes
hotels:search:{hash}           - 5 minutes
settings:site                   - 1 hour
settings:seo:{page}:{locale}   - 1 hour
pages:{slug}:{locale}          - 1 hour
```

### Cache Invalidation:
- Admin updates trigger cache invalidation
- Use Redis pub/sub for real-time invalidation

---

## 8. Next Steps

1. **API Development**: Start with authentication and settings endpoints
2. **Frontend Refactoring**: 
   - Remove all mock data
   - Create API service layer
   - Connect components to API
3. **Database Migration**: Create new tables
4. **Testing**: Unit tests for API, integration tests for frontend

---

**Document Version**: 1.0
**Last Updated**: December 6, 2025
