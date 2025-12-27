# Homepage Component Management - Multi-Language & Selection Update

## 🎯 Yapılan Değişiklikler

### 1. Database Schema Güncellemesi ✅

**Yeni Tablolar**:
- `HomePageSectionTranslations` - Her section için 9 dilde çeviri desteği
- `HomePageSectionHotels` - Section'lara manuel otel atama
- `HomePageSectionDestinations` - Section'lara manuel destinasyon atama

**Kaldırılan Alanlar**:
- `HomePageSections.Title` (artık translations tablosunda)
- `HomePageSections.Subtitle` (artık translations tablosunda)

### 2. API Endpoints Eklendi (16 toplam) ✅

**Yeni Translation Endpoints**:
- `GET /api/v1/admin/homepage/sections/{id}/translations` - Tüm dillerdeki çevirileri getir
- `POST /api/v1/admin/homepage/sections/{id}/translations` - Çevirileri kaydet

**Yeni Selection Endpoints**:
- `GET /api/v1/admin/homepage/available-hotels` - Seçilebilir otelleri listele
- `GET /api/v1/admin/homepage/available-destinations` - Seçilebilir destinasyonları listele
- `GET /api/v1/admin/homepage/sections/{id}/hotels` - Section'ın otellerini getir
- `POST /api/v1/admin/homepage/sections/{id}/hotels` - Section'a otel atama
- `GET /api/v1/admin/homepage/sections/{id}/destinations` - Section'ın destinasyonlarını getir
- `POST /api/v1/admin/homepage/sections/{id}/destinations` - Section'a destinasyon atama

### 3. Admin Panel Yenilendi ✅

**Yeni Özellikler**:

1. **Multi-Language Support**:
   - Tüm section'lar için 9 dilde çeviri
   - Dil bayrakları ile görsel tab'lar
   - Her dil için ayrı Title ve Subtitle

2. **Otel Seçimi**:
   - API'den otelleri çekme
   - Arama fonksiyonu
   - Multi-select (birden fazla otel seçimi)
   - Seçili otelleri tag olarak gösterme
   - Yıldız ve rating bilgisi

3. **Destinasyon Seçimi**:
   - API'den destinasyonları çekme
   - Arama fonksiyonu
   - Multi-select (birden fazla destinasyon)
   - Otel sayısı gösterimi

**UI İyileştirmeleri**:
- Her section'da 🌍 (Translations), 🏨 (Hotels), 📍 (Destinations) butonları
- Modal'lar ile düzenli workflow
- Seçili item sayısı gösterimi
- Table view ile kolay seçim

## 📋 Kullanım Akışı

### Scenario 1: Popular Hotels Section Ekleme

1. **Section Oluştur**:
   - "Add Section" → "Popular Hotels" seç
   - Configuration: `{"layout": "grid-3"}`
   - Save

2. **Çevirileri Ekle**:
   - 🌍 butonuna tıkla
   - Her dil için Title/Subtitle gir:
     - 🇹🇷 TR: "Popüler Oteller" / "En çok tercih edilen 5 yıldızlı oteller"
     - 🇬🇧 EN: "Popular Hotels" / "Most preferred 5-star hotels"
     - 🇩🇪 DE: "Beliebte Hotels" / "Die beliebtesten 5-Sterne-Hotels"
   - Save Translations

3. **Otelleri Seç**:
   - 🏨 butonuna tıkla (yanında sayı: 0)
   - Arama kutusundan otel ara veya listeden seç
   - "Add" butonuna tıklayarak ekle (max 6-10 otel önerilir)
   - Save (yanında sayı: 6)

### Scenario 2: Popular Destinations Section

1. **Section Oluştur**: "Popular Destinations"
2. **Çevirileri Ekle**: 9 dil için title/subtitle
3. **Destinasyonları Seç**:
   - 📍 butonuna tıkla
   - İstediğin destinasyonları seç (Antalya, İstanbul, Bodrum, vb.)
   - Save

## 🗂️ Database Migration

```sql
-- 4 yeni tablo oluşturulacak:
1. HomePageSections (Title/Subtitle kaldırıldı)
2. HomePageSectionTranslations (YENİ)
3. HomePageSectionHotels (YENİ)
4. HomePageSectionDestinations (YENİ)

-- Default data:
- 9 section oluşturulacak
- Her section için 3 dilde çeviri (TR, EN, DE) eklenecek
```

## 🔧 Backend Developer Görevleri

### Priority 1: Database
- [ ] Migration script'i çalıştır
- [ ] Foreign key'leri kontrol et
- [ ] Default data insert edildi mi kontrol et

### Priority 2: Translation Endpoints
- [ ] GET /admin/homepage/sections/{id}/translations
- [ ] POST /admin/homepage/sections/{id}/translations

### Priority 3: Selection Endpoints
- [ ] GET /admin/homepage/available-hotels
- [ ] GET /admin/homepage/available-destinations
- [ ] GET /admin/homepage/sections/{id}/hotels
- [ ] POST /admin/homepage/sections/{id}/hotels
- [ ] GET /admin/homepage/sections/{id}/destinations
- [ ] POST /admin/homepage/sections/{id}/destinations

### Priority 4: Public API Güncelleme
- [ ] GET /public/homepage/sections - Translations ekle
- [ ] GET /public/homepage/sections - Selected hotels/destinations ekle

**Response Örneği**:
```json
{
  "id": "guid",
  "sectionType": "popular-hotels",
  "isActive": true,
  "displayOrder": 4,
  "translations": {
    "tr": {
      "title": "Popüler Oteller",
      "subtitle": "En çok tercih edilen 5 yıldızlı oteller"
    },
    "en": {
      "title": "Popular Hotels",
      "subtitle": "Most preferred 5-star hotels"
    }
  },
  "hotels": [
    {
      "hotelId": "12345",
      "displayOrder": 1,
      "hotelName": "Rixos Premium Belek",
      "destinationName": "Belek",
      "stars": 5,
      "rating": 9.2,
      "image": "https://...",
      "priceFrom": 150
    }
  ],
  "configuration": {
    "layout": "grid-3"
  }
}
```

## 🎨 Frontend Component Güncellemesi

`PopularHotels`, `PopularDestinations`, `RomanticTours` component'leri güncellenmeli:

**Önceki**:
```tsx
// API'den tüm otelleri çekip filtreleme yapıyordu
const hotels = await fetchHotels({ stars: 5, count: 6 });
```

**Yeni**:
```tsx
// Section'ın seçilmiş otellerini direkt göster
const section = await fetchSection('popular-hotels');
const hotels = section.hotels; // Already selected hotels
```

## 📊 Avantajlar

1. **Multi-Language**: 9 dilde içerik yönetimi
2. **Manuel Kontrol**: Admin hangi otelleri/destinasyonları göstereceğine karar verir
3. **Statik Veri**: Her refresh'te API'ye gitmez, DB'den çeker (hız)
4. **Esneklik**: Sezonluk değişiklikler kolayca yapılabilir
5. **SEO**: Statik içerik SEO için daha iyi
6. **Cache**: Frontend 5 dakika cache yapabilir

## 🚨 Önemli Notlar

1. **Migration Sırası**: Önce HomePageSections, sonra Translations, sonra Hotels/Destinations
2. **Cascade Delete**: Section silinirse translations/hotels/destinations otomatik silinir
3. **Unique Constraint**: Aynı section'a aynı hotel 2 kez eklenemez
4. **Display Order**: Hotels/Destinations kendine göre sıralanabilir

## 📁 Dosya Değişiklikleri

### Güncellenen:
- `/docs/Backend-Homepage-Components-API.md` - 16 endpoint + schemas
- `/app/admin/homepage-sections/page.tsx` - Multi-language + selection modals

### Yeni:
- Yok (mevcut dosyalar güncellendi)

## ✅ Test Checklist

### Backend:
- [ ] Migration başarılı
- [ ] Translation endpoints çalışıyor
- [ ] Hotel selection endpoints çalışıyor
- [ ] Destination selection endpoints çalışıyor
- [ ] Public API translations döndürüyor
- [ ] Public API selected hotels döndürüyor

### Frontend:
- [ ] Admin panel açılıyor
- [ ] Translations modal açılıyor
- [ ] 9 dilde çeviri eklenebiliyor
- [ ] Hotels modal açılıyor
- [ ] Otel arama çalışıyor
- [ ] Multi-select çalışıyor
- [ ] Destinations modal açılıyor
- [ ] Destinasyon seçimi çalışıyor
- [ ] Save işlemleri başarılı

---

**Son Güncelleme**: 27 Aralık 2025
**Status**: ✅ Frontend Ready, ⏳ Backend Pending
