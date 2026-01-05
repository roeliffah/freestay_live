# Dokploy Deployment Guide

## Environment Variables

Dokploy UI'da aşağıdaki environment variable'ları tanımlayın:

### Required Variables

```bash
# Backend API URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://freestays-api-bi5laf-517ca3-3-72-175-63.traefik.me/api/v1

# Node Environment
NODE_ENV=production

# Next.js timezone
NEXT_INTL_DEFAULT_TIMEZONE=Europe/Amsterdam

# Port Configuration
PORT=4830
HOSTNAME=0.0.0.0
```

### Optional Variables

```bash
# Default locale
NEXT_PUBLIC_DEFAULT_LOCALE=tr

# Stripe (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## Build Configuration

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm run start
```

### Install Command
```bash
npm install
```

## Important Notes

1. **Environment Variables**: Dokploy'da tanımlanan environment variable'lar build time'da kullanılır
2. **NEXT_PUBLIC_* Variables**: Bu prefix'li değişkenler client-side'da da kullanılabilir
3. **Build Process**: Her deploy'da yeni build alınır, bu yüzden environment variable'lar build öncesi tanımlanmalı
4. **Port**: Dockerfile'da `PORT=4830` kullanılıyor, Dokploy'da da aynı port tanımlanmalı

## Troubleshooting

### API Erişim Sorunu
Eğer API'ye erişemiyorsanız:

1. Dokploy UI'da `NEXT_PUBLIC_API_URL` tanımlı mı kontrol edin
2. Build loglarını kontrol edin - environment variable'ın doğru okunduğunu onaylayın
3. Browser console'da `window.NEXT_PUBLIC_API_URL` yazın - değeri kontrol edin
4. Network tab'da API isteklerini inceleyin - doğru URL'e gidiyor mu?

### Environment Variable Değişikliği
Environment variable'ı değiştirdiyseniz:

1. Dokploy'da yeni değeri kaydedin
2. **Rebuild** tetikleyin (restart yeterli değil!)
3. Build tamamlanınca yeni değer kullanılacak

## Docker Configuration

Dockerfile zaten yapılandırılmış:
- Multi-stage build kullanıyor
- Production dependencies kullanıyor
- Port 4830'da dinliyor
- Health check içeriyor

## DNS & SSL

Traefik otomatik SSL certificate yönetiyor:
- API: `https://freestays-api-bi5laf-517ca3-3-72-175-63.traefik.me`
- Frontend: Dokploy'da tanımlanan domain

## Deployment Checklist

- [ ] Dokploy'da environment variable'lar tanımlandı
- [ ] `NEXT_PUBLIC_API_URL` doğru API URL'ini içeriyor
- [ ] Build command: `npm run build`
- [ ] Start command: `npm run start`
- [ ] Port: `4830`
- [ ] Health check aktif
- [ ] Domain/subdomain tanımlandı
- [ ] SSL certificate aktif
