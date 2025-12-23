# API Test Notları

## Backend Endpoint Yapısı (Swagger'dan)

### Authentication
- `POST /api/v1/Auth/login` - Kullanıcı girişi
- `POST /api/v1/Auth/refresh-token` - Token yenileme
- `POST /api/v1/Auth/register` - Yeni kullanıcı kaydı

### Admin Dashboard
- `GET /api/v1/admin/dashboard` - Tüm dashboard verileri (tek endpoint)

**⚠️ Backend Gereksinimi:**

Backend'in bu endpoint'ten döndürmesi gereken format:

```json
{
  "stats": {
    "totalBookings": 1247,
    "totalRevenue": 485920,
    "totalCustomers": 892,
    "commission": 48592,
    "bookingsGrowth": 12.5,
    "revenueGrowth": 8.3
  },
  "recentBookings": [
    {
      "id": "BK-001",
      "customer": "Ahmet Kaya",
      "type": "hotel",
      "hotel": "İstanbul Grand Hotel",
      "amount": 1200,
      "status": "confirmed",
      "date": "2025-12-16T10:30:00Z"
    }
  ],
  "topDestinations": [
    {
      "name": "İstanbul",
      "bookings": 450,
      "percent": 36
    }
  ]
}
```

**Mevcut Durum:**
- ✅ Endpoint var: `/api/v1/admin/dashboard`
- ❌ Response schema Swagger'da tanımlı değil
- ❌ Backend muhtemelen farklı format dönüyor veya boş

**Frontend Davranışı:**
- API'den doğru format gelirse → Gerçek veri gösterir
- API hata dönerse veya format yanlışsa → Mock data kullanır
- Console'da detaylı bilgi verir

### Diğer Admin Endpoints
- `GET /api/v1/admin/users` - Kullanıcı listesi
- `GET /api/v1/admin/bookings` - Rezervasyon listesi
- `GET /api/v1/admin/coupons` - Kupon listesi
- `GET /api/v1/admin/customers` - Müşteri listesi

## Frontend Değişiklikleri

### ✅ Yapılan Düzeltmeler

1. **Dashboard API Endpoint** 
   - Önceki: 3 ayrı endpoint (`/stats`, `/recent-bookings`, `/popular-destinations`)
   - Yeni: Tek endpoint (`/admin/dashboard`)

2. **Auth Endpoints**
   - Login: `/Auth/login` ✅
   - Register: `/Auth/register` ✅
   - Refresh: `/Auth/refresh-token` ✅

3. **Error Handling İyileştirmeleri**
   - Detaylı error logging
   - Content-type kontrolü
   - Response headers logging
   - Daha açıklayıcı hata mesajları

4. **Token Management**
   - Login'de cookie + localStorage
   - Logout'ta tam temizlik
   - Middleware protection
   - API request token check

## Test Adımları

### 1. Backend Kontrolü
```bash
# Backend çalışıyor mu?
curl https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/admin/dashboard

# Beklenen: 401 Unauthorized (token yok)
```

### 2. Login Test
```bash
# Login yapıp token al
curl -X POST https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@freestays.com","password":"Admin123!"}'
```

### 3. Dashboard Test
```bash
# Token ile dashboard'a istek at
curl https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Olası Sorunlar ve Çözümler

### 1. CORS Hatası
**Sorun:** Backend CORS ayarları
**Çözüm:** Backend'de `localhost:3000` izin ver

### 2. 404 Not Found
**Sorun:** Endpoint yolu yanlış
**Çözüm:** Swagger'daki tam yolu kullan: `/api/v1/admin/dashboard`

### 3. 401 Unauthorized
**Sorun:** Token geçersiz veya eksik
**Çözüm:** Login yapıp yeni token al

### 4. Response Format Uyumsuzluğu
**Sorun:** Backend farklı format dönüyor
**Çözüm:** Console'dan response'u kontrol et, TypeScript type'ları güncelle

## Swagger URL
https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/swagger/index.html
