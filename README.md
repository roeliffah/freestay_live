# FreeStays - Vacation Booking Platform 🏖️

Modern tatil rezervasyon platformu. SunHotels API entegrasyonu ile 9 dilde hizmet veren, tatilsepeti.com tarzında tasarlanmış Next.js 14 uygulaması.

## 🌟 Özellikler

### Frontend
- ✅ **9 Dil Desteği**: TR, EN, DE, NL, IT, EL, RU, ES, FR
- ✅ **SunHotels API Entegrasyonu**: Canlı otel verisi (fallback: mock data)
- ✅ **Modern Tasarım**: Tatilsepeti/Jollytur/Etstur tarzı arayüz
- ✅ **Room Type Seçimi**: Otel, Tatil Köyü, Apart Otel, Villa
- ✅ **Gelişmiş Filtreleme**: Fiyat, yıldız, sıralama
- ✅ **Responsive Design**: Mobil, tablet ve desktop uyumlu
- ✅ **XML Parser**: Fast-xml-parser ile SOAP yanıtları

### Admin Dashboard 🔐
- ✅ **Token-based Authentication**: JWT ile güvenli giriş
- ✅ **Middleware Protection**: Token olmadan erişim engellenir
- ✅ **API Integration**: Backend API ile tam entegre
- ✅ **Fallback Mechanism**: API erişilemezse mock data
- ✅ **Dashboard Analytics**: İstatistikler, grafikler, tablolar
- ✅ **Modern Admin UI**: Ant Design components

## 🚀 Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp .env.local.example .env.local

# Development server'ı başlat
npm run dev
```

Tarayıcıda açın: [http://localhost:3000](http://localhost:3000)

## 🔧 API Konfigürasyonu

`.env.local` dosyasını oluşturun:

```env
# Backend API (Admin Dashboard)
NEXT_PUBLIC_API_URL=https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1

# SunHotels API
NEXT_PUBLIC_SUNHOTELS_API_URL=http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx
NEXT_PUBLIC_SUNHOTELS_USERNAME=your_username
NEXT_PUBLIC_SUNHOTELS_PASSWORD=your_password
```

**Admin Panel**: Token tabanlı authentication ile korumalı. Detaylar için [ADMIN_API_INTEGRATION.md](docs/ADMIN_API_INTEGRATION.md) dosyasına bakın.

**SunHotels**: Test hesabı ile API bağlantı hatası durumunda otomatik olarak mock data kullanılır.

## 🌐 API Entegrasyonu

Sistem otomatik olarak:
1. **Canlı API**'ye istek atar
2. Başarısız olursa **XML parse** dener  
3. Her durumda **mock data** fallback kullanır

Console logları:
- 🔍 Request bilgisi
- 📥 Response durumu
- ✅ Başarılı parse (LIVE API)
- 📦 Mock data kullanımı (demo mode)

## 📁 Proje Yapısı

```
freestays/
├── app/[locale]/          # Locale bazlı routing (9 dil)
│   ├── page.tsx           # Ana sayfa
│   ├── search/            # Arama sayfası (API entegre)
│   ├── about/             # Hakkımızda
│   └── contact/           # İletişim
├── components/
│   ├── hotel/             # Otel bileşenleri
│   └── ui/                # shadcn/ui bileşenleri
├── lib/sunhotels/         # SunHotels API client
│   ├── client.ts          # API + XML parser
│   └── types.ts           # TypeScript tipleri
└── messages/              # Çeviri dosyaları (9 dil)
```

## 🎨 Teknolojiler

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **i18n**: next-intl
- **XML Parser**: fast-xml-parser
- **Icons**: Lucide React
- **Fonts**: Inter (Variable)

## 🌍 Desteklenen Diller

🇹🇷 Türkçe • 🇬🇧 English • 🇩🇪 Deutsch • 🇳🇱 Nederlands • 🇮🇹 Italiano  
🇬🇷 Ελληνικά • 🇷🇺 Русский • 🇪🇸 Español • 🇫🇷 Français

## 📱 Sayfalar

- ✅ Ana Sayfa (Room type selection)
- ✅ Arama Sayfası (Canlı API + Filters)
- ✅ Hakkımızda (9 dil)
- ✅ İletişim (9 dil)
- 🔜 Otel Detay
- 🔜 Rezervasyon

## 🧪 Test

```bash
# API testi
node scripts/test_sunhotels_api.js

# Build testi
npm run build
npm start
```

## 📦 Production

### Normal Deployment
```bash
npm run build
npm start
```

### Docker Deployment

#### Development
```bash
# Build Docker image
docker build -t freestays:latest .

# Run container
docker run -p 4830:4830 --env-file .env.production freestays:latest
```

#### Production with Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Uygulama **4830** portunda çalışacaktır: `http://localhost:4830`

Environment variables'ı production ortamınızda (Vercel, Docker, etc.) ayarlayın.

## 📝 Not

Bu demo bir projedir. Gerçek API bağlantısı için production credentials gereklidir. Şu anda mock data ile çalışmaktadır.

---

Built with ❤️ using Next.js 14
