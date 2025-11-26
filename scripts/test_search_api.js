// Test SunHotels Search API
// Node.js 18+ has built-in fetch

const username = 'FreestaysTEST';
const password = 'Vision2024!@';
const apiUrl = 'http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx';

// Summer 2026 dates (more likely to have availability)
const checkIn = new Date('2026-07-01');
const checkInStr = checkIn.toISOString().split('T')[0];

// Check-out 7 days later
const checkOut = new Date('2026-07-08');
const checkOutStr = checkOut.toISOString().split('T')[0];

// Antalya destination ID from our featured destinations
const destinationID = '228'; // Antalya

const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Search xmlns="http://xml.sunhotels.net/15/">
      <userName>${username}</userName>
      <password>${password}</password>
      <language>en</language>
      <currencies>EUR</currencies>
      <checkInDate>${checkInStr}</checkInDate>
      <checkOutDate>${checkOutStr}</checkOutDate>
      <numberOfRooms>1</numberOfRooms>
      <destinationID>${destinationID}</destinationID>
      <numberOfAdults>2</numberOfAdults>
      <numberOfChildren>0</numberOfChildren>
      <showCoordinates>true</showCoordinates>
    </Search>
  </soap:Body>
</soap:Envelope>`;

console.log('🔍 Testing SunHotels Search API with REAL DESTINATION...');
console.log('Check-in:', checkInStr);
console.log('Check-out:', checkOutStr);
console.log('Destination: Antalya (ID: 228)');
console.log('Language: en');
console.log('Currency: EUR');
console.log('');

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://xml.sunhotels.net/15/Search',
  },
  body: xml,
})
  .then(response => {
    console.log('📥 Response Status:', response.status, response.statusText);
    return response.text();
  })
  .then(xmlText => {
    console.log('📦 Response Length:', xmlText.length, 'bytes');
    console.log('');
    
    // Count hotels
    const hotelMatches = xmlText.match(/<hotel/g);
    const hotelCount = hotelMatches ? hotelMatches.length : 0;
    console.log('🏨 Hotels found:', hotelCount);
    
    if (hotelCount > 0) {
      console.log('✅ SUCCESS! API is working!');
      console.log('');
      console.log('First 1000 chars of response:');
      console.log(xmlText.substring(0, 1000));
    } else {
      console.log('⚠️  No hotels found in response');
      console.log('First 500 chars:');
      console.log(xmlText.substring(0, 500));
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
