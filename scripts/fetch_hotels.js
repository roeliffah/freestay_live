// Fetch hotels from popular destinations
const fs = require('fs');
const path = require('path');

const username = 'FreestaysTEST';
const password = 'Vision2024!@';
const apiUrl = 'https://xml.sunhotels.net/15/PostGet/StaticXMLAPI.asmx';

// Read destinations
const dataDir = path.join(__dirname, '..', 'data');
const destPath = path.join(dataDir, 'destinations.json');
const destinations = JSON.parse(fs.readFileSync(destPath, 'utf-8'));

console.log('🏨 Fetching hotels from popular destinations...\n');

// Get popular tourist destinations
const popularNames = ['Antalya', 'Istanbul', 'Dubai', 'Bangkok', 'Phuket', 'Barcelona', 'Paris', 'London', 'Rome', 'Athens', 'Miami', 'Cancun', 'Maldives', 'Bali'];
const topDestinations = destinations.all
  .filter(d => popularNames.some(p => d.name.toLowerCase().includes(p.toLowerCase())))
  .filter(d => !d.name.includes('(')) // Exclude US states like "Athens (GA)"
  .slice(0, 10);

console.log(`📍 Selected ${topDestinations.length} popular destinations:`);
topDestinations.forEach(d => console.log(`  - ${d.name}, ${d.country} (ID: ${d.id})`));
console.log('');

async function fetchHotelsForDestination(destination) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetStaticHotelsAndRooms xmlns="http://xml.sunhotels.net/15/">
      <userName>${username}</userName>
      <password>${password}</password>
      <language>en</language>
      <destinationID>${destination.id}</destinationID>
      <resortID></resortID>
      <hotelID></hotelID>
    </GetStaticHotelsAndRooms>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://xml.sunhotels.net/15/GetStaticHotelsAndRooms',
      },
      body: xml,
    });

    const xmlText = await response.text();
    
    // Parse hotels
    const hotelMatches = xmlText.matchAll(/<hotel>(.*?)<\/hotel>/gs);
    const hotels = [];
    
    for (const match of hotelMatches) {
      const hotelXml = match[1];
      
      const hotelId = hotelXml.match(/<hotel_id>(\d+)<\/hotel_id>/)?.[1];
      const hotelName = hotelXml.match(/<HotelName>([^<]+)<\/HotelName>/)?.[1];
      const category = hotelXml.match(/<Category>(\d+)<\/Category>/)?.[1];
      const address = hotelXml.match(/<Address>([^<]+)<\/Address>/)?.[1];
      const latitude = hotelXml.match(/<Latitude>([^<]+)<\/Latitude>/)?.[1];
      const longitude = hotelXml.match(/<Longitude>([^<]+)<\/Longitude>/)?.[1];
      
      // Get images
      const imageMatches = hotelXml.matchAll(/<Image.*?>(https?:\/\/[^<]+)<\/Image>/g);
      const images = [...imageMatches].map(m => m[1]).slice(0, 5);
      
      // Get facilities
      const facilityMatches = hotelXml.matchAll(/<FeatureName>([^<]+)<\/FeatureName>/g);
      const facilities = [...facilityMatches].map(m => m[1]).slice(0, 10);
      
      if (hotelId && hotelName) {
        hotels.push({
          hotelId,
          hotelName,
          hotelCode: hotelId,
          category: parseInt(category) || 3,
          categoryName: `${category || 3} Star`,
          destinationId: destination.id,
          destinationName: destination.name,
          regionId: destination.id,
          regionName: destination.name,
          country: destination.country,
          countryCode: destination.countryCode,
          address: address || '',
          location: {
            latitude: parseFloat(latitude) || 0,
            longitude: parseFloat(longitude) || 0,
          },
          images: images.length > 0 ? images.map((url, i) => ({ url, order: i + 1 })) : [
            { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 1 }
          ],
          facilities,
          description: `${hotelName} is located in ${destination.name}, ${destination.country}`,
          minPrice: Math.floor(Math.random() * 500) + 100,
          maxPrice: Math.floor(Math.random() * 1000) + 500,
          currency: 'EUR',
        });
      }
    }
    
    console.log(`  ✅ ${destination.name}: ${hotels.length} hotels`);
    return hotels;
  } catch (error) {
    console.log(`  ⚠️  ${destination.name}: Error - ${error.message}`);
    return [];
  }
}

(async () => {
  const allHotels = [];
  
  for (const dest of topDestinations) {
    const hotels = await fetchHotelsForDestination(dest);
    allHotels.push(...hotels.slice(0, 6)); // Max 6 per destination
    
    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Total hotels fetched: ${allHotels.length}`);
  
  // Save to JSON
  const filePath = path.join(dataDir, 'hotels.json');
  fs.writeFileSync(filePath, JSON.stringify(allHotels, null, 2), 'utf-8');
  
  console.log(`💾 Saved to: ${filePath}`);
  console.log('\n✨ Done! You can now use these hotels in your app.');
})();
