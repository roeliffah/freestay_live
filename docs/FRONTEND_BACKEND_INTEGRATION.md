# Frontend-Backend Entegrasyon Rehberi

## 📊 Backend API Analizi Tamamlandı

Backend Swagger API (`https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/swagger/v1/swagger.json`) analiz edildi.

### ✅ Mevcut API Endpoints

#### 1. Statik Sayfalar (`/admin/pages`)
- `GET /api/v1/admin/pages` - Liste (isActive filter)
- `POST /api/v1/admin/pages` - Oluştur
- `GET /api/v1/admin/pages/{slug}` - Slug ile getir
- `GET /api/v1/admin/pages/{id}` - ID ile getir
- `PUT /api/v1/admin/pages/{id}` - Güncelle
- `DELETE /api/v1/admin/pages/{id}` - Sil

**Frontend Durumu:** ✅ Tamamlandı - Backend'e bağlandı

#### 2. E-posta Şablonları (`/admin/email-templates`)
- `GET /api/v1/admin/email-templates` - Liste (isActive filter)
- `POST /api/v1/admin/email-templates` - Oluştur
- `GET /api/v1/admin/email-templates/{id}` - ID ile getir
- `GET /api/v1/admin/email-templates/by-code/{code}?locale=tr` - Code ile getir
- `PUT /api/v1/admin/email-templates/{id}` - Güncelle
- `DELETE /api/v1/admin/email-templates/{id}` - Sil
- `PATCH /api/v1/admin/email-templates/{id}/toggle-status` - Aktif/Pasif

**⚠️ Eksik:** Test email gönderme endpoint'i backend'de YOK

**Frontend Durumu:** ⏳ Bekleniyor

#### 3. Harici Servisler (`/admin/services`)
- `GET /api/v1/admin/services` - Liste
- `PUT /api/v1/admin/services/{serviceId}` - Güncelle
- `POST /api/v1/admin/services/sunhotels/sync` - SunHotels senkronizasyon
- `GET /api/v1/admin/jobs/history` - Job geçmişi
- `GET /api/v1/sunhotels/statistics` - SunHotels istatistikleri

**Frontend Durumu:** ⏳ Bekleniyor

#### 4. SEO Ayarları (`/admin/settings/seo`)
- `GET /api/v1/admin/settings/seo` - Genel SEO ayarları
- `PUT /api/v1/admin/settings/seo` - Genel SEO güncelle
- `GET /api/v1/admin/settings/seo/{locale}` - Dil bazlı SEO
- `PUT /api/v1/admin/settings/seo/{locale}` - Dil bazlı SEO güncelle

**Request Format:**
```json
{
  "defaultMetaTitle": "string",
  "defaultMetaDescription": "string",
  "googleAnalyticsId": "string",
  "googleTagManagerId": "string",
  "facebookPixelId": "string",
  "robotsTxt": "string",
  "sitemapEnabled": true
}
```

**Locale SEO Format:**
```json
{
  "pages": [
    {
      "pageType": "home",
      "metaTitle": "string",
      "metaDescription": "string",
      "metaKeywords": "string",
      "ogImage": "string"
    }
  ]
}
```

**Frontend Durumu:** ⏳ Bekleniyor

#### 5. Ödeme Ayarları (`/admin/settings/payment`)
- `GET /api/v1/admin/settings/payment` - Ödeme ayarları getir
- `PUT /api/v1/admin/settings/payment` - Ödeme ayarları güncelle
- `POST /api/v1/admin/settings/payment/test-connection` - Bağlantı testi

**Request Format:**
```json
{
  "provider": "string",
  "publicKey": "string",
  "secretKey": "string",
  "webhookSecret": "string",
  "isLive": true,
  "isActive": true
}
```

**Frontend Durumu:** ⏳ Bekleniyor

---

## 🔧 Ant Design 5.x Best Practices

### Table Component
```typescript
// ✅ DOĞRU - Backend'den gelen veriyi kontrol et
const fetchData = async () => {
  const response = await api.getData();
  // Response paginated ise
  const dataArray = Array.isArray(response) ? response : (response.items || []);
  setData(dataArray);
};

// ❌ YANLIŞ - Direkt olarak set etme
setData(response); // Response object olabilir!
```

### Form Validation
```typescript
// ✅ DOĞRU - async/await ile validate
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    await api.save(values);
    message.success('Kaydedildi');
  } catch (error) {
    // Validation error otomatik gösterilir
  }
};
```

### Loading States
```typescript
// ✅ DOĞRU - Her işlem için ayrı loading state
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);

// GET işlemi
setLoading(true);
try {
  await fetchData();
} finally {
  setLoading(false);
}

// POST/PUT işlemi
setSaving(true);
try {
  await saveData();
} finally {
  setSaving(false);
}
```

---

## 🚨 Tespit Edilen Sorunlar ve Çözümler

### Sorun 1: Table dataSource hatası
**Hata:** `rawData.some is not a function`
**Sebep:** Backend paginated response dönüyor ama direkt kullanılıyor
**Çözüm:**
```typescript
const response: any = await api.getPages();
const pagesData = Array.isArray(response) ? response : (response.items || []);
setPages(pagesData);
```

### Sorun 2: Response formatı tutarsızlığı
Backend bazı endpoint'lerde paginated, bazılarında direkt array dönüyor.
**Çözüm:** Her API çağrısında veriyi kontrol et.

---

## 📋 Yapılacaklar Listesi

### Backend'e Eklenecek Endpoint'ler
- [ ] `POST /api/v1/admin/email-templates/{code}/test` - Test email gönderimi

### Frontend Sayfaları (Backend Entegrasyonu)
- [x] Statik Sayfalar - ✅ TAMAMLANDI
- [ ] E-posta Şablonları
- [ ] Harici Servisler
- [ ] SEO Ayarları
- [ ] Ödeme Ayarları

### Genel İyileştirmeler
- [ ] Tüm API response'larını TypeScript interface'leri ile tip güvenliği
- [ ] Error handling standardizasyonu
- [ ] Loading state'leri için global spinner
- [ ] Form validation mesajlarını Türkçe'ye çevir

---

## 🎯 Entegrasyon Öncelikleri

1. **Yüksek Öncelik:** Statik Sayfalar (✅ Tamamlandı)
2. **Orta Öncelik:** E-posta Şablonları, Harici Servisler
3. **Düşük Öncelik:** SEO Ayarları, Ödeme Ayarları

---

**Son Güncelleme:** 19 Aralık 2025
**Durum:** Devam ediyor - Statik Sayfalar tamamlandı
