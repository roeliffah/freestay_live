# FreeStays Page Content Guide

This guide helps you locate and edit content for each page in the application.

## Main File
All page components are currently in `/app/frontend/src/App.js`

## Page Line Numbers Reference

| Page | Component Name | Line Number | Description |
|------|---------------|-------------|-------------|
| Home | `HomePage` | ~1363 | Main landing page with hero, search, testimonials |
| Search Results | `SearchPage` | ~2036 | Hotel search results with filters |
| Hotel Detail | `HotelDetailPage` | ~2897 | Individual hotel page with rooms |
| Booking | `BookingPage` | ~3209 | Checkout and payment page |
| Last Minute | `LastMinutePage` | ~3854 | Last minute deals page |
| About | `AboutPage` | ~4638 | About us / How it works |
| Admin | `AdminPanel` | ~4710 | Admin dashboard |
| User Dashboard | `UserDashboard` | ~5200+ | User bookings, favorites, referrals |
| Verify Email | `VerifyEmailPage` | ~588 | Email verification |
| Forgot Password | `ForgotPasswordPage` | ~655 | Password reset request |
| Reset Password | `ResetPasswordPage` | ~737 | Password reset form |

## Key Sections to Edit

### Hero Section (HomePage ~1421-1487)
- Badge text: Uses translation key `hero.badge`
- Main title: Uses `hero.title1` and `hero.title2`
- Subtitle: Uses `hero.subtitle`, `hero.hotelsSave`, `hero.passItToYou`
- Benefits cards: Uses `hero.roomFree`, `hero.payMealsOnly`, `hero.saved`, etc.
- CTA buttons: Uses `hero.getFreeRoom`, `hero.howItWorks`

### Search Card (HomePage ~1489-1586)
- Title: Uses `search.title`
- Labels: Uses `search.destination`, `search.checkIn`, `search.checkOut`
- Button: Uses `search.searchButton`

### Testimonials Section (~1203-1315)
- Badge: Uses `testimonials.badge`
- Title: Uses `testimonials.title`
- Subtitle: Uses `testimonials.subtitle`
- Stats: Uses `testimonials.averageRating`, `testimonials.happyGuests`, etc.

### Footer (~1972-2030)
- Tagline: Uses `footer.tagline`
- Company: Uses `footer.company`
- Links: Uses `footer.quickLinks`, `footer.legal`, `footer.privacy`, `footer.terms`

## Translation Files

All text content is stored in translation files at:
`/app/frontend/src/locales/`

Languages supported:
- `en.json` - English
- `nl.json` - Dutch
- `de.json` - German
- `fr.json` - French
- `es.json` - Spanish
- `tr.json` - Turkish
- `it.json` - Italian
- `pl.json` - Polish
- `no.json` - Norwegian
- `sv.json` - Swedish
- `da.json` - Danish

## How to Edit Content

1. **For text changes**: Edit the corresponding translation JSON file
2. **For layout changes**: Edit the component in App.js at the line number indicated
3. **For styling changes**: Edit `/app/frontend/src/App.css` or inline Tailwind classes

## Images

- Logo: `/app/frontend/public/assets/logo.png`
- Hero background: Set via URL in HomePage component
- Hotel images: Loaded from Sunhotels API / External MySQL
