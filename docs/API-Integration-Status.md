# FreeStays Ana Sayfa - API Entegrasyon Durumu

**Son Güncelleme:** 27 Aralık 2025
**Durum:** ✅ Frontend API'ye Bağlandı

---

## ✅ HAZIR VE KULLANILAN ENDPOINT'LER

### 1. ✅ Featured Hotels (Popular Hotels)
**Endpoint:** `GET /api/v1/FeaturedContent/hotels`
**Durum:** ✅ Swagger'da mevcut, Frontend'e entegre edildi

**Frontend Bileşen:** `/components/home/PopularHotels.tsx`

**Kullanım:**
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/FeaturedContent/hotels?count=10&category=Luxury`
);
```

**Query Parameters:**
- `count` (integer, optional, default: 10) - Döndürülecek otel sayısı
- `season` (string, optional) - Sezon filtresi (Summer, Winter, Spring, Fall, AllYear)
- `category` (string, optional) - Kategori filtresi (Luxury, Romantic, Family, Budget, Business, Beach, Mountain, City)

**Response Örneği:**
```json
[
  {
    "hotelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "hotelName": "Grand Resort & Spa",
    "location": "Antalya",
    "country": "Turkey",
    "starRating": 5,
    "reviewScore": 4.8,
    "imageUrl": "https://cdn.freestays.com/hotels/123.jpg",
    "priority": 1,
    "status": "Active",
    "season": "AllYear",
    "category": "Luxury",
    "validFrom": "2025-01-01",
    "validUntil": "2025-12-31",
    "campaignName": "Winter Special",
    "discountPercentage": 15
  }
]
```

---

### 2. ✅ Featured Destinations (Popular Destinations)
**Endpoint:** `GET /api/v1/FeaturedContent/destinations`
**Durum:** ✅ Swagger'da mevcut, Frontend'e entegre edildi

**Frontend Bileşen:** `/components/home/PopularDestinations.tsx`

**Kullanım:**
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/FeaturedContent/destinations?count=5`
);
```

**Query Parameters:**
- `count` (integer, optional, default: 10) - Döndürülecek destinasyon sayısı
- `season` (string, optional) - Sezon filtresi

**Response Örneği:**
```json
[
  {
    "destinationId": "12",
    "destinationName": "Antalya",
    "country": "Turkey",
    "countryCode": "TR",
    "hotelCount": 1250,
    "imageUrl": "https://cdn.freestays.com/destinations/antalya.jpg",
    "description": "Beautiful Mediterranean resort city",
    "priority": 1,
    "status": "Active",
    "season": "AllYear"
  }
]
```

---

### 3. ✅ Romantic Hotels (Romantic Tours)
**Endpoint:** `GET /api/v1/FeaturedContent/hotels?category=Romantic`
**Durum:** ✅ Featured Hotels endpoint'inin Romantic kategorisiyle kullanılıyor

**Frontend Bileşen:** `/components/home/RomanticTours.tsx`

**Kullanım:**
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/FeaturedContent/hotels?count=6&category=Romantic`
);
```

---

## 🔧 FRONTEND KONFIGÜRASYONU

### Environment Variables
**Dosya:** `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5240
NEXT_PUBLIC_DEFAULT_LOCALE=tr
```

### Güncellenmiş Komponentlar
1. ✅ `/components/home/PopularHotels.tsx` - FeaturedContent/hotels API'sine bağlandı
2. ✅ `/components/home/PopularDestinations.tsx` - FeaturedContent/destinations API'sine bağlandı
3. ✅ `/components/home/RomanticTours.tsx` - FeaturedContent/hotels?category=Romantic API'sine bağlandı

### Fallback Mekanizması
Tüm komponentler API başarısız olursa otomatik olarak fallback (yedek) dataya geçer:
- Kullanıcı deneyimi kesintisiz devam eder
- Console'da hata loglama yapılır
- Production'da bu fallback mekanizması geçici olarak kullanılabilir

---

## 🎯 BACKEND TARAFINDA YAPILMASI GEREKENLER

### 1. ⚠️ Admin Panel UI Eksik

Featured Content yönetimi için admin panel sayfaları oluşturulmalı:

#### a) Featured Hotels Yönetim Sayfası
**Sayfa:** `/admin/featured-content/hotels`

**Özellikler:**
- Otel listesi (grid/table view)
- Yeni featured hotel ekleme
- Mevcut featured hotel düzenleme/silme
- Drag & drop ile priority/sıralama
- Kategori seçimi (Luxury, Romantic, Family, vb.)
- Sezon seçimi (Summer, Winter, AllYear, vb.)
- Görsel yükleme (kullanılabilir endpoint: `POST /api/v1/admin/upload/image`)
- Geçerlilik tarihleri
- İndirim yüzdesi

**Kullanılacak API Endpoint'leri:**
```typescript
// Liste
GET /api/v1/admin/featured-content/hotels?page=1&pageSize=20&status=Active&season=Summer&category=Luxury

// Oluştur
POST /api/v1/admin/featured-content/hotels
Body: {
  "hotelId": "uuid",
  "priority": 1,
  "status": "Active",
  "season": "AllYear",
  "category": "Luxury",
  "validFrom": "2025-01-01",
  "validUntil": "2025-12-31",
  "campaignName": "Winter Special",
  "discountPercentage": 15
}

// Güncelle
PUT /api/v1/admin/featured-content/hotels/{id}

// Sil
DELETE /api/v1/admin/featured-content/hotels/{id}

// Priority güncelle
PATCH /api/v1/admin/featured-content/hotels/{id}/priority
Body: { "newPriority": 5 }

// Toplu priority güncelle (drag & drop için)
PATCH /api/v1/admin/featured-content/hotels/bulk-priority
Body: {
  "items": [
    { "id": "uuid1", "priority": 1 },
    { "id": "uuid2", "priority": 2 }
  ]
}
```

#### b) Featured Destinations Yönetim Sayfası
**Sayfa:** `/admin/featured-content/destinations`

**Özellikler:**
- Destinasyon listesi
- Yeni featured destination ekleme
- Mevcut destination düzenleme/silme
- Priority yönetimi
- Görsel yükleme
- Açıklama düzenleme

**Kullanılacak API Endpoint'leri:**
```typescript
// Liste
GET /api/v1/admin/featured-content/destinations?status=Active&season=Summer

// Oluştur
POST /api/v1/admin/featured-content/destinations
Body: {
  "destinationId": "12",
  "destinationName": "Antalya",
  "countryCode": "TR",
  "country": "Turkey",
  "priority": 1,
  "status": "Active",
  "season": "AllYear",
  "image": "https://...",
  "description": "Beautiful city...",
  "validFrom": "2025-01-01",
  "validUntil": "2025-12-31"
}

// Güncelle
PUT /api/v1/admin/featured-content/destinations/{id}

// Sil
DELETE /api/v1/admin/featured-content/destinations/{id}
```

---

### 2. ⚠️ Veritabanı Seed Data Gerekli

İlk kullanım için örnek featured content eklenmelisiniz:

```sql
-- Featured Hotels için örnek data (En yüksek puanlı oteller)
INSERT INTO featured_hotels (hotel_id, priority, status, season, category, valid_from, valid_until, discount_percentage)
SELECT 
    id, 
    ROW_NUMBER() OVER (ORDER BY category DESC, review_score DESC) as priority,
    'Active' as status,
    'AllYear' as season,
    CASE 
        WHEN category = 5 AND review_score >= 4.7 THEN 'Luxury'
        WHEN themes LIKE '%romantic%' THEN 'Romantic'
        WHEN themes LIKE '%family%' THEN 'Family'
        ELSE 'Beach'
    END as category,
    NOW() as valid_from,
    NOW() + INTERVAL '1 year' as valid_until,
    NULL as discount_percentage
FROM sunhotels_hotels
WHERE category >= 4 AND review_score >= 4.5
LIMIT 20;

-- Featured Destinations için örnek data (En çok otele sahip destinasyonlar)
INSERT INTO featured_destinations (destination_id, destination_name, country, country_code, priority, status, season, image_url, description)
SELECT 
    id::text, 
    name, 
    country, 
    country_code, 
    ROW_NUMBER() OVER (ORDER BY hotel_count DESC) as priority,
    'Active' as status,
    'AllYear' as season,
    '' as image_url,
    description
FROM sunhotels_destinations
WHERE hotel_count > 100
ORDER BY hotel_count DESC
LIMIT 10;
```

---

### 3. ⚠️ Performance İyileştirmeleri

#### Cache Stratejisi
Response cache eklenmelisiniz:

```csharp
// FeaturedContentController.cs içinde
[ResponseCache(Duration = 1800, VaryByQueryKeys = new[] { "count", "season", "category" })]
public async Task<IActionResult> GetFeaturedHotels(int count = 10, string? season = null, string? category = null)
{
    // ...
}

[ResponseCache(Duration = 3600, VaryByQueryKeys = new[] { "count", "season" })]
public async Task<IActionResult> GetFeaturedDestinations(int count = 10, string? season = null)
{
    // ...
}
```

**Cache Süreleri:**
- Featured Hotels: 30 dakika (1800 saniye)
- Featured Destinations: 1 saat (3600 saniye)

#### Database Indexes
```sql
-- Priority bazlı sıralama için
CREATE INDEX IF NOT EXISTS idx_featured_hotels_priority 
ON featured_hotels(priority ASC, status) WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_featured_destinations_priority 
ON featured_destinations(priority ASC, status) WHERE status = 'Active';

-- Kategori ve sezon filtresi için
CREATE INDEX IF NOT EXISTS idx_featured_hotels_filters 
ON featured_hotels(category, season, status) WHERE status = 'Active';

-- Join performansı için
CREATE INDEX IF NOT EXISTS idx_featured_hotels_hotel_id 
ON featured_hotels(hotel_id);

CREATE INDEX IF NOT EXISTS idx_featured_destinations_dest_id 
ON featured_destinations(destination_id);

-- Tarih bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_featured_hotels_validity 
ON featured_hotels(valid_from, valid_until) WHERE status = 'Active';
```

---

### 4. ⚠️ Translation Support

Featured content için çoklu dil desteği eklenmelisiniz:

**Seçenek 1: JSON Column (Basit)**
```sql
ALTER TABLE featured_hotels 
ADD COLUMN campaign_name_translations JSONB;

ALTER TABLE featured_destinations 
ADD COLUMN description_translations JSONB;

-- Örnek data
UPDATE featured_hotels 
SET campaign_name_translations = '{"tr": "Kış Özel", "en": "Winter Special"}'::jsonb
WHERE id = 'uuid';
```

**Seçenek 2: Ayrı Translation Tablosu (Daha esnek)**
```sql
CREATE TABLE featured_content_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'hotel' veya 'destination'
    entity_id UUID NOT NULL,
    locale VARCHAR(5) NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'campaignName', 'description', vb.
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, locale, field_name)
);

CREATE INDEX idx_translations_lookup 
ON featured_content_translations(entity_type, entity_id, locale);
```

---

## 🧪 TESTING

### API Test Komutları

#### 1. Featured Hotels (Luxury)
```bash
curl -X GET "http://localhost:5240/api/v1/FeaturedContent/hotels?count=10&category=Luxury" \
     -H "Accept: application/json"
```

#### 2. Featured Hotels (Romantic)
```bash
curl -X GET "http://localhost:5240/api/v1/FeaturedContent/hotels?count=6&category=Romantic" \
     -H "Accept: application/json"
```

#### 3. Featured Destinations
```bash
curl -X GET "http://localhost:5240/api/v1/FeaturedContent/destinations?count=5" \
     -H "Accept: application/json"
```

#### 4. Admin - Yeni Featured Hotel Ekleme
```bash
curl -X POST "http://localhost:5240/api/v1/admin/featured-content/hotels" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "hotelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
       "priority": 1,
       "status": "Active",
       "season": "AllYear",
       "category": "Luxury",
       "validFrom": "2025-01-01T00:00:00Z",
       "validUntil": "2025-12-31T23:59:59Z",
       "campaignName": "Winter Special",
       "discountPercentage": 15
     }'
```

---

## 📋 DEPLOYMENT CHECKLIST

### Backend
- [ ] FeaturedContent endpoint'leri test edildi (public erişim)
- [ ] Admin endpoint'leri test edildi (JWT authentication)
- [ ] Seed data script'i hazırlandı ve çalıştırıldı
- [ ] Response cache aktif edildi
- [ ] Database index'leri oluşturuldu
- [ ] CORS ayarları yapıldı (Next.js origin için)
- [ ] Error handling test edildi
- [ ] Image upload endpoint çalışıyor
- [ ] Translation desteği eklendi (opsiyonel)
- [ ] Rate limiting yapılandırıldı
- [ ] Logging/monitoring aktif

### Frontend
- [x] .env.local dosyası oluşturuldu
- [x] API URL konfigüre edildi
- [x] PopularHotels API'ye bağlandı
- [x] PopularDestinations API'ye bağlandı
- [x] RomanticTours API'ye bağlandı
- [ ] Error handling test edildi
- [ ] Loading states test edildi
- [ ] Empty states test edildi
- [ ] Production build test edildi

### Admin Panel
- [ ] Featured Hotels yönetim sayfası oluşturuldu
- [ ] Featured Destinations yönetim sayfası oluşturuldu
- [ ] Görsel yükleme entegre edildi
- [ ] Drag & drop sıralama çalışıyor
- [ ] Form validasyonları çalışıyor
- [ ] Başarı/hata mesajları gösteriliyor

---

## 🔗 İlgili Dökümanlar

- [Backend API Requirements (Eski - Referans)](./Backend-API-Requirements-Homepage.md)
- [Backend Affiliate API Requirements](./Backend-Affiliate-API-Requirements.md)
- [Swagger Documentation](http://localhost:5240/swagger)

---

## 📝 NOTLAR

1. **Kategori Enum'ları**: Backend'de `HotelCategory` enum'ı kullanılıyor. Frontend'de aynı string değerleri kullanmalısınız:
   - Luxury
   - Romantic
   - Family
   - Budget
   - Business
   - Beach
   - Mountain
   - City

2. **Sezon Enum'ları**: `Season` enum değerleri:
   - AllYear (0)
   - Summer (1)
   - Winter (2)
   - Spring (3)
   - Fall (4)

3. **Status Enum'ları**: `FeaturedContentStatus` değerleri:
   - Draft (0)
   - Active (1)
   - Inactive (2)

4. **CORS**: Backend'de Next.js development URL'i (http://localhost:3000) ve production URL'i whitelist'e eklenmelisiniz.

5. **Image Upload**: Featured content için görseller `POST /api/v1/admin/upload/image?folder=featured-content` endpoint'i ile yüklenmelisiniz.

---

**Son Kontrol:** 27 Aralık 2025, 14:30
**Kontrol Eden:** AI Assistant
**Durum:** ✅ Frontend hazır, Backend API'ler mevcut, Admin panel UI ve seed data bekleniyor
