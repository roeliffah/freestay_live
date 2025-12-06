import { getTranslations } from 'next-intl/server';
import { SearchForm } from '@/components/search/SearchForm';
import { PopularHotels } from '@/components/home/PopularHotels';
import { Star, Shield, Clock, Sparkles, MapPin, Hotel, Umbrella, Plane, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  return (
    <div className="flex flex-col">
      {/* Hero Section with Background Image */}
      <section className="relative h-[600px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-5xl mx-auto w-full">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Room Types Selection */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">{t('roomTypes.title')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link href={`/${locale}/search?type=hotel`}>
              <Card className="p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Hotel className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold">{t('roomTypes.hotel.title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.hotel.description')}</p>
              </Card>
            </Link>

            <Link href={`/${locale}/search?type=resort`}>
              <Card className="p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Umbrella className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold">{t('roomTypes.resort.title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.resort.description')}</p>
              </Card>
            </Link>

            <Link href={`/${locale}/search?type=apart`}>
              <Card className="p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plane className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-bold">{t('roomTypes.apart.title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.apart.description')}</p>
              </Card>
            </Link>

            <Link href={`/${locale}/search?type=villa`}>
              <Card className="p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-bold">{t('roomTypes.villa.title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.villa.description')}</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('features.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.bestPrice')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.bestPriceDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.secure')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.secureDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.support')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.supportDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('features.hotels')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('features.hotelsDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Hotels */}
      <PopularHotels locale={locale} />

      {/* Popular Destinations with Campaign Banners */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('destinations.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Large Destination Card */}
            <Link href={`/${locale}/search?destinationId=228&destination=Antalya`} className="md:col-span-2 md:row-span-2">
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-full min-h-[400px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
                    alt="Antalya"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <Badge className="mb-3 bg-red-500">{t('destinations.antalya.discount')}</Badge>
                    <h3 className="text-4xl font-bold mb-2">{t('destinations.antalya.title')}</h3>
                    <p className="text-lg flex items-center mb-3">
                      <MapPin className="h-5 w-5 mr-2" />
                      {t('destinations.antalya.subtitle')}
                    </p>
                    <p className="text-sm opacity-90 mb-3">{t('destinations.antalya.hotelsCount')} | {t('destinations.antalya.description')}</p>
                    <Button variant="secondary" size="sm">
                      {t('destinations.antalya.button')}
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Smaller Cards */}
            <Link href={`/${locale}/search?destinationId=92&destination=Istanbul`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-[192px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800"
                    alt={t('destinations.istanbul.title')}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{t('destinations.istanbul.title')}</h3>
                    <p className="text-xs">{t('destinations.istanbul.hotelsCount')}</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/${locale}/search?destination=bodrum`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-[192px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"
                    alt={t('destinations.bodrum.title')}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{t('destinations.bodrum.title')}</h3>
                    <p className="text-xs">{t('destinations.bodrum.hotelsCount')}</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/${locale}/search?destination=cesme`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-[192px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
                    alt={t('destinations.cesme.title')}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{t('destinations.cesme.title')}</h3>
                    <p className="text-xs">{t('destinations.cesme.hotelsCount')}</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/${locale}/search?destination=fethiye`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-[192px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800"
                    alt={t('destinations.fethiye.title')}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{t('destinations.fethiye.title')}</h3>
                    <p className="text-xs">{t('destinations.fethiye.hotelsCount')}</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/${locale}/search?destination=marmaris`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full">
                <div className="relative h-[192px] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800"
                    alt={t('destinations.marmaris.title')}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{t('destinations.marmaris.title')}</h3>
                    <p className="text-xs">{t('destinations.marmaris.hotelsCount')}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offers - Campaign Banner */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-white">
            <div className="mb-6 md:mb-0">
              <Badge className="bg-white text-orange-600 mb-3">{t('campaign.badge')}</Badge>
              <h2 className="text-3xl font-bold mb-2">{t('campaign.title')}</h2>
              <p className="text-lg opacity-90">{t('campaign.subtitle')}</p>
            </div>
            <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
              {t('campaign.button')}
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`/${locale}/search`}
              className="bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
            >
              {t('cta.search')}
            </a>
            <a 
              href={`/${locale}/about`}
              className="bg-white/10 backdrop-blur text-white px-8 py-3 rounded-md font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              {t('cta.learnMore')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
