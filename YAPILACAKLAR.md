# Yapılacaklar Listesi - FreeStays

Son güncelleme: 16 Aralık 2025

## ✅ Tamamlanan İyileştirmeler

### Ant Design v6 Uyumluluk
- ✅ `Alert` bileşeninde `message` → `title` prop güncellemesi
- ✅ `Space` bileşeninde `direction` → `orientation` prop güncellemesi  
- ✅ `Statistic` bileşeninde `valueStyle` → `styles.content` prop güncellemesi
- Etkilenen dosyalar:
  - `app/admin/jobs/page.tsx`
  - `app/admin/page.tsx`
  - `app/admin/settings/payment/page.tsx`

### Kritik React/Next.js Hataları
- ✅ `app/admin/layout.tsx` - Effect içinde setState çağrıları setTimeout ile sarıldı
- ✅ `components/hotel/HotelCard.tsx` - Render sırasında Date.now() kullanımı düzeltildi
- ✅ `app/admin/login/page.tsx` - `<a>` yerine `<Link>` kullanıldı
- ✅ `app/admin/page.tsx` - `<a>` yerine `<Link>` kullanıldı
- ✅ `lib/api/client.ts` - `let` yerine `const` kullanıldı

## 🔧 Öncelikli İyileştirmeler

### 1. TypeScript Tip Güvenliği (Yüksek Öncelik)
**Durum**: 147 `any` tipi kullanımı var  
**Etki**: Tip güvenliği eksikliği, runtime hataları riski

**Düzeltilmesi Gereken Dosyalar**:
- `lib/api/client.ts` (22 any kullanımı)
- `lib/api/index.ts` (28 any kullanımı)
- `lib/sunhotels/client.ts` (20 any kullanımı)
- Admin sayfaları (her biri 3-8 any kullanımı)
- Components (SecureForm, HotelCard vb.)

**Önerilen Yaklaşım**:
```typescript
// Önce: Genel tipleri tanımla
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

// Sonra: any yerine bu tipleri kullan
const handleError = (error: ErrorResponse) => { ... }
```

### 2. Kullanılmayan İmportların Temizlenmesi (Orta Öncelik)
**Durum**: 70 kullanılmayan import uyarısı  
**Etki**: Bundle boyutunu artırıyor, kod okunabilirliğini azaltıyor

**En Çok Etkilenen Dosyalar**:
- `app/admin/email-templates/page.tsx` (8 kullanılmayan import)
- `app/admin/bookings/page.tsx` (6 kullanılmayan import)
- `app/admin/settings/page.tsx` (6 kullanılmayan import)
- `app/admin/translations/page.tsx` (6 kullanılmayan import)

**Aksiyon**: Otomatik temizlik için ESLint autofix kullanılabilir (kısmi)

### 3. Scripts Klasörü Modernizasyonu (Düşük Öncelik)
**Durum**: 13 require() style import hatası  
**Etki**: Modern ES module sistemine uyumsuz

**Etkilenen Dosyalar**:
- `scripts/fetch_destinations.js`
- `scripts/fetch_hotels.js`
- `scripts/generate_featured_hotels.js`
- `scripts/generate_mock_hotels.js`
- `scripts/select_featured_destinations.js`
- `scripts/test_hotel_detail_api.js`

**Çözüm**: 
```javascript
// Eski
const axios = require('axios');
const fs = require('fs');

// Yeni
import axios from 'axios';
import fs from 'fs/promises';
```

## 📋 Gelecekteki Geliştirme Önerileri

### Performans İyileştirmeleri
- [ ] Bundle size analizi ve optimizasyonu
- [ ] Image optimization kontrolleri
- [ ] Lazy loading uygulamaları
- [ ] React Server Components kullanımını artır

### Kod Kalitesi
- [ ] Unit test coverage artırımı
- [ ] Integration testleri ekle
- [ ] Error boundary'ler ekle
- [ ] Loading states standardizasyonu

### Güvenlik
- [ ] CSRF token implementasyonu tamamla
- [ ] Rate limiting tüm endpoint'lere uygula
- [ ] Input validation katmanı güçlendir
- [ ] XSS koruması audit et

### Kullanıcı Deneyimi
- [ ] Skeleton loading states ekle
- [ ] Toast/notification sistemi standardize et
- [ ] Form validation mesajlarını i18n'e taşı
- [ ] Accessibility audit (WCAG 2.1 AA)

### Dokümantasyon
- [ ] API endpoint dokümantasyonu
- [ ] Component kullanım kılavuzları
- [ ] Deployment dokümantasyonu
- [ ] Geliştirici onboarding rehberi

## 🎯 Öncelik Sıralaması

1. **Kritik** (Hemen): TypeScript any tiplerinin en az %50'sini düzelt
2. **Yüksek** (Bu Sprint): Kullanılmayan importları temizle
3. **Orta** (Gelecek Sprint): Scripts modernizasyonu
4. **Düşük** (Backlog): Diğer iyileştirmeler

## 📊 Metrikler

- **Toplam ESLint Uyarısı**: 70 warning
- **Toplam ESLint Hatası**: 147 error
- **Kritik Hatalar**: 0 (✅ Tamamlandı)
- **Kod Kalitesi Skoru**: İyi (kritik hatalar yok)
- **TypeScript Strict Mode**: Kısmi (any kullanımları nedeniyle)

## 🔄 Sürekli İyileştirme

Her sprint sonunda:
- ESLint error sayısını %20 azalt
- Test coverage'ı %10 artır
- Bundle size'ı %5 azalt
- Performance score'u 5 puan artır

---

**Not**: Bu liste dinamiktir ve proje gereksinimleri doğrultusunda güncellenecektir.
