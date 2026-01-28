/**
 * HomePage Content Reference
 * 
 * This file documents the editable content sections of the HomePage.
 * The actual component is in /app/frontend/src/App.js at line ~1363
 * 
 * To edit text content, modify the translation files in /app/frontend/src/locales/
 */

// === HERO SECTION ===
// Location: App.js ~1421-1487

export const heroContent = {
  // Translation keys used in the hero section:
  badge: 'hero.badge',           // "ROOM IS FREE — You Only Pay For Meals"
  title1: 'hero.title1',         // "Your Room"
  title2: 'hero.title2',         // "is FREE."
  subtitle: 'hero.subtitle',     // "We give our commission back to you..."
  hotelsSave: 'hero.hotelsSave', // "Hotels save 30% vs Booking.com."
  passItToYou: 'hero.passItToYou', // "We pass it to YOU."
  
  // Benefit cards
  roomFree: 'hero.roomFree',       // "Room = FREE"
  payMealsOnly: 'hero.payMealsOnly', // "You pay meals only"
  saved: 'hero.saved',             // "30% Saved"
  noCommissions: 'hero.noCommissions', // "No hotel commissions"
  hotels: 'hero.hotels',           // "450K+ Hotels"
  worldwideAccess: 'hero.worldwideAccess', // "Worldwide access"
  
  // CTA Buttons
  getFreeRoom: 'hero.getFreeRoom',   // "Get Free Room"
  howItWorks: 'hero.howItWorks',     // "How It Works"
};

// === SEARCH CARD ===
// Location: App.js ~1489-1586

export const searchContent = {
  title: 'search.title',            // "Find Your Perfect Stay"
  destination: 'search.destination', // "Where to?"
  checkIn: 'search.checkIn',        // "Check-in"
  checkOut: 'search.checkOut',      // "Check-out"
  searchButton: 'search.searchButton', // "Search Hotels"
  
  // Trust badges
  securePayment: 'cta.securePayment', // "Secure Payment"
  bestPrice: 'cta.bestPrice',       // "Best Price Guarantee"
};

// === HOW IT WORKS SECTION ===
// Location: App.js ~1590-1700

export const howItWorksContent = {
  // This section explains the FreeStays concept
  // Steps are currently hardcoded - can be moved to translations if needed
};

// === FEATURED DESTINATIONS ===
// Location: App.js ~1393-1398

export const featuredDestinations = [
  { name: "Santorini", country: "Greece", hotels: "1,240+", id: "10045" },
  { name: "Barcelona", country: "Spain", hotels: "2,100+", id: "10012" },
  { name: "Vienna", country: "Austria", hotels: "890+", id: "10025" },
  { name: "Amalfi", country: "Italy", hotels: "450+", id: "10078" }
];

// === CTA SECTION ===
// Location: App.js ~1950-1970

export const ctaContent = {
  title: 'cta.title',       // "Ready for Your FREE Room?"
  subtitle: 'cta.subtitle', // "Join thousands of travelers..."
  button: 'cta.button',     // "Start Saving Today"
};

// === BACKGROUND IMAGES ===

export const images = {
  heroBg: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920',
  // To change hero background, update this URL in App.js ~1406
};
