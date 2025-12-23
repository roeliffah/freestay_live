# Admin Dashboard API Entegrasyonu

## 🔐 Kimlik Doğrulama

Admin dashboard artık tamamen API tabanlı çalışmaktadır. Token olmadan admin sayfalarına erişim **engellenir**.

### Güvenlik Katmanları

1. **Middleware Kontrolü**: `/admin/*` route'ları middleware tarafından korunur
2. **Client-side Token Kontrolü**: Her sayfa yüklemede localStorage ve cookie kontrolü
3. **API Token Validation**: Her API isteğinde Bearer token gönderilir

### Token Yönetimi

```typescript
// Login başarılı olduğunda:
- localStorage.setItem('admin_token', accessToken)
- Cookie: 'admin_token' (30 gün geçerli)

// Logout işleminde:
- localStorage temizlenir
- Cookie silinir
- /admin/login'e yönlendirilir
```

## 📡 API Endpoints

Backend URL (varsayılan): `http://localhost:5240/api/v1`

### Dashboard Endpoints

| Endpoint | Method | Açıklama | Response |
|----------|--------|----------|----------|
| `/admin/dashboard/stats` | GET | Genel istatistikler | `{ totalBookings, totalRevenue, totalCustomers, commission, bookingsGrowth, revenueGrowth }` |
| `/admin/dashboard/recent-bookings` | GET | Son rezervasyonlar | `Array<{ id, customer, type, hotel, amount, status, date }>` |
| `/admin/dashboard/popular-destinations` | GET | Popüler destinasyonlar | `Array<{ name, bookings, percent }>` |

### Auth Endpoints

| Endpoint | Method | Açıklama | Body |
|----------|--------|----------|------|
| `/auth/login` | POST | Admin girişi | `{ email, password }` |
| `/auth/logout` | POST | Çıkış | - |
| `/auth/refresh` | POST | Token yenileme | `{ refreshToken }` |

## 🔄 Fallback Mekanizması

Dashboard, API'ye erişemediğinde **otomatik olarak mock data** kullanır:

```typescript
try {
  // API'den veri çek
  const data = await adminAPI.getDashboardStats();
} catch (error) {
  // API erişilemiyorsa mock data kullan
  console.warn('API erişilemedi, mock veriler kullanılıyor.');
  setStats(mockData);
}
```

Bu sayede:
- ✅ Backend hazır değilken frontend geliştirmesi yapılabilir
- ✅ Network hataları kullanıcı deneyimini bozmaz
- ✅ Offline development mümkün olur

## 🛠️ Environment Variables

`.env.local` dosyasını oluşturun:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5240/api/v1

# SunHotels API
NEXT_PUBLIC_SUNHOTELS_API_URL=http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx
NEXT_PUBLIC_SUNHOTELS_USERNAME=your_username
NEXT_PUBLIC_SUNHOTELS_PASSWORD=your_password
```

## 📊 Swagger Documentation

Backend API dokümantasyonuna erişim:
```
http://localhost:5240/swagger
```

## 🧪 Test Etme

### 1. Backend Olmadan (Mock Data)
```bash
npm run dev
# Admin login: herhangi bir email/password ile giriş yapın
# Dashboard otomatik olarak mock data gösterecektir
```

### 2. Backend ile
```bash
# Backend'i başlatın
cd backend
dotnet run

# Frontend'i başlatın
cd freestays
npm run dev

# Admin login yapın
# Dashboard API'den gerçek veri çekecektir
```

## 🔍 Debugging

Console'da API isteklerini takip edebilirsiniz:

```javascript
// Başarılı API çağrısı
console.log('Dashboard data received:', data);

// API hatası
console.error('API Error:', { status, endpoint, error });

// Fallback kullanımı
console.warn('API erişilemedi, mock veriler kullanılıyor.');
```

## 📝 Gelecek Geliştirmeler

- [ ] Token refresh mekanizması
- [ ] Role-based access control (RBAC)
- [ ] Real-time notifications
- [ ] Advanced error handling
- [ ] API response caching
- [ ] Optimistic UI updates
