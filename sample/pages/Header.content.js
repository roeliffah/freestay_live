/**
 * Header Content Reference
 * 
 * Location: /app/frontend/src/App.js ~255-380
 * 
 * To edit text content, modify the translation files in /app/frontend/src/locales/
 */

export const headerContent = {
  // Navigation links
  signIn: 'header.signIn',         // "Sign In"
  lastMinute: 'header.lastMinute', // "Last Minute"
  
  // User menu (when logged in)
  myBookings: 'dashboard.myBookings', // "My Bookings"
  myPass: 'dashboard.myPass',         // "My Pass"
  
  // Pass types
  annualPass: 'pass.annualPass',     // "Annual Pass"
  oneTimePass: 'pass.oneTimePass',   // "One-Time Pass"
};

// === NAVIGATION LINKS ===
export const navigationLinks = [
  { path: '/search', labelKey: 'search.searchButton' },
  { path: '/last-minute', labelKey: 'header.lastMinute', icon: 'Zap' },
  { path: '/dashboard', labelKey: 'dashboard.myBookings', requiresAuth: true },
];

// === LOGO ===
// Logo image is located at: /app/frontend/public/assets/logo.png
// To change the logo, replace this file
export const logoPath = '/assets/logo.png';

// === LANGUAGE SELECTOR ===
// Languages are configured in /app/frontend/src/i18n.js
// Translation files are in /app/frontend/src/locales/
