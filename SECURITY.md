# Güvenlik Önlemleri Dokümantasyonu

## 🔒 Uygulanan Güvenlik Katmanları

### 1. Rate Limiting (Hız Sınırlama)
**Amaç**: Brute force ve spam ataklarını önlemek

**Katmanlar**:
- **Login Rate Limiting**: 15 dakikada 5 başarısız deneme, 30 dakika bloke
- **Form Rate Limiting**: 1 dakikada 3 deneme, 5 dakika bloke
- **API Rate Limiting**: 1 dakikada 100 istek, 10 dakika bloke

**Özellikler**:
- IP/Email bazlı takip
- Otomatik temizleme (1 saatlik kayıtlar)
- Başarılı işlem sonrası sıfırlama
- Kalan deneme hakkı gösterimi

**Kullanım**:
```typescript
import { rateLimiter, loginRateLimiter } from '@/lib/security/rate-limiter';

const check = rateLimiter.check(email, loginRateLimiter);
if (!check.allowed) {
  // Bloklandı - hata göster
}
```

---

### 2. Input Validation (Girdi Doğrulama)
**Amaç**: XSS, SQL Injection ve diğer injection ataklarını önlemek

**Fonksiyonlar**:
- `sanitizeHtml()`: HTML karakterlerini escape et
- `sanitizeSql()`: SQL injection karakterlerini temizle
- `isValidEmail()`: RFC 5322 standardında email kontrolü
- `isStrongPassword()`: Güçlü şifre kontrolü (zayıf/orta/güçlü)
- `isValidPhoneNumber()`: Türkiye telefon formatı
- `isValidUrl()`: URL doğrulama
- `isCleanString()`: Genel string temizliği
- `isValidIban()`: IBAN doğrulama (Mod 97)
- `isValidTcKimlikNo()`: TC Kimlik No algoritması
- `isValidCreditCard()`: Luhn algoritması

**Şifre Gereksinimleri**:
- Minimum 8 karakter
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- En az 1 özel karakter
- Yaygın şifreler engellenir

**Kullanım**:
```typescript
import { isValidEmail, isStrongPassword } from '@/lib/security/input-validator';

if (!isValidEmail(email)) {
  // Hata
}

const passwordCheck = isStrongPassword(password);
if (!passwordCheck.valid) {
  console.log(passwordCheck.errors);
}
```

---

### 3. CSRF Protection
**Amaç**: Cross-Site Request Forgery ataklarını önlemek

**Mekanizma**:
- Her sayfa yüklemede benzersiz token oluşturma
- Token'ı localStorage'da saklama
- Her form submission'da token kontrolü
- Başarılı işlem sonrası token yenileme

**Kullanım**:
```typescript
import { initCsrfProtection, addCsrfToHeaders } from '@/lib/security/csrf-protection';

// Sayfa yüklemede
useEffect(() => {
  initCsrfProtection();
}, []);

// API isteğinde
const headers = addCsrfToHeaders({ 'Content-Type': 'application/json' });
```

---

### 4. Honeypot (Bot Tuzağı)
**Amaç**: Bot saldırılarını tespit etmek

**Mekanizma**:
- CSS ile gizli form alanı
- Gerçek kullanıcılar göremez/dolduramaz
- Botlar otomatik doldurur
- Çok hızlı submission (<2 saniye) tespit
- Çok yavaş submission (>30 dakika) session timeout

**Kullanım**:
```typescript
import { createHoneypot, validateHoneypot } from '@/lib/security/honeypot';

const [honeypot] = useState(createHoneypot());

// Form submit'te
const botCheck = validateHoneypot(values.website, honeypot.timestamp);
if (botCheck.isBot) {
  // Bot tespit edildi
}
```

---

### 5. Security Headers (HTTP Güvenlik Başlıkları)
**Amaç**: XSS, Clickjacking, MIME-sniffing ataklarını önlemek

**Başlıklar**:
- `X-XSS-Protection`: XSS koruması
- `X-Content-Type-Options`: MIME-sniffing önleme
- `X-Frame-Options`: Clickjacking önleme
- `Referrer-Policy`: Referrer bilgisi kontrolü
- `Permissions-Policy`: API izinleri
- `Content-Security-Policy`: İçerik güvenliği politikası
- `Strict-Transport-Security`: HTTPS zorunluluğu (production)

**Otomatik Uygulama**:
Next.js middleware ile tüm sayfalara otomatik eklenir.

---

## 🎯 Login Formu Güvenliği

### Uygulanan Önlemler:
1. ✅ Email validasyonu (RFC 5322)
2. ✅ Rate limiting (5 deneme / 15 dakika)
3. ✅ Honeypot bot tespiti
4. ✅ CSRF token kontrolü
5. ✅ Kalan deneme hakkı gösterimi
6. ✅ Hesap kilitleme (30 dakika)
7. ✅ Başarılı girişte counter sıfırlama
8. ✅ Görsel uyarılar (Alert componentleri)

### Kullanıcı Deneyimi:
- Kalan 3 denemede uyarı gösterilir
- Bloke edildiğinde kalan süre gösterilir
- Form otomatik disable edilir
- Anlaşılır hata mesajları

---

## 🌐 API Güvenliği

### Uygulanan Önlemler:
1. ✅ JWT Bearer token authentication
2. ✅ CSRF token header'da gönderilir
3. ✅ Rate limiting (100 istek / dakika)
4. ✅ 401 otomatik logout ve yönlendirme
5. ✅ Null/undefined param filtreleme
6. ✅ User identifier bazlı takip

### API Client Kullanımı:
```typescript
// Rate limiting aktif
await api.get('/endpoint');

// Rate limiting atlanır (public endpoint için)
await api.get('/public/endpoint', null, true);
```

---

## 📋 Güvenlik Kontrol Listesi

### Frontend:
- [x] Login rate limiting
- [x] Email validasyonu
- [x] Honeypot bot tespiti
- [x] CSRF protection
- [x] Input sanitization
- [x] XSS koruması
- [x] Security headers

### Backend Gereksinimler:
- [ ] API rate limiting (backend tarafında)
- [ ] Password hashing (bcrypt/argon2)
- [ ] JWT token expiration
- [ ] Refresh token rotation
- [ ] IP whitelist/blacklist
- [ ] Request logging
- [ ] SQL parametreli sorgu kullanımı
- [ ] CORS policy tanımlama

### Monitoring:
- [ ] Failed login attempts logging
- [ ] Rate limit violations tracking
- [ ] Suspicious activity alerts
- [ ] Regular security audits

---

## 🔧 Konfigürasyon

### Rate Limit Ayarları:
```typescript
// lib/security/rate-limiter.ts içinde düzenlenebilir

export const loginRateLimiter = {
  maxAttempts: 5,           // Deneme sayısı
  windowMs: 15 * 60 * 1000, // Zaman penceresi
  blockDurationMs: 30 * 60 * 1000, // Bloke süresi
};
```

### CSP (Content Security Policy) Ayarları:
```typescript
// middleware.ts içinde düzenlenebilir

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://trusted-domain.com",
  // ... diğer ayarlar
].join('; ');
```

---

## 🚨 Acil Durum Prosedürü

### Brute Force Saldırısı:
1. Rate limiter otomatik bloklar
2. Saldırganın email/IP'si 30 dakika bloke olur
3. Loglara kayıt düşer
4. Admin bildirimi (TODO: implement)

### Bot Saldırısı:
1. Honeypot botu tespit eder
2. İstek sessizce reddedilir
3. Görünür hata gösterilmez (bot'u uyarmamak için)
4. Console'a log yazılır

### SQL Injection Girişimi:
1. Input validator tehlikeli karakterleri temizler
2. Backend parametreli sorgu kullanmalı
3. Hata loglanmalı
4. IP blacklist'e eklenebilir

---

## 📚 Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
