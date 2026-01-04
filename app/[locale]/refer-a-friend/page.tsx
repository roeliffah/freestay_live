'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Check, 
  ArrowRight,
  Users,
  Heart,
  Mail,
  Copy,
  Loader2,
  DollarSign,
  Share2,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';

export default function ReferAFriendPage() {
  const t = useTranslations('referral');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // TODO: Replace with actual auth context
  
  // Mock referral code - Bu auth context'ten gelecek
  const referralCode = isLoggedIn ? 'FS12345678' : null;
  const referralLink = referralCode ? `https://freestays.eu/?ref=${referralCode}` : null;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const benefits = [
    { 
      icon: <DollarSign className="w-6 h-6" />,
      title: t('benefits.b1.title'),
      desc: t('benefits.b1.desc')
    },
    { 
      icon: <Zap className="w-6 h-6" />,
      title: t('benefits.b2.title'),
      desc: t('benefits.b2.desc')
    },
    { 
      icon: <Users className="w-6 h-6" />,
      title: t('benefits.b3.title'),
      desc: t('benefits.b3.desc')
    },
    { 
      icon: <Heart className="w-6 h-6" />,
      title: t('benefits.b4.title'),
      desc: t('benefits.b4.desc')
    },
  ];

  const steps = [
    { 
      num: '1', 
      title: t('steps.s1.title'),
      desc: t('steps.s1.desc')
    },
    { 
      num: '2', 
      title: t('steps.s2.title'),
      desc: t('steps.s2.desc')
    },
    { 
      num: '3', 
      title: t('steps.s3.title'),
      desc: t('steps.s3.desc')
    },
    { 
      num: '4', 
      title: t('steps.s4.title'),
      desc: t('steps.s4.desc')
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Badge className="mb-6 bg-accent text-accent-foreground border-0 px-6 py-2 text-sm font-bold">
            <Gift className="w-4 h-4 mr-2" />
            {t('hero.badge')}
          </Badge>
          
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Referral Code Box */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          {isLoggedIn ? (
            <Card className="p-8 rounded-3xl shadow-2xl border-0 bg-card">
              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl font-semibold mb-2">{t('codeBox.title')}</h2>
                <p className="text-muted-foreground">{t('codeBox.subtitle')}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-xl p-4 font-mono text-xl text-center font-bold tracking-wider">
                    {referralCode}
                  </div>
                  <Button 
                    size="lg"
                    className="rounded-xl h-14 px-6"
                    onClick={() => copyToClipboard(referralCode!)}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    value={referralLink!}
                    readOnly
                    className="flex-1 h-12 rounded-xl bg-secondary/50"
                  />
                  <Button 
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-6"
                    onClick={() => copyToClipboard(referralLink!)}
                  >
                    {t('codeBox.copyLink')}
                  </Button>
                </div>
                
                <div className="flex justify-center gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(t('sharing.whatsappText') + referralCode)}`, '_blank')}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => window.open(`mailto:?subject=${encodeURIComponent(t('sharing.emailSubject'))}&body=${encodeURIComponent(t('sharing.emailBodyPrefix') + referralCode)}`, '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {t('sharing.email')}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
              <h2 className="font-serif text-2xl font-semibold mb-4">{t('codeBox.title')}</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Referral kodunuzu görmek ve arkadaşlarınızı davet etmek için giriş yapmanız gerekir.
              </p>
              <Link href={`/${locale}/auth/login`}>
                <Button size="lg" className="rounded-full px-10">
                  Giriş Yap
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-4 h-4 mr-1" />
              {t('how.badge')}
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">{t('how.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('how.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 rounded-2xl border-0 shadow-lg h-full text-center hover:shadow-xl transition-all">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </Card>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">{t('why.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('why.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all text-primary">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">{t('comparison.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('comparison.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Friend's Benefits */}
            <Card className="p-8 rounded-3xl border-2 border-border/50 shadow-lg">
              <h3 className="font-serif text-2xl font-semibold mb-6 flex items-center gap-2">
                {t('comparison.friendTitle')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{t('comparison.friend1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{t('comparison.friend2')}</p>
                </div>
              </div>
            </Card>

            {/* Your Benefits */}
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 shadow-lg">
              <h3 className="font-serif text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
                {t('comparison.youTitle')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-primary">{t('comparison.you1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-primary">{t('comparison.you2')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/90">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-white/80 text-lg mb-8">
            {t('cta.subtitle')}
          </p>
          <Link href={`/${locale}`}>
            <Button size="lg" className="rounded-full px-10 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
              {t('cta.button')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
