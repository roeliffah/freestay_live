# Homepage Component Management System

## Genel Bakış

Bu sistem, FreeStays homepage'deki tüm section'ların (bölümlerin) admin panel üzerinden yönetilmesini sağlar. OpenCart/Elementor tarzında drag-and-drop ile section'ları ekleyebilir, düzenleyebilir, sıralayabilir ve aktif/pasif yapabilirsiniz.

## Özellikler

✅ **10 Farklı Section Tipi**:
- Hero Section (Ana banner + arama formu)
- Room Types (Otel tipleri)
- Features (Özellikler)
- Popular Hotels (Popüler oteller)
- Popular Destinations (Popüler destinasyonlar)
- Romantic Tours (Romantik turlar)
- Campaign Banner (Kampanya banner'ı)
- Travel CTA Cards (Seyahat CTA kartları)
- Final CTA (Son harekete geçirme)
- Custom HTML (Özel HTML içerik)

✅ **Admin Panel Özellikleri**:
- Drag & Drop ile section sıralama
- Section ekleme/düzenleme/silme
- Aktif/Pasif toggle
- JSON configuration düzenleme
- Gerçek zamanlı önizleme

✅ **Frontend Özellikleri**:
- Dynamic section rendering
- API'den veri çekme
- 5 dakika cache (performans)
- Fallback default sections
- SEO-friendly

## Kurulum

### 1. Backend (C# Developer)

#### Database Migration
```sql
-- SQL Server'da çalıştırın:
-- /docs/Backend-Homepage-Components-API.md dosyasındaki migration script'i kullanın
```

#### API Endpoints
```bash
# Backend projesine eklenecek endpoint'ler:
GET    /api/v1/public/homepage/sections           # Frontend için (public)
GET    /api/v1/admin/homepage/sections            # Admin panel için
POST   /api/v1/admin/homepage/sections            # Yeni section ekle
PUT    /api/v1/admin/homepage/sections/{id}       # Section güncelle
DELETE /api/v1/admin/homepage/sections/{id}       # Section sil
PATCH  /api/v1/admin/homepage/sections/reorder    # Sıralama güncelle
PATCH  /api/v1/admin/homepage/sections/{id}/toggle # Aktif/Pasif
```

#### C# Controller
`/docs/Backend-Homepage-Components-API.md` dosyasındaki `HomePageSectionsController.cs` kodunu backend projenize ekleyin.

### 2. Frontend (Next.js)

#### Admin Panel
Yeni sayfa: `/admin/homepage-sections`

```bash
# Zaten oluşturuldu:
/app/admin/homepage-sections/page.tsx
```

Admin menüsünde "Homepage Sections" linki eklendi.

#### Dynamic Homepage
```bash
# Mevcut static homepage:
/app/[locale]/page.tsx

# Yeni dynamic homepage (opsiyonel):
/app/[locale]/page-dynamic.tsx
```

**Kullanım**: Backend hazır olduğunda `page.tsx` yerine `page-dynamic.tsx` kullanın.

## Kullanım Kılavuzu

### Admin Panel Kullanımı

1. **Admin Panel'e Giriş**
   ```
   http://localhost:3000/admin/homepage-sections
   ```

2. **Yeni Section Ekle**
   - "Add Section" butonuna tıklayın
   - Section tipini seçin (örn: Popular Hotels)
   - Configuration JSON'ını girin
   - Save

3. **Section Düzenle**
   - Section'ın yanındaki Edit ikonuna tıklayın
   - Configuration'ı düzenleyin
   - Save

4. **Section Sırala**
   - Section'ın sağındaki drag handle'ı (☰) tutun
   - Sürükleyip istediğiniz yere bırakın
   - Otomatik kaydedilir

5. **Section Aktif/Pasif**
   - Toggle switch ile açıp kapatın
   - Pasif section'lar frontend'de görünmez

6. **Section Sil**
   - Delete ikonuna tıklayın
   - Onaylayın

### Configuration Örnekleri

#### Popular Hotels
```json
{
  "fetchMode": "auto",
  "layout": "grid-3",
  "autoQuery": {
    "stars": 5,
    "count": 6,
    "orderBy": "rating"
  }
}
```

#### Campaign Banner
```json
{
  "gradient": "from-orange-500 to-red-500",
  "badge": "Special Offer",
  "buttonText": "View Deals",
  "buttonLink": "/search?offers=true"
}
```

#### Custom HTML
```json
{
  "html": "<div class='py-12 bg-blue-500 text-white text-center'><h2 class='text-3xl font-bold'>Custom Content</h2></div>",
  "cssClasses": "my-custom-class"
}
```

#### Hero Section
```json
{
  "backgroundImage": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80",
  "gradient": "from-black/60 via-black/40 to-black/60",
  "height": "600px",
  "showSearchForm": true
}
```

## API Dokümantasyonu

Detaylı API dokümantasyonu için:
```
/docs/Backend-Homepage-Components-API.md
```

## Dosya Yapısı

```
docs/
  Backend-Homepage-Components-API.md    # Backend implementation guide
  Homepage-Component-Management.md       # Bu README

app/
  admin/
    homepage-sections/
      page.tsx                          # Admin panel sayfası
  [locale]/
    page.tsx                            # Mevcut static homepage
    page-dynamic.tsx                    # Yeni dynamic homepage (backend hazır olunca)

components/
  home/
    PopularHotels.tsx                   # Mevcut component
    PopularDestinations.tsx             # Mevcut component
    RomanticTours.tsx                   # Mevcut component
    TravelCTACards.tsx                  # Mevcut component
```

## Test Senaryoları

### Backend Testing
- [ ] SQL migration çalıştırıldı
- [ ] Default section'lar insert edildi
- [ ] GET /public/homepage/sections çalışıyor
- [ ] GET /admin/homepage/sections (auth ile) çalışıyor
- [ ] POST section oluşturuluyor
- [ ] PUT section güncelleniyor
- [ ] DELETE section siliniyor
- [ ] PATCH reorder çalışıyor
- [ ] PATCH toggle çalışıyor

### Frontend Testing
- [ ] Admin panel açılıyor
- [ ] Section listesi görünüyor
- [ ] Yeni section eklenebiliyor
- [ ] Section düzenlenebiliyor
- [ ] Drag-drop ile sıralama yapılabiliyor
- [ ] Toggle ile aktif/pasif yapılabiliyor
- [ ] Section silinebiliyor
- [ ] Dynamic homepage section'ları gösteriyor

## Güvenlik

1. **Admin Routes**: JWT token kontrolü yapılmalı
2. **Input Validation**: Configuration JSON validate edilmeli
3. **SQL Injection**: Parameterized queries kullanılmalı
4. **XSS Protection**: Custom HTML sanitize edilmeli
5. **Rate Limiting**: API rate limit uygulanmalı

## Performans

1. **Caching**: Frontend 5 dakika cache kullanıyor
2. **Database Indexes**: DisplayOrder ve IsActive indexlendi
3. **Lazy Loading**: Section component'ler lazy load edilebilir
4. **Image Optimization**: Next.js Image component kullanılıyor

## Troubleshooting

### Section'lar görünmüyor
- Backend API çalışıyor mu kontrol edin
- Browser console'da hata var mı bakın
- `/api/v1/public/homepage/sections` endpoint'i test edin

### Drag-drop çalışmıyor
- Drag handle'a (☰ icon) tıklayın
- Tarayıcı touch events'i desteklemiyor olabilir

### JSON hatası
- Configuration geçerli JSON olmalı
- Online JSON validator kullanın

### 401 Unauthorized
- Admin token kontrol edin
- Login olup tekrar deneyin

## Sonraki Adımlar

1. ✅ Database migration'ı çalıştır
2. ✅ Backend API endpoint'lerini implement et
3. ✅ Admin panel test et
4. ⏳ `page.tsx` dosyasını `page-dynamic.tsx` ile değiştir
5. ⏳ Production'a deploy et

## Destek

Sorularınız için:
- Backend: `/docs/Backend-Homepage-Components-API.md`
- Section Types: Admin panel'de tooltip'lere bakın
- Configuration Examples: Bu README'deki örnekleri kullanın

---

**Not**: Bu sistem backend API'ye bağımlıdır. Backend hazır olana kadar mevcut static homepage kullanılacak.
