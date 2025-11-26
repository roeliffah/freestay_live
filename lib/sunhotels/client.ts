// SunHotels API Client
import { XMLParser } from 'fast-xml-parser';
import type { SearchRequest, SearchResponse, HotelDetailResponse, Hotel } from './types';
import featuredHotels from '@/data/featured-hotels.json';

const SUNHOTELS_API_URL = process.env.NEXT_PUBLIC_SUNHOTELS_API_URL || 'http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx';
const SUNHOTELS_USERNAME = process.env.NEXT_PUBLIC_SUNHOTELS_USERNAME || 'FreestaysTEST';
const SUNHOTELS_PASSWORD = process.env.NEXT_PUBLIC_SUNHOTELS_PASSWORD || 'Vision2024!@';

export class SunHotelsClient {
  private username: string;
  private password: string;
  private apiUrl: string;

  // SunHotels API desteklediği diller: en, es, sv, de, fr, fi, pl, no, da, it, zh-Hans, ru, pt, zh-Hant, ko, nl, hu, cs, ja
  // tr ve el desteklenmiyor, onlar için 'en' kullanıyoruz
  private languageMap: Record<string, string> = {
    'tr': 'en', // Turkish not supported, use English
    'en': 'en',
    'de': 'de',
    'nl': 'nl',
    'it': 'it',
    'el': 'en', // Greek not supported, use English
    'ru': 'ru',
    'es': 'es',
    'fr': 'fr',
  };

  constructor() {
    this.username = SUNHOTELS_USERNAME;
    this.password = SUNHOTELS_PASSWORD;
    this.apiUrl = SUNHOTELS_API_URL;
  }

  private mapLanguage(locale: string): string {
    return this.languageMap[locale] || 'en';
  }

  private async getStaticHotelData(hotelId: string, language: string): Promise<Partial<Hotel>> {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetStaticHotelsAndRooms xmlns="http://xml.sunhotels.net/15/">
      <userName>${this.username}</userName>
      <password>${this.password}</password>
      <language>${language}</language>
      <hotelId>${hotelId}</hotelId>
    </GetStaticHotelsAndRooms>
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://xml.sunhotels.net/15/GetStaticHotelsAndRooms',
        },
        body: xml,
      });

      if (!response.ok) {
        console.warn(`⚠️ GetStaticHotelsAndRooms API returned ${response.status}`);
        return {};
      }

      const xmlText = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
      });

      const result = parser.parse(xmlText);
      const envelope = result['soap:Envelope'] || result['soapenv:Envelope'] || result.Envelope;
      const body = envelope?.['soap:Body'] || envelope?.['soapenv:Body'] || envelope?.Body;
      const responseNode = body?.GetStaticHotelsAndRoomsResponse || body?.getStaticHotelsAndRoomsResponse || {};
      const hotelsNode = responseNode.GetStaticHotelsAndRoomsResult || responseNode.getStaticHotelsAndRoomsResult || {};
      
      let hotelsData = hotelsNode.hotels?.hotel || hotelsNode.Hotels?.Hotel || [];
      if (!Array.isArray(hotelsData)) {
        hotelsData = [hotelsData];
      }

      if (hotelsData.length === 0) {
        console.warn(`⚠️ No static data found for hotel ${hotelId}`);
        return {};
      }

      const hotelData = hotelsData[0];
      
      // Parse images
      let imagesData = hotelData.Images?.Image || hotelData.images?.image || [];
      if (!Array.isArray(imagesData)) {
        imagesData = [imagesData];
      }
      
      const images = imagesData
        .filter((img: any) => img && (typeof img === 'string' || img['#text'] || img.url))
        .map((img: any, index: number) => ({
          url: typeof img === 'string' ? img : (img['#text'] || img.url || img.Url || ''),
          order: index + 1,
        }))
        .filter((img: any) => img.url);

      // Parse facilities
      let facilitiesData = hotelData.Facilities?.Facility || hotelData.facilities?.facility || [];
      if (!Array.isArray(facilitiesData)) {
        facilitiesData = [facilitiesData];
      }
      
      const facilities = facilitiesData
        .filter((f: any) => f)
        .map((f: any) => typeof f === 'string' ? f : (f['#text'] || f.name || f.Name || ''))
        .filter((f: string) => f);

      console.log(`✅ Loaded static data for hotel ${hotelId}`);

      return {
        hotelName: String(hotelData.Name || hotelData.name || ''),
        category: parseInt(String(hotelData.Category || hotelData.category || '3')),
        categoryName: `${hotelData.Category || hotelData.category || 3} Star`,
        address: String(hotelData.Address || hotelData.address || ''),
        description: String(hotelData.Description || hotelData.description || ''),
        location: {
          latitude: parseFloat(String(hotelData.Latitude || hotelData.latitude || '0')),
          longitude: parseFloat(String(hotelData.Longitude || hotelData.longitude || '0')),
        },
        images: images.length > 0 ? images : undefined,
        facilities: facilities.length > 0 ? facilities : undefined,
        checkInTime: String(hotelData.CheckInTime || hotelData.checkInTime || '14:00'),
        checkOutTime: String(hotelData.CheckOutTime || hotelData.checkOutTime || '12:00'),
      };
    } catch (error) {
      console.warn('⚠️ Failed to fetch static hotel data:', error);
      return {};
    }
  }

  private buildXMLRequest(method: string, body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://xml.sunhotels.net/">
      <Username>${this.username}</Username>
      <Password>${this.password}</Password>
      ${body}
    </${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  async searchHotels(request: SearchRequest): Promise<SearchResponse> {
    // Calculate totals for API
    const totalAdults = request.rooms.reduce((sum, room) => sum + room.adult, 0);
    const totalChildren = request.rooms.reduce((sum, room) => sum + room.child, 0);

    const mappedLanguage = this.mapLanguage(request.language || 'en');
    
    const body = `
      <userName>${this.username}</userName>
      <password>${this.password}</password>
      <language>${mappedLanguage}</language>
      <currencies>${request.currency || 'EUR'}</currencies>
      <checkInDate>${request.checkIn}</checkInDate>
      <checkOutDate>${request.checkOut}</checkOutDate>
      <numberOfRooms>${request.rooms.length}</numberOfRooms>
      ${request.destinationId ? `<destinationID>${request.destinationId}</destinationID>` : ''}
      ${!request.destinationId && request.destination ? `<destination>${request.destination}</destination>` : ''}
      <numberOfAdults>${totalAdults}</numberOfAdults>
      <numberOfChildren>${totalChildren}</numberOfChildren>
      <showCoordinates>true</showCoordinates>
    `;

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Search xmlns="http://xml.sunhotels.net/15/">
      ${body}
    </Search>
  </soap:Body>
</soap:Envelope>`;

    try {
      console.log('🔍 SunHotels LIVE API Request:', {
        url: this.apiUrl,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        destinationId: request.destinationId,
        destination: request.destination,
        language: mappedLanguage,
        currency: request.currency || 'EUR',
        rooms: request.rooms.length,
        adults: totalAdults,
        children: totalChildren,
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://xml.sunhotels.net/15/Search',
        },
        body: xml,
      });

      const xmlText = await response.text();
      console.log('📥 SunHotels API Response:', {
        status: response.status,
        statusText: response.statusText,
        contentLength: xmlText.length,
      });

      if (!response.ok) {
        console.warn(`⚠️ API returned ${response.status}, falling back to featured hotels`);
        return this.parseMockSearchResponse(request.destination);
      }
      
      // Try to parse real XML response
      try {
        const parsedResponse = this.parseXMLSearchResponse(xmlText);
        if (parsedResponse.hotels.length > 0) {
          console.log(`✅ Successfully parsed ${parsedResponse.hotels.length} hotels from LIVE API`);
          return { ...parsedResponse, isFromAPI: true };
        } else {
          console.warn('⚠️ API returned 0 hotels, falling back to mock data');
        }
      } catch (parseError) {
        console.warn('⚠️ XML parsing failed, falling back to mock data');
        if (process.env.NODE_ENV === 'development') {
          console.error('Parse error details:', parseError);
          console.log('Raw XML (first 500 chars):', xmlText.substring(0, 500));
        }
      }
      
      // Fallback to featured hotels
      console.log('📦 Using FEATURED HOTELS (demo mode)');
      return { ...this.parseMockSearchResponse(request.destination), isFromAPI: false };
    } catch (error) {
      console.error('❌ SunHotels API Connection Error:', error);
      console.log('📦 Using FEATURED HOTELS due to connection error');
      return { ...this.parseMockSearchResponse(request.destination), isFromAPI: false };
    }
  }

  async getHotelDetail(hotelId: string, request: SearchRequest): Promise<HotelDetailResponse> {
    const mappedLanguage = this.mapLanguage(request.language || 'en');
    
    try {
      console.log('🏨 Fetching hotel detail from LIVE API:', {
        hotelId,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        language: mappedLanguage,
      });

      // Step 1: Get static hotel data (name, description, facilities, images)
      const staticHotelData = await this.getStaticHotelData(hotelId, mappedLanguage);
      
      // Step 2: Get room availability and pricing
      const totalAdults = request.rooms.reduce((sum, room) => sum + room.adult, 0);
      const totalChildren = request.rooms.reduce((sum, room) => sum + room.child, 0);
      
      const searchBody = `
        <userName>${this.username}</userName>
        <password>${this.password}</password>
        <language>${mappedLanguage}</language>
        <currencies>${request.currency || 'EUR'}</currencies>
        <checkInDate>${request.checkIn}</checkInDate>
        <checkOutDate>${request.checkOut}</checkOutDate>
        <numberOfRooms>${request.rooms.length}</numberOfRooms>
        <hotelIds>${hotelId}</hotelIds>
        <numberOfAdults>${totalAdults}</numberOfAdults>
        <numberOfChildren>${totalChildren}</numberOfChildren>
        <showCoordinates>true</showCoordinates>
      `;

      const searchXml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Search xmlns="http://xml.sunhotels.net/15/">
      ${searchBody}
    </Search>
  </soap:Body>
</soap:Envelope>`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://xml.sunhotels.net/15/Search',
        },
        body: searchXml,
      });

      const xmlText = await response.text();
      
      if (!response.ok) {
        console.warn(`⚠️ API returned ${response.status} for hotel detail, falling back to mock`);
        return this.parseMockHotelDetail(hotelId);
      }
      
      // Parse XML response and extract room details
      try {
        // Merge static hotel data with basic search data
        const searchResponse = this.parseXMLSearchResponse(xmlText);
        
        if (searchResponse.hotels.length > 0) {
          const basicHotel = searchResponse.hotels[0];
          
          // Merge static data (from GetStaticHotelsAndRooms) with search data
          const hotel: Hotel = {
            hotelId: basicHotel.hotelId,
            hotelName: staticHotelData.hotelName || basicHotel.hotelName || `Hotel ${hotelId}`,
            hotelCode: basicHotel.hotelCode,
            category: staticHotelData.category || basicHotel.category || 3,
            categoryName: staticHotelData.categoryName || basicHotel.categoryName,
            destinationId: basicHotel.destinationId,
            destinationName: basicHotel.destinationName,
            regionId: basicHotel.regionId,
            regionName: basicHotel.regionName,
            address: staticHotelData.address || basicHotel.address || '',
            location: staticHotelData.location || basicHotel.location,
            images: staticHotelData.images || basicHotel.images || [
              { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 1 }
            ],
            facilities: staticHotelData.facilities || basicHotel.facilities || ['WiFi', 'Restaurant', 'Pool'],
            description: staticHotelData.description || basicHotel.description || '',
            checkInTime: staticHotelData.checkInTime || basicHotel.checkInTime || '14:00',
            checkOutTime: staticHotelData.checkOutTime || basicHotel.checkOutTime || '12:00',
            minPrice: basicHotel.minPrice,
            currency: basicHotel.currency,
          };
          
          // Parse room types from the XML
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
          let hotelsData = resultNode.hotels?.hotel || resultNode.Hotels?.Hotel || [];
          if (!Array.isArray(hotelsData)) {
            hotelsData = [hotelsData];
          }
          
          const hotelData = hotelsData[0];
          let roomtypesData = hotelData?.roomtypes?.roomtype || [];
          if (!Array.isArray(roomtypesData)) {
            roomtypesData = [roomtypesData];
          }
          
          // Parse room types with detailed pricing
          const rooms = roomtypesData
            .filter((rt: any) => rt && rt.rooms?.room)
            .flatMap((rt: any) => {
              const roomTypeId = String(rt['roomtype.ID'] || rt.id || '');
              const roomTypeName = String(rt.name || `Room Type ${roomTypeId}`);
              
              let roomsData = rt.rooms.room;
              if (!Array.isArray(roomsData)) {
                roomsData = [roomsData];
              }
              
              return roomsData
                .filter((r: any) => r && r.meals?.meal)
                .flatMap((r: any) => {
                  const roomId = String(r.id || '');
                  const beds = parseInt(String(r.beds || '2'));
                  const extrabeds = parseInt(String(r.extrabeds || '0'));
                  const maxGuests = beds + extrabeds;
                  
                  let mealsData = r.meals.meal;
                  if (!Array.isArray(mealsData)) {
                    mealsData = [mealsData];
                  }
                  
                  return mealsData
                    .filter((m: any) => m && m.prices?.price)
                    .map((m: any) => {
                      const mealId = String(m.id || '');
                      const mealNames: Record<string, string> = {
                        '1': 'Room Only',
                        '2': 'Bed & Breakfast',
                        '3': 'Half Board',
                        '4': 'Full Board',
                        '5': 'All Inclusive',
                        '6': 'Ultra All Inclusive',
                      };
                      const boardTypeName = mealNames[mealId] || 'Room Only';
                      
                      let priceData = m.prices.price;
                      if (Array.isArray(priceData)) {
                        priceData = priceData[0];
                      }
                      
                      const priceValue = typeof priceData === 'object' ? priceData['#text'] : priceData;
                      const price = parseFloat(String(priceValue || '0'));
                      const currency = typeof priceData === 'object' ? priceData['@_currency'] : (request.currency || 'EUR');
                      
                      return {
                        roomTypeId: `${roomTypeId}-${roomId}-${mealId}`,
                        roomTypeName,
                        boardTypeId: mealId,
                        boardTypeName,
                        price,
                        currency: String(currency),
                        available: 1,
                        maxGuests,
                        description: `${beds} beds, ${extrabeds} extra beds available`,
                      };
                    });
                });
            })
            .filter((r: any) => r && r.price > 0);
          
          console.log(`✅ Loaded hotel detail with ${rooms.length} room options`);
          
          return {
            hotel,
            rooms: rooms.length > 0 ? rooms : this.parseMockHotelDetail(hotelId).rooms,
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse hotel detail, using fallback');
        if (process.env.NODE_ENV === 'development') {
          console.error('Parse error:', parseError);
        }
      }
      
      return this.parseMockHotelDetail(hotelId);
    } catch (error) {
      console.error('❌ Hotel detail API error:', error);
      return this.parseMockHotelDetail(hotelId);
    }
  }

  // Parse XML response from SunHotels API
  private parseXMLSearchResponse(xmlText: string): SearchResponse {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    
    const result = parser.parse(xmlText);
    
    // Navigate SOAP envelope structure
    const envelope = result['soap:Envelope'] || result['soapenv:Envelope'] || result.Envelope;
    if (!envelope) {
      throw new Error('Invalid SOAP response structure');
    }
    
    const body = envelope['soap:Body'] || envelope['soapenv:Body'] || envelope.Body;
    if (!body) {
      throw new Error('No SOAP body found');
    }
    
    // Get the response node - Search API format
    const responseNode = body.SearchResponse || body.searchResponse || {};
    const resultNode = responseNode.searchresult || responseNode.SearchResult || {};
    
    // Parse hotels array
    let hotelsData = resultNode.hotels?.hotel || resultNode.Hotels?.Hotel || [];
    if (!Array.isArray(hotelsData)) {
      hotelsData = [hotelsData];
    }
    
    const hotels: SearchResponse['hotels'] = hotelsData
      .filter((h: any) => h && typeof h === 'object')
      .map((hotelData: any) => {
        try {
          // Search API uses 'hotel.id' notation
          const hotelId = String(hotelData['hotel.id'] || hotelData.hotelId || hotelData.HotelId || hotelData.Id || hotelData.id || '');
          
          // Get static hotel data (we'll need to call GetStaticHotelsAndRooms for full details)
          // For now, use hotel.id as identifier
          const hotelName = `Hotel ${hotelId}`;
          const category = 3; // Default, will be replaced with static data
          const destinationName = String(hotelData.destination_id || hotelData.Destination || '');
          const regionName = String(hotelData.resort_id || hotelData.Resort || '');
          const address = '';
          
          // Parse price from roomtypes
          let minPrice = 0;
          const roomtypesData = hotelData.roomtypes?.roomtype || [];
          const roomtypes = Array.isArray(roomtypesData) ? roomtypesData : [roomtypesData];
          
          // Find minimum price from all room types
          for (const roomtype of roomtypes) {
            if (roomtype && roomtype.price) {
              const price = parseFloat(String(roomtype.price));
              if (price > 0 && (minPrice === 0 || price < minPrice)) {
                minPrice = price;
              }
            }
          }
          
          // Parse images
          let imagesData = hotelData.Images?.Image || hotelData.images?.image || hotelData.Photos?.Photo || hotelData.photos?.photo || [];
          if (!Array.isArray(imagesData)) {
            imagesData = [imagesData];
          }
          
          const images = imagesData
            .filter((img: any) => img && (typeof img === 'string' || img['#text'] || img.url))
            .map((img: any, index: number) => ({
              url: typeof img === 'string' ? img : (img['#text'] || img.url || img.Url || ''),
              order: index + 1,
            }))
            .filter((img: any) => img.url);
          
          // Parse facilities
          let facilitiesData = hotelData.Facilities?.Facility || hotelData.facilities?.facility || [];
          if (!Array.isArray(facilitiesData)) {
            facilitiesData = [facilitiesData];
          }
          
          const facilities = facilitiesData
            .filter((f: any) => f)
            .map((f: any) => typeof f === 'string' ? f : (f['#text'] || f.name || f.Name || ''))
            .filter((f: string) => f);
          
          // Parse location
          const latitude = parseFloat(String(hotelData.Latitude || hotelData.latitude || hotelData.Lat || hotelData.lat || '0')) || 0;
          const longitude = parseFloat(String(hotelData.Longitude || hotelData.longitude || hotelData.Lng || hotelData.lng || hotelData.Lon || hotelData.lon || '0')) || 0;
          
          return {
            hotelId,
            hotelName,
            hotelCode: hotelId,
            category,
            categoryName: `${category} Star`,
            destinationId: destinationName.substring(0, 3).toUpperCase() || 'UNK',
            destinationName,
            regionId: regionName.substring(0, 3).toUpperCase() || 'UNK',
            regionName,
            address,
            location: { latitude, longitude },
            images: images.length > 0 ? images : [
              { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 1 }
            ],
            facilities: facilities.length > 0 ? facilities : ['WiFi', 'Restaurant', 'Pool'],
            description: String(hotelData.Description || hotelData.description || ''),
            checkInTime: String(hotelData.CheckInTime || hotelData.checkInTime || '14:00'),
            checkOutTime: String(hotelData.CheckOutTime || hotelData.checkOutTime || '12:00'),
            minPrice,
            currency: String(hotelData.Currency || hotelData.currency || 'TRY'),
          };
        } catch (err) {
          console.warn('Failed to parse hotel data:', err);
          return null;
        }
      })
      .filter((h: any): h is NonNullable<typeof h> => h !== null && h.hotelId !== '' && h.minPrice > 0);

    return {
      searchId: 'API-' + Date.now(),
      total: hotels.length,
      hotels,
    };
  }

  // Featured hotels for homepage demo (only used when API completely fails)
  private parseMockSearchResponse(destination?: string): SearchResponse {
    // Filter by destination if provided
    let hotels = [...featuredHotels];
    
    if (destination) {
      hotels = hotels.filter(h => 
        h.destinationName.toLowerCase().includes(destination.toLowerCase()) ||
        h.country.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    // If no destination match, return random hotels
    if (hotels.length === 0) {
      hotels = [...featuredHotels];
    }
    
    // Randomize and limit to 20 hotels for homepage display
    const shuffled = hotels.sort(() => 0.5 - Math.random()).slice(0, 20).map(h => ({
      ...h,
      checkInTime: '14:00',
      checkOutTime: '12:00',
    }));
    
    console.log('⚠️ FALLBACK: Using featured hotels from homepage data');
    
    return {
      searchId: 'DEMO-' + Date.now(),
      total: shuffled.length,
      hotels: shuffled,
    };
  }

  // Keep old mock for reference (not used)
  private parseOldMockSearchResponse(): SearchResponse {
    return {
      searchId: 'DEMO-' + Date.now(),
      total: 3,
      hotels: [
        {
          hotelId: '1',
          hotelName: 'Grand Luxury Resort & Spa',
          hotelCode: 'GLR001',
          category: 5,
          categoryName: '5 Star',
          destinationId: 'ANT',
          destinationName: 'Antalya',
          regionId: 'LARA',
          regionName: 'Lara',
          address: 'Lara Beach, Antalya, Turkey',
          location: { latitude: 36.8685, longitude: 30.7153 },
          images: [
            { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', order: 1 },
            { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', order: 2 },
          ],
          facilities: ['Pool', 'Spa', 'Restaurant', 'WiFi', 'Gym', 'Beach'],
          description: 'Luxury 5-star resort with spa and beach access',
          checkInTime: '14:00',
          checkOutTime: '12:00',
          minPrice: 2500,
          currency: 'TRY',
        },
        {
          hotelId: '2',
          hotelName: 'Seaside Paradise Hotel',
          hotelCode: 'SPH002',
          category: 4,
          categoryName: '4 Star',
          destinationId: 'ANT',
          destinationName: 'Antalya',
          regionId: 'KEMER',
          regionName: 'Kemer',
          address: 'Kemer Beach, Antalya, Turkey',
          location: { latitude: 36.5984, longitude: 30.5597 },
          images: [
            { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800', order: 1 },
          ],
          facilities: ['Pool', 'Restaurant', 'WiFi', 'Beach'],
          description: 'Beautiful 4-star hotel on Kemer beach',
          checkInTime: '14:00',
          checkOutTime: '12:00',
          minPrice: 1800,
          currency: 'TRY',
        },
        {
          hotelId: '3',
          hotelName: 'Mountain View Resort',
          hotelCode: 'MVR003',
          category: 5,
          categoryName: '5 Star',
          destinationId: 'ANT',
          destinationName: 'Antalya',
          regionId: 'BELEK',
          regionName: 'Belek',
          address: 'Belek, Antalya, Turkey',
          location: { latitude: 36.8625, longitude: 31.0547 },
          images: [
            { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', order: 1 },
          ],
          facilities: ['Pool', 'Spa', 'Restaurant', 'WiFi', 'Golf', 'Gym'],
          description: 'Premium resort with golf course and spa',
          checkInTime: '15:00',
          checkOutTime: '11:00',
          minPrice: 3200,
          currency: 'TRY',
        },
      ],
    };
  }

  private parseMockHotelDetail(hotelId: string): HotelDetailResponse {
    // Search directly in featured hotels without randomization
    let hotel = featuredHotels.find(h => h.hotelId === hotelId);
    
    // If not found, use first hotel from featured hotels (not randomized)
    if (!hotel) {
      console.warn(`⚠️ Hotel ${hotelId} not found in featured hotels, using first available`);
      hotel = featuredHotels[0];
    }
    
    // Ensure hotel has required fields (Hotel type from types.ts)
    const hotelWithDefaults: Hotel = {
      ...hotel,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      description: hotel.description || '',
    };

    return {
      hotel: hotelWithDefaults,
      rooms: [
        {
          roomTypeId: 'STD',
          roomTypeName: 'Standard Room',
          boardTypeId: 'BB',
          boardTypeName: 'Bed & Breakfast',
          price: hotelWithDefaults.minPrice || 2500,
          currency: hotelWithDefaults.currency || 'EUR',
          available: 5,
          maxGuests: 2,
        },
        {
          roomTypeId: 'DLX',
          roomTypeName: 'Deluxe Room',
          boardTypeId: 'HB',
          boardTypeName: 'Half Board',
          price: (hotelWithDefaults.minPrice || 2500) * 1.3,
          currency: hotelWithDefaults.currency || 'EUR',
          available: 3,
          maxGuests: 3,
        },
        {
          roomTypeId: 'SUI',
          roomTypeName: 'Suite',
          boardTypeId: 'FB',
          boardTypeName: 'Full Board',
          price: (hotelWithDefaults.minPrice || 2500) * 1.8,
          currency: hotelWithDefaults.currency || 'EUR',
          available: 2,
          maxGuests: 4,
        },
      ],
    };
  }
}

export const sunHotelsClient = new SunHotelsClient();
