'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Sparkles, Heart, Wallet, Trees, Snowflake, Waves } from 'lucide-react';
import Link from 'next/link';

interface Theme {
  themeId: number;
  name: string;
  englishName: string;
  id: string;
}

interface ThemedHotelsProps {
  locale: string;
  themeIds?: number[];
  title?: string;
}

export function ThemedHotels({ locale, themeIds, title }: ThemedHotelsProps) {
  const t = useTranslations('home');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  // Bir hafta sonrası tarihini hesapla
  const getNextWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const checkInDate = getNextWeekDate();

  useEffect(() => {
    loadThemes();
  }, [themeIds]);

  const loadThemes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sunhotels/themes`);
      
      if (response.ok) {
        const result = await response.json();
        let themesData = result.data || result;
        
        // Filter by themeIds if provided
        if (themeIds && themeIds.length > 0) {
          themesData = themesData.filter((theme: Theme) => 
            themeIds.includes(theme.themeId)
          );
        }
        
        setThemes(Array.isArray(themesData) ? themesData : []);
      } else {
        console.error('Failed to fetch themes, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get theme icon
  const getThemeIcon = (themeName: string) => {
    const iconMap: { [key: string]: any } = {
      'luxury': Sparkles,
      'spa': Waves,
      'family': Heart,
      'budget': Wallet,
      'eco-certified': Trees,
      'skiing': Snowflake,
    };
    return iconMap[themeName] || Sparkles;
  };

  // Get theme background gradient
  const getThemeGradient = (themeName: string) => {
    const gradientMap: { [key: string]: string } = {
      'luxury': 'from-yellow-500 to-amber-600',
      'spa': 'from-blue-500 to-cyan-600',
      'family': 'from-pink-500 to-rose-600',
      'budget': 'from-green-500 to-emerald-600',
      'eco-certified': 'from-green-600 to-teal-600',
      'skiing': 'from-blue-600 to-indigo-600',
    };
    return gradientMap[themeName] || 'from-primary to-secondary';
  };

  // Get theme image
  const getThemeImage = (themeName: string): string => {
    const imageMap: { [key: string]: string } = {
      'luxury': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
      'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
      'family': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80',
      'budget': 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80',
      'eco-certified': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
      'skiing': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
    };
    return imageMap[themeName] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
  };

  // Translate theme name
  const translateTheme = (themeName: string): string => {
    const translations: { [key: string]: string } = {
      'luxury': t('themes.luxury'),
      'spa': t('themes.spa'),
      'family': t('themes.family'),
      'budget': t('themes.budget'),
      'eco-certified': t('themes.ecoCertified'),
      'skiing': t('themes.skiing'),
    };
    return translations[themeName] || themeName;
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (themes.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {title || t('themedHotels.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('themedHotels.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto">
          {themes.map((theme) => {
            const Icon = getThemeIcon(theme.englishName);
            
            return (
              <Link
                key={theme.id}
                href={`/${locale}/search?themeId=${theme.themeId}&themeName=${theme.englishName}&checkInDate=${checkInDate}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  <div className="relative h-40">
                    <img
                      src={getThemeImage(theme.englishName)}
                      alt={translateTheme(theme.englishName)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${getThemeGradient(theme.englishName)} opacity-60`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mb-2">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-center text-sm">
                        {translateTheme(theme.englishName)}
                      </h3>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
