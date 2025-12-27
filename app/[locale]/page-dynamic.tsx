import { getTranslations } from 'next-intl/server';
import { SearchForm } from '@/components/search/SearchForm';
import { PopularHotels } from '@/components/home/PopularHotels';
import { PopularDestinations } from '@/components/home/PopularDestinations';
import { RomanticTours } from '@/components/home/RomanticTours';
import { TravelCTACards } from '@/components/home/TravelCTACards';
import { Star, Shield, Clock, Sparkles, MapPin, Hotel, Umbrella, Plane, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface HomePageSection {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  displayOrder: number;
  configuration: any;
}

async function getHomePageSections(): Promise<HomePageSection[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5240/api/v1';
    const response = await fetch(`${apiUrl}/public/homepage/sections`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch homepage sections, using defaults');
      return getDefaultSections();
    }

    const data = await response.json();
    return data.data || getDefaultSections();
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return getDefaultSections();
  }
}

function getDefaultSections(): HomePageSection[] {
  return [
    {
      id: '1',
      sectionType: 'hero',
      title: null,
      subtitle: null,
      displayOrder: 1,
      configuration: {
        backgroundImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80',
        gradient: 'from-black/60 via-black/40 to-black/60',
        height: '600px',
        showSearchForm: true,
      },
    },
    {
      id: '2',
      sectionType: 'room-types',
      title: null,
      subtitle: null,
      displayOrder: 2,
      configuration: {
        types: [
          { id: 'hotel', icon: 'Hotel', color: 'blue', translationKey: 'roomTypes.hotel' },
          { id: 'resort', icon: 'Umbrella', color: 'green', translationKey: 'roomTypes.resort' },
          { id: 'apart', icon: 'Plane', color: 'purple', translationKey: 'roomTypes.apart' },
          { id: 'villa', icon: 'Sparkles', color: 'orange', translationKey: 'roomTypes.villa' },
        ],
      },
    },
    {
      id: '3',
      sectionType: 'features',
      title: null,
      subtitle: null,
      displayOrder: 3,
      configuration: {
        features: [
          { icon: 'Sparkles', color: 'primary', translationKey: 'features.bestPrice' },
          { icon: 'Shield', color: 'secondary', translationKey: 'features.secure' },
          { icon: 'Clock', color: 'accent', translationKey: 'features.support' },
          { icon: 'Star', color: 'primary', translationKey: 'features.hotels' },
        ],
      },
    },
    {
      id: '4',
      sectionType: 'popular-hotels',
      title: null,
      subtitle: null,
      displayOrder: 4,
      configuration: { fetchMode: 'auto', layout: 'grid-3' },
    },
    {
      id: '5',
      sectionType: 'popular-destinations',
      title: null,
      subtitle: null,
      displayOrder: 5,
      configuration: { fetchMode: 'auto', layout: 'featured-grid' },
    },
    {
      id: '6',
      sectionType: 'romantic-tours',
      title: null,
      subtitle: null,
      displayOrder: 6,
      configuration: { fetchMode: 'auto', layout: 'carousel' },
    },
    {
      id: '7',
      sectionType: 'campaign-banner',
      title: null,
      subtitle: null,
      displayOrder: 7,
      configuration: {
        gradient: 'from-orange-500 to-red-500',
        badge: 'Special Offer',
        buttonText: 'View Deals',
        buttonLink: '/search?offers=true',
      },
    },
    {
      id: '8',
      sectionType: 'travel-cta',
      title: null,
      subtitle: null,
      displayOrder: 8,
      configuration: {},
    },
    {
      id: '9',
      sectionType: 'final-cta',
      title: null,
      subtitle: null,
      displayOrder: 9,
      configuration: {
        gradient: 'from-primary to-secondary',
        buttons: [
          { text: 'Search Hotels', link: '/search', variant: 'primary' },
          { text: 'Learn More', link: '/about', variant: 'secondary' },
        ],
      },
    },
  ];
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const sections = await getHomePageSections();

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <DynamicSection key={section.id} section={section} locale={locale} t={t} />
      ))}
    </div>
  );
}

function DynamicSection({
  section,
  locale,
  t,
}: {
  section: HomePageSection;
  locale: string;
  t: any;
}) {
  const config = section.configuration;

  switch (section.sectionType) {
    case 'hero':
      return <HeroSection config={config} t={t} />;
    
    case 'room-types':
      return <RoomTypesSection config={config} locale={locale} t={t} />;
    
    case 'features':
      return <FeaturesSection config={config} t={t} />;
    
    case 'popular-hotels':
      return <PopularHotels locale={locale} />;
    
    case 'popular-destinations':
      return <PopularDestinations locale={locale} />;
    
    case 'romantic-tours':
      return <RomanticTours locale={locale} />;
    
    case 'campaign-banner':
      return <CampaignBanner config={config} t={t} />;
    
    case 'travel-cta':
      return <TravelCTACards />;
    
    case 'final-cta':
      return <FinalCTA config={config} locale={locale} t={t} />;
    
    case 'custom-html':
      return <CustomHTML config={config} />;
    
    default:
      return null;
  }
}

function HeroSection({ config, t }: { config: any; t: any }) {
  return (
    <section
      className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-cover bg-center"
      style={{ backgroundImage: `url('${config.backgroundImage}')` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient}`} />
      
      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-white/90 mb-8 drop-shadow">
            {t('hero.subtitle')}
          </p>
        </div>

        {config.showSearchForm && (
          <div className="max-w-5xl mx-auto w-full">
            <SearchForm />
          </div>
        )}
      </div>
    </section>
  );
}

function RoomTypesSection({ config, locale, t }: { config: any; locale: string; t: any }) {
  const iconMap: any = { Hotel, Umbrella, Plane, Sparkles };
  const colorMap: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <section className="py-12 bg-white border-b">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">{t('roomTypes.title')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {config.types.map((type: any) => {
            const Icon = iconMap[type.icon];
            return (
              <Link key={type.id} href={`/${locale}/search?type=${type.id}`}>
                <Card className="p-4 md:p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${colorMap[type.color]}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold">{t(`${type.translationKey}.title`)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t(`${type.translationKey}.description`)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ config, t }: { config: any; t: any }) {
  const iconMap: any = { Sparkles, Shield, Clock, Star };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{t('features.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {config.features.map((feature: any, index: number) => {
            const Icon = iconMap[feature.icon];
            return (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${feature.color}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{t(feature.translationKey)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${feature.translationKey}Desc`)}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CampaignBanner({ config, t }: { config: any; t: any }) {
  return (
    <section className={`py-12 bg-gradient-to-r ${config.gradient}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between text-white">
          <div className="mb-6 md:mb-0">
            <Badge className="bg-white text-orange-600 mb-3">{config.badge || t('campaign.badge')}</Badge>
            <h2 className="text-3xl font-bold mb-2">{t('campaign.title')}</h2>
            <p className="text-lg opacity-90">{t('campaign.subtitle')}</p>
          </div>
          <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
            {config.buttonText || t('campaign.button')}
          </Button>
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ config, locale, t }: { config: any; locale: string; t: any }) {
  return (
    <section className={`py-20 bg-gradient-to-r ${config.gradient} text-white`}>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('cta.title')}</h2>
        <p className="text-xl mb-8 opacity-90">{t('cta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {config.buttons?.map((button: any, index: number) => (
            <a
              key={index}
              href={`/${locale}${button.link}`}
              className={
                button.variant === 'primary'
                  ? 'bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors'
                  : 'bg-white/10 backdrop-blur text-white px-8 py-3 rounded-md font-semibold hover:bg-white/20 transition-colors border border-white/30'
              }
            >
              {button.text}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomHTML({ config }: { config: any }) {
  if (!config.html) return null;
  
  return (
    <section className={config.cssClasses || ''}>
      <div dangerouslySetInnerHTML={{ __html: config.html }} />
    </section>
  );
}
