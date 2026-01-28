/**
 * Testimonials Section Content Reference
 * 
 * Location: /app/frontend/src/App.js ~1203-1315
 * 
 * Testimonials are loaded dynamically from the database via API.
 * To manage testimonials, use the Admin Panel.
 */

export const testimonialsContent = {
  // Section header
  badge: 'testimonials.badge',       // "Trusted by Travelers"
  title: 'testimonials.title',       // "What Our Guests Say"
  subtitle: 'testimonials.subtitle', // "Join thousands of happy travelers..."
  
  // Stats bar
  averageRating: 'testimonials.averageRating', // "Average Rating"
  happyGuests: 'testimonials.happyGuests',     // "Happy Guests"
  totalSaved: 'testimonials.totalSaved',       // "Total Saved"
  wouldRecommend: 'testimonials.wouldRecommend', // "Would Recommend"
};

// === STATS VALUES ===
// These are displayed in the testimonials section stats bar
// Edit in App.js ~1291-1312
export const statsValues = {
  averageRating: '4.9',
  happyGuests: '15K+',
  totalSaved: '€2.5M',
  wouldRecommend: '98%',
};

// === API ENDPOINTS ===
// Testimonials are loaded from:
// GET /api/testimonials - Returns approved testimonials for display
// POST /api/testimonials - Submit new testimonial (requires auth)
// Admin can approve/reject at: GET/PUT /api/admin/testimonials
