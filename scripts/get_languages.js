// Get supported languages from SunHotels API

const username = 'FreestaysTEST';
const password = 'Vision2024!@';
const apiUrl = 'https://xml.sunhotels.net/15/PostGet/StaticXMLAPI.asmx';

const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetLanguages xmlns="http://xml.sunhotels.net/15/">
      <userName>${username}</userName>
      <password>${password}</password>
    </GetLanguages>
  </soap:Body>
</soap:Envelope>`;

console.log('🔍 Fetching supported languages from SunHotels API...\n');

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://xml.sunhotels.net/15/GetLanguages',
  },
  body: xml,
})
  .then(response => response.text())
  .then(xmlText => {
    // Extract language codes
    const isoCodeMatches = xmlText.matchAll(/<isoCode>([^<]+)<\/isoCode>/g);
    const languages = [...isoCodeMatches].map(match => match[1]);
    
    console.log('✅ Supported languages:', languages.join(', '));
    console.log('\n📋 Our locales: tr, en, de, nl, it, el, ru, es, fr');
    console.log('\n🔄 Mapping:');
    
    const ourLocales = ['tr', 'en', 'de', 'nl', 'it', 'el', 'ru', 'es', 'fr'];
    ourLocales.forEach(locale => {
      const supported = languages.includes(locale);
      const mapped = supported ? locale : 'en';
      console.log(`  ${locale} -> ${mapped} ${supported ? '✅' : '⚠️ (fallback to en)'}`);
    });
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
