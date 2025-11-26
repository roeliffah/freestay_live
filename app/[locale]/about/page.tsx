import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HotelSlider } from '@/components/about/HotelSlider';
import { 
  Target, 
  Users, 
  Award, 
  Heart,
  Shield,
  TrendingUp,
  Globe,
  Sparkles
} from 'lucide-react';

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t('hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('values.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('values.satisfaction.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('values.satisfaction.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('values.reliability.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('values.reliability.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('values.innovation.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('values.innovation.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('values.quality.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('values.quality.description')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Hikayemiz */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">{t('story.title')}</h2>
            <Card className="p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('story.paragraph1')}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('story.paragraph2')}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t('story.paragraph3')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* İstatistikler */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('stats.title')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <p className="text-4xl font-bold text-primary mb-2">150+</p>
              <p className="text-sm text-muted-foreground">{t('stats.countries')}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Target className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-4xl font-bold text-secondary mb-2">50K+</p>
              <p className="text-sm text-muted-foreground">{t('stats.hotels')}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <p className="text-4xl font-bold text-accent mb-2">2M+</p>
              <p className="text-sm text-muted-foreground">{t('stats.guests')}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <p className="text-4xl font-bold text-primary mb-2">98%</p>
              <p className="text-sm text-muted-foreground">{t('stats.satisfaction')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Türkiye'deki Popüler Oteller */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('hotels.title')}</h2>
            <p className="text-muted-foreground">
              {t('hotels.description')}
            </p>
          </div>
          
          <HotelSlider />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t('cta.description')}
          </p>
          <a 
            href={`/${locale}`}
            className="inline-block bg-white text-primary px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('cta.button')}
          </a>
        </div>
      </section>
    </div>
  );
}
