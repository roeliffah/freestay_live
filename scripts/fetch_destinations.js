// Fetch real destinations from SunHotels API and save to JSON
const fs = require('fs');
const path = require('path');

const username = 'FreestaysTEST';
const password = 'Vision2024!@';
const apiUrl = 'https://xml.sunhotels.net/15/PostGet/StaticXMLAPI.asmx';

const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetDestinations xmlns="http://xml.sunhotels.net/15/">
      <userName>${username}</userName>
      <password>${password}</password>
      <language>en</language>
      <destinationCode></destinationCode>
      <sortBy>Destination</sortBy>
      <sortOrder>Ascending</sortOrder>
      <exactDestinationMatch>false</exactDestinationMatch>
    </GetDestinations>
  </soap:Body>
</soap:Envelope>`;

console.log('🌍 Fetching destinations from SunHotels API...\n');

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://xml.sunhotels.net/15/GetDestinations',
  },
  body: xml,
})
  .then(response => response.text())
  .then(xmlText => {
    console.log('📦 Response length:', xmlText.length, 'bytes');
    console.log('First 500 chars:', xmlText.substring(0, 500));
    console.log('');
    
    // Parse XML manually (simple regex for demo)
    const destinationMatches = xmlText.matchAll(/<Destination>(.*?)<\/Destination>/gs);
    const destinations = [];
    
    for (const match of destinationMatches) {
      const destXml = match[1];
      
      const destId = destXml.match(/<destination_id>(\d+)<\/destination_id>/)?.[1];
      const destCode = destXml.match(/<DestinationCode>([^<]+)<\/DestinationCode>/)?.[1];
      const destName = destXml.match(/<DestinationName>([^<]+)<\/DestinationName>/)?.[1];
      const countryName = destXml.match(/<CountryName>([^<]+)<\/CountryName>/)?.[1];
      const countryCode = destXml.match(/<CountryCode>([^<]+)<\/CountryCode>/)?.[1];
      
      if (destId && destName && countryName) {
        destinations.push({
          id: destId,
          code: destCode || destId,
          name: destName,
          country: countryName,
          countryCode: countryCode || '',
        });
      }
    }
    
    console.log(`✅ Fetched ${destinations.length} destinations\n`);
    
    // Group by continent/region
    const europe = destinations.filter(d => 
      ['Spain', 'Turkey', 'Greece', 'Italy', 'Portugal', 'France', 'Croatia', 'Cyprus', 'Malta', 'Bulgaria'].includes(d.country)
    ).slice(0, 10);
    
    const asia = destinations.filter(d => 
      ['Thailand', 'United Arab Emirates', 'Maldives', 'Indonesia', 'Sri Lanka', 'India', 'Malaysia', 'Vietnam'].includes(d.country)
    ).slice(0, 10);
    
    const americas = destinations.filter(d => 
      ['United States', 'Mexico', 'Dominican Republic', 'Jamaica', 'Cuba', 'Brazil', 'Costa Rica'].includes(d.country)
    ).slice(0, 10);
    
    const popular = {
      europe,
      asia,
      americas,
      all: destinations, // Keep ALL destinations for search
    };
    
    console.log('📊 Destinations organized:');
    console.log(`  🇪🇺 Europe: ${europe.length} destinations`);
    console.log(`  🌏 Asia: ${asia.length} destinations`);
    console.log(`  🌎 Americas: ${americas.length} destinations`);
    console.log(`  📍 ALL destinations: ${popular.all.length} destinations\n`);
    
    // Find popular tourist cities
    const popularNames = ['Antalya', 'Istanbul', 'Dubai', 'Bangkok', 'Phuket', 'Barcelona', 'Paris', 'London', 'Rome', 'Athens', 'Miami', 'Cancun', 'Maldives', 'Bali'];
    const found = popular.all.filter(d => popularNames.some(p => d.name.toLowerCase().includes(p.toLowerCase())));
    console.log('🌟 Popular tourist destinations found:');
    found.slice(0, 10).forEach(d => console.log(`  - ${d.name}, ${d.country} (ID: ${d.id})`));
    console.log('');
    
    // Save to JSON
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'destinations.json');
    fs.writeFileSync(filePath, JSON.stringify(popular, null, 2), 'utf-8');
    
    console.log(`💾 Saved to: ${filePath}`);
    console.log('\n✨ Done! You can now use these destinations in your app.');
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
