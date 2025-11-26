const { XMLParser } = require('fast-xml-parser');

const SUNHOTELS_API_URL = 'http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx';
const USERNAME = 'FreestaysTEST';
const PASSWORD = 'Vision2024!@';

// Test with a real hotel ID from Antalya search results
const hotelId = '39359'; // First hotel from our test_search_api.js results
// Use today + 30 days to ensure availability
const today = new Date();
const checkInDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
const checkOutDate = new Date(today.getTime() + 37 * 24 * 60 * 60 * 1000);
const checkIn = checkInDate.toISOString().split('T')[0];
const checkOut = checkOutDate.toISOString().split('T')[0];
const language = 'en';
const currency = 'EUR';
const adults = 2;
const children = 0;
const rooms = 1;

console.log('🏨 Testing SunHotels Hotel Detail API...');
console.log('Hotel ID:', hotelId);
console.log('Check-in:', checkIn);
console.log('Check-out:', checkOut);
console.log('Language:', language);
console.log('Currency:', currency);
console.log('Guests:', adults, 'adults,', children, 'children');
console.log('');

const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Search xmlns="http://xml.sunhotels.net/15/">
      <userName>${USERNAME}</userName>
      <password>${PASSWORD}</password>
      <language>${language}</language>
      <currencies>${currency}</currencies>
      <checkInDate>${checkIn}</checkInDate>
      <checkOutDate>${checkOut}</checkOutDate>
      <numberOfRooms>${rooms}</numberOfRooms>
      <hotelIds>${hotelId}</hotelIds>
      <numberOfAdults>${adults}</numberOfAdults>
      <numberOfChildren>${children}</numberOfChildren>
      <showCoordinates>true</showCoordinates>
    </Search>
  </soap:Body>
</soap:Envelope>`;

async function testHotelDetail() {
  try {
    const response = await fetch(SUNHOTELS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://xml.sunhotels.net/15/Search',
      },
      body: xmlRequest,
    });

    console.log('📥 Response Status:', response.status, response.statusText);
    
    const xmlText = await response.text();
    console.log('📦 Response Length:', xmlText.length, 'bytes');
    console.log('');

    if (!response.ok) {
      console.error('❌ API Error:', response.status);
      console.log('Response:', xmlText.substring(0, 1000));
      return;
    }

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    
    const result = parser.parse(xmlText);
    const envelope = result['soap:Envelope'] || result['soapenv:Envelope'] || result.Envelope;
    const body = envelope['soap:Body'] || envelope['soapenv:Body'] || envelope.Body;
    const responseNode = body.SearchResponse || body.searchResponse || {};
    const resultNode = responseNode.searchresult || responseNode.SearchResult || {};
    let hotelsData = resultNode.hotels?.hotel || [];
    
    if (!Array.isArray(hotelsData)) {
      hotelsData = [hotelsData];
    }

    if (hotelsData.length === 0) {
      console.log('❌ No hotel found with ID:', hotelId);
      return;
    }

    const hotelData = hotelsData[0];
    console.log('✅ Hotel found!');
    console.log('Hotel ID:', hotelData['hotel.id']);
    console.log('Destination ID:', hotelData.destination_id);
    console.log('Resort ID:', hotelData.resort_id);
    console.log('');

    // Parse room types
    let roomtypesData = hotelData?.roomtypes?.roomtype || [];
    if (!Array.isArray(roomtypesData)) {
      roomtypesData = [roomtypesData];
    }

    console.log('🛏️  Room types found:', roomtypesData.length);
    console.log('');

    // Parse all room options
    const roomOptions = [];
    
    for (const rt of roomtypesData) {
      const roomTypeId = rt['roomtype.ID'] || rt.id || 'unknown';
      const roomTypeName = rt.name || `Room Type ${roomTypeId}`;
      
      let roomsData = rt.rooms?.room || [];
      if (!Array.isArray(roomsData)) {
        roomsData = [roomsData];
      }
      
      for (const room of roomsData) {
        const roomId = room.id || '';
        const beds = parseInt(room.beds || '2');
        const extrabeds = parseInt(room.extrabeds || '0');
        
        let mealsData = room.meals?.meal || [];
        if (!Array.isArray(mealsData)) {
          mealsData = [mealsData];
        }
        
        for (const meal of mealsData) {
          const mealId = meal.id || '';
          const mealNames = {
            '1': 'Room Only',
            '2': 'Bed & Breakfast',
            '3': 'Half Board',
            '4': 'Full Board',
            '5': 'All Inclusive',
            '6': 'Ultra All Inclusive',
          };
          const boardTypeName = mealNames[mealId] || 'Room Only';
          
          let priceData = meal.prices?.price;
          if (Array.isArray(priceData)) {
            priceData = priceData[0];
          }
          
          const priceValue = typeof priceData === 'object' ? priceData['#text'] : priceData;
          const price = parseFloat(priceValue || '0');
          const priceCurrency = typeof priceData === 'object' ? priceData['@_currency'] : currency;
          
          if (price > 0) {
            roomOptions.push({
              roomTypeId,
              roomTypeName,
              roomId,
              beds,
              extrabeds,
              mealId,
              boardTypeName,
              price,
              currency: priceCurrency,
            });
          }
        }
      }
    }

    console.log('💰 Total room options with pricing:', roomOptions.length);
    console.log('');

    // Display first 5 options
    console.log('📋 Sample room options:');
    roomOptions.slice(0, 5).forEach((option, idx) => {
      console.log(`${idx + 1}. ${option.roomTypeName || 'Room'}`);
      console.log(`   🍽️  ${option.boardTypeName}`);
      console.log(`   🛏️  ${option.beds} beds + ${option.extrabeds} extra beds`);
      console.log(`   💶 ${option.price.toLocaleString()} ${option.currency}`);
      console.log('');
    });

    if (roomOptions.length > 5) {
      console.log(`... and ${roomOptions.length - 5} more options`);
    }

    // Show min/max prices
    const prices = roomOptions.map(r => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    console.log('💎 Price range:');
    console.log(`   Min: ${minPrice.toLocaleString()} ${roomOptions[0].currency}`);
    console.log(`   Max: ${maxPrice.toLocaleString()} ${roomOptions[0].currency}`);

    console.log('');
    console.log('✅ SUCCESS! Hotel detail API is working!');
    console.log('');
    console.log('Raw XML (first 1000 chars):');
    console.log(xmlText.substring(0, 1000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testHotelDetail();
