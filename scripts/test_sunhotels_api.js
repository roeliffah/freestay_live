// Test SunHotels API directly
const testSunHotelsAPI = async () => {
  const username = 'FreestaysTEST';
  const password = 'Vision2024!@';
  const apiUrl = 'http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx';

  const checkIn = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]; // 7 days from now
  const checkOut = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]; // 10 days from now

  // Try different XML format
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetAvailability xmlns="http://xml.sunhotels.net/">
      <Username>${username}</Username>
      <Password>${password}</Password>
      <CheckIn>${checkIn}</CheckIn>
      <CheckOut>${checkOut}</CheckOut>
      <Nationality>TR</Nationality>
      <Currency>TRY</Currency>
      <Language>tr</Language>
      <Room1>
        <Adult>2</Adult>
        <Child>0</Child>
      </Room1>
    </GetAvailability>
  </soap12:Body>
</soap12:Envelope>`;

  console.log('🔍 Testing SunHotels API...');
  console.log('CheckIn:', checkIn);
  console.log('CheckOut:', checkOut);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://xml.sunhotels.net/GetAvailability',
      },
      body: xml,
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      return;
    }

    const xmlText = await response.text();
    console.log('📥 Response received, length:', xmlText.length);
    console.log('\n--- First 2000 characters of XML ---');
    console.log(xmlText.substring(0, 2000));
    console.log('\n--- Last 500 characters of XML ---');
    console.log(xmlText.substring(xmlText.length - 500));

    // Try to find hotel elements
    const hotelMatches = xmlText.match(/<Hotel[^>]*>/gi);
    if (hotelMatches) {
      console.log('\n✅ Found', hotelMatches.length, 'hotel elements in response');
    } else {
      console.log('\n⚠️ No <Hotel> elements found in response');
    }

    // Look for error messages
    if (xmlText.includes('Error') || xmlText.includes('error')) {
      console.log('\n⚠️ Response contains error keywords');
      const errorMatch = xmlText.match(/<Error[^>]*>(.*?)<\/Error>/i);
      if (errorMatch) {
        console.log('Error:', errorMatch[1]);
      }
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
};

// Run the test
testSunHotelsAPI();
