'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface FAQ {
  question: string;
  answer: string;
}

export default function ContactPage() {
  const t = useTranslations('contact');
  
  const faqs: FAQ[] = [
    {
      question: t('faq.items.0.question'),
      answer: t('faq.items.0.answer'),
    },
    {
      question: t('faq.items.1.question'),
      answer: t('faq.items.1.answer'),
    },
    {
      question: t('faq.items.2.question'),
      answer: t('faq.items.2.answer'),
    },
    {
      question: t('faq.items.3.question'),
      answer: t('faq.items.3.answer'),
    },
    {
      question: t('faq.items.4.question'),
      answer: t('faq.items.4.answer'),
    },
    {
      question: t('faq.items.5.question'),
      answer: t('faq.items.5.answer'),
    },
    {
      question: t('faq.items.6.question'),
      answer: t('faq.items.6.answer'),
    },
    {
      question: t('faq.items.7.question'),
      answer: t('faq.items.7.answer'),
    },
  ];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submit logic
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* İletişim Bilgileri */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t('info.phone.title')}</h3>
            <p className="text-muted-foreground mb-2">{t('info.phone.number')}</p>
            <p className="text-sm text-muted-foreground">{t('info.phone.hours')}</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t('info.email.title')}</h3>
            <p className="text-muted-foreground mb-2">{t('info.email.address')}</p>
            <p className="text-sm text-muted-foreground">{t('info.email.response')}</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t('info.address.title')}</h3>
            <p className="text-muted-foreground mb-2">{t('info.address.line1')}</p>
            <p className="text-sm text-muted-foreground">{t('info.address.line2')}</p>
          </Card>
        </div>

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

          {/* Harita */}
          <Card className="p-0 overflow-hidden">
            <div className="h-full min-h-[500px] bg-muted relative">
              {/* Google Maps iframe veya başka harita servisi buraya eklenebilir */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{t('map.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('info.address.line1')}<br />
                  {t('info.address.line2')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('map.coordinates')}
                </p>
                
                {/* Alternatif olarak gerçek harita iframe'i */}
                {/* <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                /> */}
              </div>
            </div>
          </Card>
        </div>

        {/* Çalışma Saatleri */}
        <Card className="p-8 mb-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t('hours.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('hours.weekdays')}</span>
                <span className="text-muted-foreground">{t('hours.weekdaysTime')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('hours.saturday')}</span>
                <span className="text-muted-foreground">{t('hours.saturdayTime')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('hours.sunday')}</span>
                <span className="text-muted-foreground">{t('hours.sundayTime')}</span>
              </div>
            </div>

            <div className="bg-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>{t('hours.emergency.title')}</strong> {t('hours.emergency.time')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('hours.emergency.description')}
              </p>
            </div>
          </div>
        </Card>

        {/* FAQ Bölümü */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('faq.title')}</h2>
            <p className="text-muted-foreground">
              {t('faq.description')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                
                {openFaqIndex === index && (
                  <div className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Yardım Merkezi CTA */}
        <Card className="mt-16 p-8 bg-gradient-to-r from-primary to-secondary text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            {t('help.title')}
          </h3>
          <p className="mb-6 opacity-90">
            {t('help.description')}
          </p>
          <Button variant="secondary" size="lg">
            {t('help.button')}
          </Button>
        </Card>
      </div>
    </div>
  );
}
