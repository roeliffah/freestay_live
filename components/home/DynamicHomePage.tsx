'use client';

import { useEffect, useState } from 'react';
import { SearchForm } from '@/components/search/SearchForm';
import { PopularHotels } from '@/components/home/PopularHotels';
import { PopularDestinations } from '@/components/home/PopularDestinations';
import { RomanticTours } from '@/components/home/RomanticTours';
import { TravelCTACards } from '@/components/home/TravelCTACards';
import { Star, Shield, Clock, Sparkles, Hotel, Umbrella, Plane } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface HomePageSection {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  displayOrder: number;
  configuration: any;
}

export default function DynamicHomePage({ locale }: { locale: string }) {
  const t = useTranslations('home');
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, [locale]);

  const loadSections = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/homepage/sections?locale=${locale}`);
      console.log('📄 Homepage sections response status:', response.status);
      console.log('📍 API URL:', `${process.env.NEXT_PUBLIC_API_URL}/public/homepage/sections?locale=${locale}`);
      if (response.ok) {
        const result = await response.json();
        console.log('📦 Homepage sections raw response:', result);
        const data = result.data || result;
        console.log('📦 Homepage sections data:', data);
        
        // API already returns only active sections, just sort by displayOrder
        const sortedSections = (Array.isArray(data) ? data : [])
          .sort((a: HomePageSection, b: HomePageSection) => a.displayOrder - b.displayOrder);
        
        console.log('✅ Sections to display:', sortedSections.length, sortedSections.map((s: HomePageSection) => `${s.sectionType} (order: ${s.displayOrder})`));
        setSections(sortedSections);
      } else {
        console.error('❌ Failed to fetch sections, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load homepage sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section: HomePageSection) => {
    const config = section.configuration || {};
    
    // Use section title/subtitle directly from API
    const sectionTitle = section.title;
    const sectionSubtitle = section.subtitle;

    switch (section.sectionType) {
      case 'hero':
        return (
          <section key={section.id} className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80')" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
            <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
              <div className="max-w-4xl mx-auto text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                  {sectionTitle || t('hero.title')}
                </h1>
                <p className="text-xl text-white/90 mb-8 drop-shadow">
                  {sectionSubtitle || t('hero.subtitle')}
                </p>
              </div>
              <div className="max-w-5xl mx-auto w-full">
                <SearchForm />
              </div>
            </div>
          </section>
        );

      case 'room-types':
        return (
          <section key={section.id} className="py-12 bg-white border-b">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-center mb-8">{sectionTitle || t('roomTypes.title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <Link href={`/${locale}/search?type=hotel`}>
                  <Card className="p-4 md:p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Hotel className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold">{t('roomTypes.hotel.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.hotel.description')}</p>
                  </Card>
                </Link>
                <Link href={`/${locale}/search?type=resort`}>
                  <Card className="p-4 md:p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Umbrella className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-bold">{t('roomTypes.resort.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.resort.description')}</p>
                  </Card>
                </Link>
                <Link href={`/${locale}/search?type=apart`}>
                  <Card className="p-4 md:p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plane className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-bold">{t('roomTypes.apart.title')}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t('roomTypes.apart.description')}</p>
                  </Card>
                </Link>
                <Link href={`/${locale}/search?type=villa`}>
                  <Card className="p-4 md:p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
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
        );

      case 'features':
        return (
          <section key={section.id} className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">{sectionTitle || t('features.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('features.bestPrice')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.bestPriceDesc')}</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('features.secure')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.secureDesc')}</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('features.support')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.supportDesc')}</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('features.hotels')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.hotelsDesc')}</p>
                </Card>
              </div>
            </div>
          </section>
        );

      case 'featured-hotels':
        return <PopularHotels key={section.id} locale={locale} hotelIds={config.hotelIds} title={sectionTitle ?? undefined} />;

      case 'popular-destinations':
        return <PopularDestinations key={section.id} locale={locale} destinationIds={config.destinationIds} title={sectionTitle ?? undefined} />;

      case 'romantic-tours':
        return <RomanticTours key={section.id} locale={locale} hotelIds={config.hotelIds} title={sectionTitle ?? undefined} />;

      case 'campaign-banner':
        return (
          <section key={section.id} className="py-12 bg-gradient-to-r from-orange-500 to-red-500">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between text-white">
                <div className="mb-6 md:mb-0">
                  <Badge className="bg-white text-orange-600 mb-3">{t('campaign.badge')}</Badge>
                  <h2 className="text-3xl font-bold mb-2">{sectionTitle || t('campaign.title')}</h2>
                  <p className="text-lg opacity-90">{sectionSubtitle || t('campaign.subtitle')}</p>
                </div>
                <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                  {t('campaign.button')}
                </Button>
              </div>
            </div>
          </section>
        );

      case 'travel-cta':
        return <TravelCTACards key={section.id} title={sectionTitle ?? undefined} />;

      case 'final-cta':
        return (
          <section key={section.id} className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {sectionTitle || t('cta.title')}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {sectionSubtitle || t('cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={`/${locale}/search`} className="bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                  {t('cta.search')}
                </a>
                <a href={`/${locale}/about`} className="bg-white/10 backdrop-blur text-white px-8 py-3 rounded-md font-semibold hover:bg-white/20 transition-colors border border-white/30">
                  {t('cta.learnMore')}
                </a>
              </div>
            </div>
          </section>
        );

      case 'custom-html':
        return (
          <section key={section.id} className="py-12">
            <div className="container mx-auto px-4">
              <div dangerouslySetInnerHTML={{ __html: config.html || config.configuration || '' }} />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no sections found, show default homepage
  if (sections.length === 0) {
    return (
      <div className="flex flex-col">
        {/* Default Hero Section */}
        <section className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80')" }}>
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
            <div className="max-w-5xl mx-auto w-full">
              <SearchForm />
            </div>
          </div>
        </section>

        {/* Default Popular Hotels */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <PopularHotels locale={locale} />
          </div>
        </section>

        {/* Default Popular Destinations */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <PopularDestinations locale={locale} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sections.map(renderSection)}
    </div>
  );
}
