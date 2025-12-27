# Backend API Requirements - Affiliate Programs

## 📋 Genel Bakış

Admin panelinde **Affiliate Programs** sekmesi eklendi. Bu özellik için backend API'sine yeni alanlar eklenmelidir.

---

## 🔧 Gerekli Değişiklikler

### 1. **Yeni Public Endpoint (Token Gerektirmez)**

Frontend Header ve Travel CTA Cards için **public endpoint** oluşturulmalıdır:

```
GET /api/v1/public/settings/affiliate-programs
```

**Response Format (Nested JSON):**
```json
{
  "excursions": {
    "active": true,
    "affiliateCode": "https://getyourguide.com/?partner_id=U00202819",
    "widgetCode": "<div data-vi-partner-id=\"U00202819\" data-vi-widget-ref=\"W-46e0b4fc-2d24-4a08-8178-2464b72e88a1\"></div>\n<script async src=\"https://www.viator.com/orion/partner/widget.js\"></script>"
  },
  "carRental": {
    "active": false,
    "affiliateCode": null,
    "widgetCode": null
  },
  "flightBooking": {
    "active": true,
    "affiliateCode": "https://skyscanner.com/?associateid=ABC123",
    "widgetCode": "<div id=\"flight-widget\"></div>\n<script src=\"https://widget.skyscanner.com/widget.js\"></script>"
  }
}
```

**Özellikler:**
- ✅ **Authentication gerektirmez** (public endpoint)
- ✅ **Cached olabilir** (performans için)
- ✅ **CORS enabled** olmalı
- ✅ Sadece `active: true` olan servisleri döndürebilir (opsiyonel optimizasyon)

---

### 2. **Database Schema Güncellemesi**

`SiteSettings` tablosuna (veya ilgili ayarlar tablosuna) aşağıdaki **9 yeni alan** eklenmelidir:

```sql
-- Excursions / Tours & Activities
excursionsActive BOOLEAN DEFAULT false,
excursionsAffiliateCode NVARCHAR(500) NULL,
excursionsWidgetCode NVARCHAR(MAX) NULL,

-- Car Rental
carRentalActive BOOLEAN DEFAULT false,
carRentalAffiliateCode NVARCHAR(500) NULL,
carRentalWidgetCode NVARCHAR(MAX) NULL,

-- Flight Booking
flightBookingActive BOOLEAN DEFAULT false,
flightBookingAffiliateCode NVARCHAR(500) NULL,
flightBookingWidgetCode NVARCHAR(MAX) NULL
```

**Alan Açıklamaları:**
- `*Active`: Boolean - Servisin aktif/pasif durumu
- `*AffiliateCode`: String - Affiliate partner link URL'i (max 500 karakter)
- `*WidgetCode`: Text - HTML/JavaScript widget embed kodu (sınırsız karakter - NVARCHAR(MAX))

---

### 3. **Admin Endpoint (Token Gerektirir)**

#### **Mevcut Endpoint:** 
```
PUT /api/v1/admin/settings/site
```

**Authentication:** Bearer Token gereklidir

#### **Request Body (Flat Format - Değişiklik YOK):**

```json
{
  "excursionsActive": true,
  "excursionsAffiliateCode": "https://getyourguide.com/?partner_id=U00202819",
  "excursionsWidgetCode": "<div data-vi-partner-id=\"U00202819\" data-vi-widget-ref=\"W-46e0b4fc-2d24-4a08-8178-2464b72e88a1\"></div>\n<script async src=\"https://www.viator.com/orion/partner/widget.js\"></script>",
  
  "carRentalActive": false,
  "carRentalAffiliateCode": "",
  "carRentalWidgetCode": "",
  
  "flightBookingActive": true,
  "flightBookingAffiliateCode": "https://skyscanner.com/?associateid=ABC123",
  "flightBookingWidgetCode": "<div id=\"flight-widget\"></div>\n<script src=\"https://widget.skyscanner.com/widget.js\"></script>"
}
```

**Frontend Kullanım Örneği:**
```typescript
// Admin panelde kaydetme
await fetch('/api/v1/admin/settings/site', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    excursionsActive: true,
    excursionsWidgetCode: '<div>...</div>'
  })
});
```

---

### 4. **DTO (Data Transfer Object) Güncelleme**

C# .NET Core için örnek model:

```csharp
public class UpdateSiteSettingsDto
{
    // ... Mevcut alanlar ...
    
    // Affiliate Programs
    public bool? ExcursionsActive { get; set; }
    public string? ExcursionsAffiliateCode { get; set; }
    public string? ExcursionsWidgetCode { get; set; }
    
    public bool? CarRentalActive { get; set; }
    public string? CarRentalAffiliateCode { get; set; }
    public string? CarRentalWidgetCode { get; set; }
    
    public bool? FlightBookingActive { get; set; }
    public string? FlightBookingAffiliateCode { get; set; }
    public string? FlightBookingWidgetCode { get; set; }
}
```

---

### 5. **Admin GET Endpoint (Token Gerektirir)**

#### **Mevcut Endpoint:**
```
GET /api/v1/admin/settings
```

**Authentication:** Bearer Token gereklidir

#### **Response Body'ye Eklenmesi Gerekenler (Flat Format):**

```json
{
  "data": {
    "siteName": "FreeStays",
    // ... diğer mevcut alanlar ...
    
    "excursionsActive": true,
    "excursionsAffiliateCode": "https://getyourguide.com/?partner_id=U00202819",
    "excursionsWidgetCode": "<div data-vi-partner-id=\"U00202819\" data-vi-widget-ref=\"W-46e0b4fc-2d24-4a08-8178-2464b72e88a1\"></div>\n<script async src=\"https://www.viator.com/orion/partner/widget.js\"></script>",
    
    "carRentalActive": false,
    "carRentalAffiliateCode": null,
    "carRentalWidgetCode": null,
    
    "flightBookingActive": true,
    "flightBookingAffiliateCode": "https://skyscanner.com/?associateid=ABC123",
    "flightBookingWidgetCode": "<div id=\"flight-widget\"></div>\n<script src=\"https://widget.skyscanner.com/widget.js\"></script>"
  }
}
```

---

## 🌐 Public vs Admin Endpoints Karşılaştırması

| Özellik | Public Endpoint | Admin Endpoint |
|---------|----------------|----------------|
| **URL** | `/api/v1/public/settings/affiliate-programs` | `/api/v1/admin/settings` (GET)<br>`/api/v1/admin/settings/site` (PUT) |
| **Authentication** | ❌ Gerekli değil | ✅ Bearer Token gerekli |
| **Response Format** | Nested JSON (`excursions: { active, affiliateCode, widgetCode }`) | Flat JSON (`excursionsActive, excursionsAffiliateCode, excursionsWidgetCode`) |
| **Kullanım Yeri** | Header, Travel CTA Cards (frontend public) | Admin Panel (settings form) |
| **Cache** | ✅ Cache yapılabilir (5-10 dakika) | ❌ Cache yapılmaz (her zaman fresh data) |
| **HTTP Method** | GET only | GET, PUT |

---

## 🔒 Güvenlik Önerileri

### 1. **XSS Koruması**
Widget kodları HTML/JavaScript içerdiği için **XSS saldırılarına** karşı dikkatli olunmalıdır:

```csharp
// Backend'de widget kodunu sanitize etmeyin (kullanıcı kasıtlı olarak script ekliyor)
// Ancak authorization kontrolü yapın
[Authorize(Roles = "Admin")]
public async Task<IActionResult> UpdateSiteSettings([FromBody] UpdateSiteSettingsDto dto)
{
    // Sadece admin kullanıcılar güncelleyebilir
}
```

### 2. **Frontend'de Güvenli Render**
Widget kodları frontend'de `dangerouslySetInnerHTML` ile render edilecek, bu yüzden **sadece admin'den gelen** kodlar kullanılmalıdır.

### 3. **Validation Kuralları**
```csharp
// Widget code boş olabilir (nullable)
// Affiliate code URL formatında olmalı (opsiyonel validasyon)
if (!string.IsNullOrEmpty(dto.ExcursionsAffiliateCode))
{
    if (!Uri.TryCreate(dto.ExcursionsAffiliateCode, UriKind.Absolute, out _))
    {
        return BadRequest("Invalid affiliate URL format");
    }
}
```

---

## 🧪 Test Senaryoları

### Test Case 1: Public Endpoint - Affiliate Programs Okuma
```bash
GET /api/v1/public/settings/affiliate-programs

# Beklenen Response: 200 OK
{
  "excursions": {
    "active": true,
    "affiliateCode": "https://getyourguide.com/?partner_id=U00202819",
    "widgetCode": "<div>...</div>"
  },
  "carRental": {
    "active": false,
    "affiliateCode": null,
    "widgetCode": null
  },
  "flightBooking": {
    "active": true,
    "affiliateCode": "https://skyscanner.com/?associateid=ABC123",
    "widgetCode": "<div>...</div>"
  }
}
```

### Test Case 2: Admin - Widget Code Kaydetme
```bash
PUT /api/v1/admin/settings/site
Authorization: Bearer {token}
Content-Type: application/json

{
  "excursionsActive": true,
  "excursionsWidgetCode": "<div data-vi-partner-id=\"U00202819\"></div>\n<script async src=\"https://www.viator.com/orion/partner/widget.js\"></script>"
}

# Beklenen: 200 OK, widget kodu kaydedilmeli
```

### Test Case 3: Admin - Settings Okuma
```bash
GET /api/v1/admin/settings
Authorization: Bearer {token}

# Beklenen: Response içinde flat format ile excursionsWidgetCode alanı olmalı
```

### Test Case 4: Public Endpoint - Cache Kontrolü
```bash
# İlk istek
GET /api/v1/public/settings/affiliate-programs
# Response Time: ~50ms (database query)

# İkinci istek (10 saniye sonra)
GET /api/v1/public/settings/affiliate-programs
# Response Time: ~5ms (cached)
```

---

## 📊 Backend Controller Örneği (C#)

```csharp
// PublicSettingsController.cs
[ApiController]
[Route("api/v1/public/settings")]
public class PublicSettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly IMemoryCache _cache;

    public PublicSettingsController(ISettingsService settingsService, IMemoryCache cache)
    {
        _settingsService = settingsService;
        _cache = cache;
    }

    [HttpGet("affiliate-programs")]
    [ResponseCache(Duration = 300)] // 5 dakika cache
    public async Task<IActionResult> GetAffiliatePrograms()
    {
        var cacheKey = "affiliate-programs";
        
        if (!_cache.TryGetValue(cacheKey, out object cachedData))
        {
            var settings = await _settingsService.GetSiteSettingsAsync();
            
            var response = new
            {
                excursions = new
                {
                    active = settings.ExcursionsActive,
                    affiliateCode = settings.ExcursionsAffiliateCode,
                    widgetCode = settings.ExcursionsWidgetCode
                },
                carRental = new
                {
                    active = settings.CarRentalActive,
                    affiliateCode = settings.CarRentalAffiliateCode,
                    widgetCode = settings.CarRentalWidgetCode
                },
                flightBooking = new
                {
                    active = settings.FlightBookingActive,
                    affiliateCode = settings.FlightBookingAffiliateCode,
                    widgetCode = settings.FlightBookingWidgetCode
                }
            };

            _cache.Set(cacheKey, response, TimeSpan.FromMinutes(5));
            cachedData = response;
        }

        return Ok(cachedData);
    }
}
```

---

## 📊 Database Migration Örneği (Entity Framework)

```csharp
public partial class AddAffiliatePrograms : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "ExcursionsActive",
            table: "SiteSettings",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "ExcursionsAffiliateCode",
            table: "SiteSettings",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ExcursionsWidgetCode",
            table: "SiteSettings",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "CarRentalActive",
            table: "SiteSettings",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "CarRentalAffiliateCode",
            table: "SiteSettings",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CarRentalWidgetCode",
            table: "SiteSettings",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "FlightBookingActive",
            table: "SiteSettings",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "FlightBookingAffiliateCode",
            table: "SiteSettings",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "FlightBookingWidgetCode",
            table: "SiteSettings",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ExcursionsActive", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "ExcursionsAffiliateCode", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "ExcursionsWidgetCode", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "CarRentalActive", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "CarRentalAffiliateCode", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "CarRentalWidgetCode", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "FlightBookingActive", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "FlightBookingAffiliateCode", table: "SiteSettings");
        migrationBuilder.DropColumn(name: "FlightBookingWidgetCode", table: "SiteSettings");
    }
}
```

---

## 🎯 Frontend Kullanım Örneği

Widget kodları frontend'de şu şekilde render edilecek:

```tsx
// components/home/TravelWidget.tsx
export function TravelWidget({ widgetCode }: { widgetCode?: string }) {
  if (!widgetCode) return null;
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: widgetCode }}
      className="travel-widget-container"
    />
  );
}
```

---

## ✅ Checklist

Backend development ekibi için kontrol listesi:

**Database & Migration:**
- [ ] Database'e 9 yeni alan eklendi
- [ ] Migration dosyası oluşturuldu ve çalıştırıldı

**Public Endpoint (YENİ):**
- [ ] `GET /api/v1/public/settings/affiliate-programs` oluşturuldu
- [ ] Response nested JSON formatında (`excursions: { active, affiliateCode, widgetCode }`)
- [ ] Authentication gerektirmiyor (public)
- [ ] CORS enabled
- [ ] Cache mekanizması eklendi (5-10 dakika)

**Admin Endpoints (MEVCUT - Güncellendi):**
- [ ] `PUT /api/v1/admin/settings/site` endpoint'i flat format kabul ediyor
- [ ] `GET /api/v1/admin/settings` response'una flat format eklenmiş
- [ ] Bearer Token authentication çalışıyor
- [ ] DTO modelleri güncellendi

**Güvenlik & Validation:**
- [ ] Admin authorization kontrolü yapıldı
- [ ] URL validation (opsiyonel) eklendi
- [ ] XSS güvenlik notları okundu

**Test & Dokümantasyon:**
- [ ] Tüm test senaryoları başarılı
- [ ] Swagger/OpenAPI dokümantasyonu güncellendi
- [ ] Cache invalidation test edildi (admin update sonrası public cache temizleniyor mu?)

---

## 🔄 Cache Invalidation Önerisi

Admin panelde ayarlar güncellendiğinde, public endpoint cache'i temizlenmelidir:

```csharp
[Authorize(Roles = "Admin")]
[HttpPut("settings/site")]
public async Task<IActionResult> UpdateSiteSettings([FromBody] UpdateSiteSettingsDto dto)
{
    await _settingsService.UpdateSiteSettingsAsync(dto);
    
    // Public endpoint cache'ini temizle
    _cache.Remove("affiliate-programs");
    
    return Ok();
}
```

---

## 📞 İletişim

Sorularınız için: Frontend Development Team

**Tarih:** 27 Aralık 2025
