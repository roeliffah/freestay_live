// Generate realistic mock hotels from popular destinations
const fs = require('fs');
const path = require('path');

// Read destinations
const dataDir = path.join(__dirname, '..', 'data');
const destPath = path.join(dataDir, 'destinations.json');
const destinations = JSON.parse(fs.readFileSync(destPath, 'utf-8'));

// Popular tourist destinations
const popularNames = ['Antalya', 'Istanbul', 'Dubai', 'Bangkok', 'Phuket', 'Barcelona', 'Paris', 'London', 'Rome', 'Athens', 'Miami', 'Cancun', 'Maldives', 'Bali', 'Bodrum', 'Marmaris', 'Alanya', 'Kusadasi'];
const topDestinations = destinations.all
  .filter(d => popularNames.some(p => d.name.toLowerCase() === p.toLowerCase()))
  .slice(0, 15);

console.log('🏨 Generating mock hotels for popular destinations...\n');
console.log(`📍 Selected ${topDestinations.length} destinations:`);
topDestinations.forEach(d => console.log(`  - ${d.name}, ${d.country}`));
console.log('');

const hotelPrefixes = ['Grand', 'Luxury', 'Royal', 'Paradise', 'Sunset', 'Golden', 'Ocean', 'Beach', 'Resort', 'Premium', 'Elite', 'Crystal', 'Diamond', 'Pearl', 'Blue'];
const hotelSuffixes = ['Hotel', 'Resort', 'Spa', 'Palace', 'Suites', 'Beach Club', 'Collection', 'Retreat'];

const facilities = [
  'Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', 'Restaurant', 
  'Bar', 'Room Service', 'Airport Shuttle', 'Beach Access', 'Kids Club',
  'Tennis Court', 'Parking', 'Air Conditioning', 'Concierge', 'Laundry'
];

function generateHotel(destination, index) {
  const prefix = hotelPrefixes[Math.floor(Math.random() * hotelPrefixes.length)];
  const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
  const hotelName = `${prefix} ${destination.name} ${suffix}`;
  const category = [3, 4, 4, 5, 5][Math.floor(Math.random() * 5)]; // More 4-5 star hotels
  
  const hotelId = `${destination.id}${String(index + 1).padStart(3, '0')}`;
  
  // Random realistic coordinates near destination
  const latOffset = (Math.random() - 0.5) * 0.5;
  const lonOffset = (Math.random() - 0.5) * 0.5;
  
  // Base coordinates for known cities
  const coords = {
    'Antalya': { lat: 36.88, lon: 30.70 },
    'Istanbul': { lat: 41.01, lon: 28.98 },
    'Athens': { lat: 37.98, lon: 23.73 },
    'Bangkok': { lat: 13.75, lon: 100.52 },
    'Dubai': { lat: 25.20, lon: 55.27 },
    'Barcelona': { lat: 41.38, lon: 2.17 },
    'Paris': { lat: 48.86, lon: 2.35 },
    'London': { lat: 51.51, lon: -0.13 },
    'Rome': { lat: 41.90, lon: 12.50 },
    'Bali': { lat: -8.34, lon: 115.09 },
    'Phuket': { lat: 7.88, lon: 98.39 },
    'Maldives': { lat: 3.20, lon: 73.22 },
    'Miami': { lat: 25.76, lon: -80.19 },
    'Cancun': { lat: 21.16, lon: -86.85 },
  }[destination.name] || { lat: 0, lon: 0 };
  
  // Hotel images from Unsplash
  const images = [
    `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`,
    `https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800`,
    `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800`,
    `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800`,
    `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800`,
  ];
  
  // Select random facilities
  const selectedFacilities = facilities.sort(() => 0.5 - Math.random()).slice(0, 8 + Math.floor(Math.random() * 4));
  
  // Price based on category and destination popularity
  const basePrice = category * 50;
  const minPrice = Math.floor(basePrice + Math.random() * 100);
  const maxPrice = Math.floor(minPrice * 2.5);
  
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
    address: `${hotelName}, ${destination.name}`,
    location: {
      latitude: coords.lat + latOffset,
      longitude: coords.lon + lonOffset,
    },
    images: images.map((url, i) => ({ url, order: i + 1 })),
    facilities: selectedFacilities,
    description: `${hotelName} is a ${category}-star property located in the heart of ${destination.name}, ${destination.country}. Enjoy world-class amenities and exceptional service.`,
    minPrice,
    maxPrice,
    currency: 'EUR',
  };
}

// Generate 5 hotels per destination
const allHotels = [];
topDestinations.forEach(dest => {
  for (let i = 0; i < 5; i++) {
    allHotels.push(generateHotel(dest, i));
  }
  console.log(`  ✅ ${dest.name}: 5 hotels generated`);
});

console.log(`\n📊 Total hotels generated: ${allHotels.length}`);

// Save to JSON
const filePath = path.join(dataDir, 'hotels.json');
fs.writeFileSync(filePath, JSON.stringify(allHotels, null, 2), 'utf-8');

console.log(`💾 Saved to: ${filePath}`);
console.log('\n✨ Done! Mock hotels ready for your app.');
