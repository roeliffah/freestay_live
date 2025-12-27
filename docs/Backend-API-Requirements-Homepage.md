# Backend API Eksiklikleri ve İyileştirmeler

## Frontend Tarafında Yapılan Değişiklikler

✅ **1. Header Dropdown Sorunu Çözüldü**
- Dropdown menülere `onMouseEnter` ve `onMouseLeave` event handler'ları eklendi
- Z-index ve group class'ları ile hover durumu iyileştirildi

✅ **2. Choose Accommodation Type (Room Types)**
- Mevcut tema/feature bazlı gösterim korundu
- Backend'den sunhotels themes veya features kullanılabilir

✅ **3. Popular Hotels Güncellendi**
- Fiyat gösterimi kaldırıldı
- Yıldız sayısına göre sıralama eklendi (`category` field)
- `/api/v1/sunhotels/hotels?minStars=4` endpoint'i kullanılıyor
- Fallback data mekanizması eklendi

✅ **4. Popular Destinations Yeniden Tasarlandı**
- 1 büyük (sol) + 4 küçük (2x2 grid sağda) layout
- Ülke bazlı gösterim için hazır

✅ **5. Romantic Tours Bölümü Eklendi**
- Fransa, Venedik, İtalya, Türkiye, İspanya otellerini gösterecek
- Yeni component oluşturuldu

## Backend'de Eksik Olan ve Eklenmesi Gereken Endpointler

### 1. Popüler Destinasyonlar (Ülke Bazlı)
**Endpoint:** `GET /api/v1/public/popular-destinations`

**Query Parameters:**
- `locale` (string): Dil kodu (tr, en, de, vb.)
- `count` (int, default: 5): Kaç destinasyon döneceği

**Response:**
```json
[
  {
    "id": "string",
    "name": "Antalya",
    "country": "Turkey",
    "countryCode": "TR",
    "hotelCount": 1250,
    "image": "https://...",
    "priority": 1
  }
]
```

**Backend İmplementasyon:**
- `sunhotels_destinations` tablosundan ülkelere göre grup
- Her ülkeden en çok oteli olan destinasyonu seç
- Otel sayısına göre sırala
- Çeviri için `sunhotels_destination_translations` kullan

---

### 2. Popüler Oteller (Yıldız & Review Bazlı)
**Endpoint:** `GET /api/v1/public/featured-hotels`

**Query Parameters:**
- `locale` (string): Dil kodu
- `count` (int, default: 10): Kaç otel döneceği
- `minStars` (int, default: 4): Minimum yıldız sayısı

**Response:**
```json
[
  {
    "hotelId": 123,
    "name": "Grand Resort & Spa",
    "city": "Antalya", 
    "country": "Turkey",
    "category": 5,
    "reviewScore": 4.8,
    "images": [
      {
        "url": "https://...",
        "order": 1
      }
    ]
  }
]
```

**Backend İmplementasyon:**
- `sunhotels_hotels` tablosundan
- `category` (yıldız) ve `reviewScore`'a göre sırala
- Çeviri için `sunhotels_hotel_translations` kullan
- Cache kullan (Redis)

---

### 3. Romantik Turlar
**Endpoint:** `GET /api/v1/public/romantic-hotels`

**Query Parameters:**
- `locale` (string): Dil kodu
- `count` (int, default: 6): Kaç otel döneceği

**Response:**
```json
[
  {
    "hotelId": 123,
    "name": "Parisian Romance Hotel",
    "city": "Paris",
    "country": "France",
    "countryCode": "FR",
    "category": 5,
    "reviewScore": 4.9,
    "images": [
      {
        "url": "https://...",
        "order": 1
      }
    ]
  }
]
```

**Backend İmplementasyon:**
- Belirli ülkelerden (FR, IT, TR, ES, GR) otelleri getir
- `themes` tablosunda "Romantic", "Honeymoon", "Couples" gibi temalar var mı kontrol et
- Yüksek review score'lu otelleri seç
- Çeviri için `sunhotels_hotel_translations` kullan

---

### 4. Konaklama Türleri (Features/Themes Bazlı)
**Endpoint:** `GET /api/v1/public/accommodation-types`

**Query Parameters:**
- `locale` (string): Dil kodu

**Response:**
```json
[
  {
    "id": 1,
    "name": "Otel",
    "nameEn": "Hotel",
    "description": "Konforlu konaklama",
    "icon": "hotel",
    "count": 5234
  },
  {
    "id": 2,
    "name": "Tatil Köyü",
    "nameEn": "Resort",
    "description": "Her şey dahil",
    "icon": "umbrella",
    "count": 2341
  }
]
```

**Backend İmplementasyon:**
- `sunhotels_themes` veya `sunhotels_features` tablosunu kullan
- Kategori bazlı gruplama yap
- Her kategorideki otel sayısını hesapla
- Cache kullan

---

## Veritabanı Optimizasyonları

### 1. Indexes
```sql
-- Popüler oteller için
CREATE INDEX idx_hotels_category_review ON sunhotels_hotels(category DESC, review_score DESC);

-- Destinasyon ülke grupları için
CREATE INDEX idx_destinations_country ON sunhotels_destinations(country_code);

-- Tema/feature filtreleme için
CREATE INDEX idx_hotel_themes ON sunhotels_hotel_themes(theme_id);
```

### 2. Cached Queries
- Popular destinations: 1 saat cache
- Popular hotels: 30 dakika cache
- Romantic hotels: 1 saat cache
- Accommodation types: 24 saat cache

---

## Translation Desteği

Tüm endpoint'ler `locale` parametresi ile çağrılmalı:
- Varsayılan: `tr`
- Desteklenen diller: tr, en, de, fr, es, it, nl, ru, el

Backend'de:
```csharp
// Translation helper
public string GetTranslatedName(int entityId, string locale, string tableName)
{
    var translation = _context.Set<Translation>()
        .FirstOrDefault(t => 
            t.EntityId == entityId && 
            t.Locale == locale && 
            t.TableName == tableName);
    
    return translation?.Name ?? GetDefaultName(entityId, tableName);
}
```

---

## Frontend Entegrasyon Notu

Şu anda tüm bileşenler **fallback data** ile çalışıyor. Backend endpoint'leri eklendiğinde:

1. `PopularHotels.tsx` - `/api/v1/public/featured-hotels` kullanacak
2. `PopularDestinations.tsx` - `/api/v1/public/popular-destinations` kullanacak
3. `RomanticTours.tsx` - `/api/v1/public/romantic-hotels` kullanacak
4. `TravelCTACards.tsx` - Mevcut `/api/v1/public/settings/affiliate-programs` kullanıyor ✅

## Performans İyileştirmeleri

1. **Server-Side Rendering (SSR)**: Ana sayfada bu veriler SSR ile getirilebilir
2. **Image Optimization**: Next.js Image component kullanılıyor ✅
3. **Lazy Loading**: Scroll'da lazy load eklenebilir
4. **CDN**: Statik görseller için CDN kullan

---

## Test Senaryoları

1. ✅ Header dropdown hover testi
2. ✅ Popular Hotels yıldız sıralaması
3. ✅ Popular Destinations grid layout (1+4)
4. ✅ Romantic Tours bölümü görünümü
5. ⏳ API'den veri çekme (backend hazır olmadığı için fallback)
6. ⏳ Çoklu dil desteği (backend translation endpoint'i eklenince)
