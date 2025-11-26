// Generate 5 hotels per featured destination
const fs = require('fs');
const path = require('path');

const featuredDestinations = require('../data/featured-destinations.json');

console.log('🏨 Generating featured hotels for demo...\n');

const hotelPrefixes = ['Grand', 'Luxury', 'Royal', 'Paradise', 'Sunset', 'Golden', 'Ocean', 'Beach', 'Resort', 'Premium', 'Elite', 'Crystal', 'Diamond', 'Pearl', 'Blue', 'Imperial', 'Crown', 'Palace', 'Seaside', 'Marina'];
const hotelSuffixes = ['Hotel', 'Resort & Spa', 'Beach Resort', 'Palace Hotel', 'Suites', 'Beach Club', 'Collection', 'Retreat', 'Resort', 'Grand Hotel'];

const facilities = [
  'Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Restaurant', 
  'Beach Bar', 'Room Service', 'Airport Shuttle', 'Private Beach', 'Kids Club',
  'Tennis Court', 'Free Parking', 'Air Conditioning', '24/7 Concierge', 'Laundry Service',
  'Water Sports', 'Animation Team', 'Aqua Park', 'A La Carte Restaurants', 'All Inclusive'
];

// City-specific base coordinates
const cityCoords = {
  'Antalya': { lat: 36.88, lon: 30.70 },
  'Istanbul': { lat: 41.01, lon: 28.98 },
  'Bodrum': { lat: 37.04, lon: 27.43 },
  'Alanya': { lat: 36.54, lon: 31.99 },
  'Side': { lat: 36.77, lon: 31.39 },
  'Belek': { lat: 36.86, lon: 31.05 },
  'Barcelona': { lat: 41.38, lon: 2.17 },
  'Madrid': { lat: 40.42, lon: -3.70 },
  'Mallorca': { lat: 39.57, lon: 2.65 },
  'Ibiza': { lat: 38.91, lon: 1.43 },
  'Rome': { lat: 41.90, lon: 12.50 },
  'Venice': { lat: 45.44, lon: 12.32 },
  'Naples': { lat: 40.85, lon: 14.27 },
  'Sorrento': { lat: 40.63, lon: 14.37 },
  'Athens': { lat: 37.98, lon: 23.73 },
  'Santorini': { lat: 36.39, lon: 25.46 },
  'Mykonos': { lat: 37.45, lon: 25.33 },
  'Crete': { lat: 35.24, lon: 25.33 },
  'Rhodes': { lat: 36.43, lon: 28.22 },
  'Corfu': { lat: 39.62, lon: 19.92 },
  'Dubai': { lat: 25.20, lon: 55.27 },
  'Abu Dhabi': { lat: 24.47, lon: 54.37 },
  'Sharjah': { lat: 25.35, lon: 55.39 },
};

// Unsplash images for hotels
const hotelImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
];

function generateHotel(destination, index) {
  const prefix = hotelPrefixes[Math.floor(Math.random() * hotelPrefixes.length)];
  const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
  const hotelName = `${prefix} ${destination.name} ${suffix}`;
  const category = [4, 4, 5, 5, 5][index % 5]; // Mix of 4 and 5 star
  
  const hotelId = `${destination.id}${String(index + 1).padStart(3, '0')}`;
  
  // Get base coordinates
  const coords = cityCoords[destination.name] || { lat: 0, lon: 0 };
  const latOffset = (Math.random() - 0.5) * 0.3;
  const lonOffset = (Math.random() - 0.5) * 0.3;
  
  // Select random facilities (10-15 per hotel)
  const selectedFacilities = facilities
    .sort(() => 0.5 - Math.random())
    .slice(0, 10 + Math.floor(Math.random() * 6));
  
  // Select random images (5 per hotel)
  const selectedImages = hotelImages
    .sort(() => 0.5 - Math.random())
    .slice(0, 5)
    .map((url, i) => ({ url, order: i + 1 }));
  
  // Price based on category and country
  const priceMultiplier = {
    'United Arab Emirates': 1.5,
    'Italy': 1.3,
    'Spain': 1.2,
    'Greece': 1.0,
    'Turkey': 0.8,
  }[destination.country] || 1.0;
  
  const basePrice = category * 60 * priceMultiplier;
  const minPrice = Math.floor(basePrice + Math.random() * 100);
  const maxPrice = Math.floor(minPrice * 2.8);
  
  return {
    hotelId,
    hotelName,
    hotelCode: hotelId,
    category,
    categoryName: `${category} Star`,
    destinationId: destination.id,
    destinationName: destination.name,
    regionId: destination.id,
    regionName: destination.name,
    country: destination.country,
    countryCode: destination.countryCode,
    address: `${hotelName}, ${destination.name}, ${destination.country}`,
    location: {
      latitude: coords.lat + latOffset,
      longitude: coords.lon + lonOffset,
    },
    images: selectedImages,
    facilities: selectedFacilities,
    description: `${hotelName} is a luxurious ${category}-star property located in the beautiful ${destination.name}, ${destination.country}. Experience world-class amenities, exceptional service, and breathtaking views. Perfect for your dream vacation.`,
    minPrice,
    maxPrice,
    currency: 'EUR',
  };
}

// Generate 5 hotels per destination
const featuredHotels = [];
featuredDestinations.all.forEach(dest => {
  console.log(`🏨 ${dest.name}, ${dest.country}:`);
  for (let i = 0; i < 5; i++) {
    const hotel = generateHotel(dest, i);
    featuredHotels.push(hotel);
    console.log(`  ✅ ${hotel.hotelName} (${hotel.category}⭐ - €${hotel.minPrice})`);
  }
});

console.log(`\n📊 Total featured hotels: ${featuredHotels.length}`);

// Save to JSON
const dataDir = path.join(__dirname, '..', 'data');
const outputPath = path.join(dataDir, 'featured-hotels.json');

fs.writeFileSync(outputPath, JSON.stringify(featuredHotels, null, 2), 'utf-8');

console.log(`💾 Saved to: ${outputPath}`);
console.log('\n✨ Done! Featured hotels ready for demo presentation.');
