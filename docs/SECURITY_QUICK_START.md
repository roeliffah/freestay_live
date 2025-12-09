# 🔐 Form Güvenlik Sistemi - Hızlı Başlangıç

## Kurulum Tamamlandı ✅

Tüm güvenlik önlemleri aktif ve çalışıyor durumda!

---

## 📦 Oluşturulan Dosyalar

### 1. Güvenlik Modülleri (`/lib/security/`)
- `rate-limiter.ts` - Brute force koruması
- `input-validator.ts` - Input doğrulama ve sanitizasyon
- `csrf-protection.ts` - CSRF token yönetimi
- `honeypot.ts` - Bot tespiti
- `security-headers.ts` - HTTP güvenlik başlıkları

### 2. Components (`/components/forms/`)
- `SecureForm.tsx` - Tüm güvenlik önlemlerini içeren form wrapper

### 3. Middleware
- `/middleware.ts` - Tüm sayfalar için otomatik güvenlik başlıkları

### 4. Güncellenmiş Sayfalar
- `/app/admin/login/page.tsx` - SecureForm ile güvenli login
- `/lib/api/client.ts` - Rate limiting ve CSRF korumalı API client

---

## 🚀 Kullanım

### Basit Form (SecureForm ile)
```tsx
import SecureForm from '@/components/forms/SecureForm';

<SecureForm
  onSecureFinish={handleSubmit}
  identifier={email} // Rate limiting için
  enableRateLimit={true}
  enableHoneypot={true}
  enableCsrf={true}
>
  <Form.Item name="email">
    <Input />
  </Form.Item>
  <Button htmlType="submit">Gönder</Button>
</SecureForm>
```

### Manuel Kullanım (Daha Fazla Kontrol)
```tsx
import { rateLimiter, formRateLimiter } from '@/lib/security/rate-limiter';
import { isValidEmail } from '@/lib/security/input-validator';
import { createHoneypot, validateHoneypot } from '@/lib/security/honeypot';

const handleSubmit = (values) => {
  // Email validasyonu
  if (!isValidEmail(values.email)) {
    message.error('Geçersiz email');
    return;
  }

  // Rate limiting
  const check = rateLimiter.check(values.email, formRateLimiter);
  if (!check.allowed) {
    message.error('Çok fazla deneme!');
    return;
  }

  // Bot kontrolü
  const botCheck = validateHoneypot(values.honeypot, timestamp);
  if (botCheck.isBot) {
    return; // Sessizce reddet
  }

  // API call...
};
```

---

## 🛡️ Güvenlik Katmanları

### 1️⃣ Rate Limiting
**Amaç**: Brute force ataklarını önleme

```typescript
// Login formu için
maxAttempts: 5 deneme
windowMs: 15 dakika
blockDurationMs: 30 dakika blokaj

// Genel formlar için  
maxAttempts: 3 deneme
windowMs: 1 dakika
blockDurationMs: 5 dakika blokaj
```

**Özellikler**:
- Email/IP bazlı takip
- Otomatik temizleme
- Kalan deneme gösterimi
- Başarılı işlemde sıfırlama

### 2️⃣ Input Validation
**Fonksiyonlar**:
- `isValidEmail()` - RFC 5322 email
- `isStrongPassword()` - Min 8 kar, büyük/küçük/rakam/özel
- `isValidPhoneNumber()` - TR format
- `isValidUrl()` - URL doğrulama
- `isValidIban()` - Mod 97 algoritması
- `isValidTcKimlikNo()` - TC Kimlik No
- `isValidCreditCard()` - Luhn algoritması
- `sanitizeHtml()` - XSS koruması
- `sanitizeSql()` - SQL injection koruması

### 3️⃣ CSRF Protection
**Mekanizma**:
- Her sayfa yüklemede benzersiz token
- localStorage'da saklama
- Her API call'da X-CSRF-Token header
- Başarılı işlemde token yenileme

**Otomatik Kullanım**:
- API client'a otomatik eklenir
- SecureForm'da otomatik aktif

### 4️⃣ Honeypot
**Mekanizma**:
- CSS ile gizli alan
- Gerçek kullanıcı göremez
- Botlar otomatik doldurur
- < 2 saniye submission bot tespit
- > 30 dakika session timeout

**Otomatik Kullanım**:
- SecureForm'da otomatik eklenir

### 5️⃣ Security Headers
**HTTP Başlıkları** (middleware ile otomatik):
- X-XSS-Protection
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Content-Security-Policy
- Strict-Transport-Security (production)

---

## ✨ Login Sayfası Özellikleri

### Aktif Güvenlik:
✅ Email validasyonu (RFC 5322)  
✅ Rate limiting (5 deneme / 15 dakika)  
✅ Honeypot bot tespiti  
✅ CSRF protection  
✅ Hesap kilitleme (30 dakika)  
✅ Kalan deneme uyarısı  
✅ Görsel feedback  

### Kullanıcı Deneyimi:
- 3 denemeden az kalınca uyarı
- Bloke edilince süre gösterimi
- Form otomatik disable
- Anlaşılır Türkçe mesajlar
- Güvenlik özellik listesi

---

## 📊 Güvenlik Metrikleri

### Login Koruması
```
✓ Brute Force: 5 deneme / 15 dakika
✓ Bot Tespiti: Honeypot + timing analizi
✓ CSRF: Token doğrulama
✓ XSS: Input sanitization
```

### API Koruması
```
✓ Rate Limit: 100 istek / dakika
✓ Auth: JWT Bearer token
✓ CSRF: X-CSRF-Token header
✓ 401: Otomatik logout
```

### Form Koruması
```
✓ Rate Limit: 3 deneme / dakika
✓ Validation: Email, phone, IBAN, vb.
✓ Sanitization: HTML, SQL temizliği
✓ Bot Detection: Honeypot
```

---

## 🔧 Özelleştirme

### Rate Limit Ayarları
```typescript
// /lib/security/rate-limiter.ts
export const customRateLimit = {
  maxAttempts: 10,
  windowMs: 5 * 60 * 1000,  // 5 dakika
  blockDurationMs: 15 * 60 * 1000,  // 15 dakika
};

// Kullanım
<SecureForm customRateLimitConfig={customRateLimit} ... />
```

### CSP Ayarları
```typescript
// /middleware.ts içinde
const csp = [
  "default-src 'self'",
  "script-src 'self' https://trusted.com",
  ...
].join('; ');
```

### Şifre Gereksinimleri
```typescript
// /lib/security/input-validator.ts içinde
// isStrongPassword() fonksiyonunu düzenle
```

---

## 🚨 Test Senaryoları

### 1. Rate Limiting Testi
```bash
# 5 kez yanlış login dene
# Result: "Çok fazla deneme!" uyarısı
# Result: 30 dakika bloke
```

### 2. Bot Testi
```bash
# Honeypot alanını doldur
# Result: Sessizce reddedilir
```

### 3. CSRF Testi
```bash
# Token olmadan API call
# Result: 403 Forbidden (backend'de implement edilmeli)
```

### 4. XSS Testi
```bash
# Input: <script>alert('xss')</script>
# Result: Escaped: &lt;script&gt;alert('xss')&lt;/script&gt;
```

---

## 📱 Production Checklist

### Frontend ✅
- [x] Rate limiting aktif
- [x] Input validation
- [x] CSRF protection
- [x] Honeypot
- [x] Security headers
- [x] XSS koruması

### Backend (Yapılacaklar)
- [ ] Rate limiting (express-rate-limit)
- [ ] CSRF token doğrulama
- [ ] SQL parametreli sorgular
- [ ] Password hashing (bcrypt)
- [ ] JWT expiration check
- [ ] Request logging
- [ ] IP whitelist/blacklist

### Monitoring
- [ ] Failed login logging
- [ ] Rate limit violations
- [ ] Bot detection logs
- [ ] Security audit log

---

## 📚 Dokümantasyon

Detaylı dokümantasyon için:
- `/SECURITY.md` - Kapsamlı güvenlik rehberi
- `/lib/security/` - Kod yorumları ve örnekler

---

## 💡 İpuçları

1. **Rate Limiting**: Kendi ihtiyacınıza göre ayarlayın
2. **Validation**: Her form için uygun validator'ları kullanın
3. **CSRF**: Her POST/PUT/DELETE'de aktif olmalı
4. **Honeypot**: Tüm public formlarda kullanın
5. **Logging**: Saldırı girişimlerini logla
6. **Backend**: Frontend güvenliği tek başına yeterli değil!

---

## 🆘 Destek

Sorular için:
- SECURITY.md dosyasına bakın
- Kod yorumlarını inceleyin
- Her modül detaylı dokümante edilmiş

---

**Güvenlik önemlidir! 🔒**

Bu sistem temel güvenlik önlemlerini sağlar, ancak düzenli güncellemeler ve monitoring ile desteklenmelidir.
