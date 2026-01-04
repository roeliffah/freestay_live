'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import { facsAPI } from '@/lib/api/client';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FaqItem {
  id: string;
  order: number;
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string | null;
  translations: Array<{
    id: string;
    locale: string;
    question: string;
    answer: string;
  }>;
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Debug
  useEffect(() => {
    console.log('Contact Page - Settings:', settings);
    console.log('Contact Page - Loading:', settingsLoading);
    console.log('Address check:', settings?.contact?.address);
    console.log('WorkingHours check:', settings?.contact?.workingHours);
    console.log('MapLatitude:', settings?.contact?.mapLatitude);
    console.log('MapLongitude:', settings?.contact?.mapLongitude);
  }, [settings, settingsLoading]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoadingFaqs(true);
        const data = await facsAPI.getFaqsByCategory(locale, 'general');
        setFaqs(data);
      } catch (error) {
        console.error('Failed to load FAQs:', error);
        setFaqs([]);
      } finally {
        setLoadingFaqs(false);
      }
    };

    fetchFaqs();
  }, [locale]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submit logic - contactEmail'e gönder
    const message = `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}
    `;
    
    if (settings?.contactEmail) {
      window.location.href = `mailto:${settings.contactEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(message)}`;
    }
    
    alert(t('form.successMessage'));
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
            <p className="text-xl text-muted-foreground">
              {t('hero.description')}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Loading State */}
        {settingsLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        )}

        {/* Contact Cards */}
        {!settingsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Telefon */}
            {(settings?.contact?.phone || settings?.supportPhone) && (
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('info.phone.title')}</h3>
                <a href={`tel:${settings?.contact?.phone || settings?.supportPhone}`} className="text-muted-foreground hover:text-primary mb-2 block">
                  {settings?.contact?.phone || settings?.supportPhone}
                </a>
                {settings?.contact?.workingHours && (
                  <p className="text-sm text-muted-foreground">{settings?.contact?.workingHours}</p>
                )}
              </Card>
            )}

            {/* E-posta */}
            {(settings?.contact?.email || settings?.supportEmail) && (
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('info.email.title')}</h3>
                <a href={`mailto:${settings?.contact?.email || settings?.supportEmail}`} className="text-muted-foreground hover:text-secondary mb-2 block">
                  {settings?.contact?.email || settings?.supportEmail}
                </a>
                <p className="text-sm text-muted-foreground">{t('info.email.response')}</p>
              </Card>
            )}

            {/* Adres */}
            {settings && settings.contact && settings.contact.address ? (
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('info.address.title')}</h3>
                <p className="text-muted-foreground mb-2">{settings.contact.address}</p>
                {settings.contact.postalCode && <p className="text-sm text-muted-foreground">{settings.contact.postalCode} {settings.contact.city}</p>}
              </Card>
            ) : null}
          </div>
        )}

        {/* Form ve Harita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* İletişim Formu */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{t('form.title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('form.name.label')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('form.name.placeholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('form.email.label')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder={t('form.email.placeholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('form.subject.label')} <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={t('form.subject.placeholder')}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('form.message.label')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full min-h-[150px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('form.message.placeholder')}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Send className="mr-2 h-5 w-5" />
                {t('form.submit')}
              </Button>
            </form>
          </Card>

          {/* Google Maps iframe */}
          {!settingsLoading && settings?.contact?.googleMapsIframe && (
            <Card className="p-4 overflow-hidden h-full">
              <div 
                className="w-full h-full min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: settings?.contact?.googleMapsIframe }}
              />
            </Card>
          )}
        </div>

        {/* Çalışma Saatleri */}
        {!settingsLoading && settings?.contact?.workingHours && (
        <Card className="p-8 mb-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t('hours.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings?.contact?.workingHours && (
              <div className="bg-card p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  <Clock className="inline h-4 w-4 mr-2" />
                  {t('hours.title')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings?.contact?.workingHours}
                </p>
              </div>
            )}

            {settings?.contact?.whatsapp && (
              <div className="bg-card p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">WhatsApp</p>
                <a 
                  href={`https://wa.me/${settings?.contact?.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {settings?.contact?.whatsapp}
                </a>
              </div>
            )}
          </div>
        </Card>
        )}

        

        {/* FAQ Bölümü */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('faq.title')}</h2>
            <p className="text-muted-foreground">
              {t('faq.description')}
            </p>
          </div>

          {loadingFaqs ? (
            <div className="max-w-4xl mx-auto text-center py-12">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="max-w-4xl mx-auto text-center py-12">
              <p className="text-muted-foreground">Henüz SSS bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => {
                // Find translation for current locale
                const translation = faq.translations?.find(t => t.locale === locale);
                const question = translation?.question || '';
                const answer = translation?.answer || '';

                return (
                  <Card
                    key={faq.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold pr-4">{question}</span>
                      {openFaqIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-primary shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    
                    {openFaqIndex === index && (
                      <div className="px-6 pb-6 text-muted-foreground">
                        {answer}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
