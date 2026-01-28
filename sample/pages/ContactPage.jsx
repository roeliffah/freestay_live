import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    page_title: 'Get in Touch',
    page_subtitle: 'Have questions? We\'re here to help. Reach out to our team and we\'ll get back to you as soon as possible.',
    email: 'hello@freestays.eu',
    email_note: 'We respond within 24 hours',
    phone: '+31 (0) 123 456 789',
    phone_hours: 'Mon-Fri, 9:00 - 17:00 CET',
    company_name: 'Euro Hotel Cards GmbH',
    address: 'Barneveld, Netherlands',
    support_text: 'Our booking support team is available around the clock for urgent travel assistance.'
  });

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await axios.get(`${API}/contact-settings`);
        setContactInfo(response.data);
      } catch (error) {
        console.log('Using default contact settings');
      }
    };
    fetchContactSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="contact-page">
      {/* Hero Section */}
      <section className="text-center mb-16 px-4">
        <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
          <Phone className="w-4 h-4 mr-1" /> {t('contact.badge', 'Contact Us')}
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">{contactInfo.page_title}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {contactInfo.page_subtitle}
        </p>
      </section>

      {/* Contact Cards */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Email Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.emailTitle', 'Email Us')}</h3>
            <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline text-lg">
              {contactInfo.email}
            </a>
            <p className="text-sm text-muted-foreground mt-2">{contactInfo.email_note}</p>
          </Card>

          {/* Phone Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Phone className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.phoneTitle', 'Call Us')}</h3>
            <a href={`tel:${contactInfo.phone?.replace(/\s/g, '')}`} className="text-primary hover:underline text-lg">
              {contactInfo.phone}
            </a>
            <p className="text-sm text-muted-foreground mt-2">{contactInfo.phone_hours}</p>
          </Card>

          {/* Address Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
              <MapPin className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.officeTitle', 'Visit Us')}</h3>
            <p className="text-muted-foreground">{contactInfo.company_name}</p>
            <p className="text-muted-foreground">{contactInfo.address}</p>
          </Card>
        </div>
      </section>

      {/* Contact Form & Support Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="p-8 rounded-2xl">
            <h2 className="font-serif text-2xl font-semibold mb-6">{t('contact.formTitle', 'Send us a message')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('contact.name', 'Your Name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email">{t('contact.email', 'Email Address')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="subject">{t('contact.subject', 'Subject')}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="message">{t('contact.message', 'Message')}</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full rounded-xl h-12">
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('contact.sending', 'Sending...')}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> {t('contact.send', 'Send Message')}</>
                )}
              </Button>
            </form>
          </Card>

          {/* Support Info */}
          <div className="space-y-8">
            <Card className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('contact.support247', '24/7 Support')}</h3>
                  <p className="text-primary-foreground/80 text-sm">{t('contact.alwaysHere', 'We\'re always here for you')}</p>
                </div>
              </div>
              <p className="text-primary-foreground/90">
                {contactInfo.support_text}
              </p>
            </Card>

            <Card className="p-8 rounded-2xl">
              <h3 className="font-semibold text-lg mb-4">{t('contact.faqTitle', 'Frequently Asked Questions')}</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{t('contact.faq1q', 'How does FreeStays work?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq1a', 'FreeStays partners directly with hotels, eliminating commissions. When you book with a meal package, your room becomes free!')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">{t('contact.faq2q', 'What is the FreeStays Pass?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq2a', 'The Pass unlocks our best rates. Choose a One-Time Pass (€35) or Annual Pass (€129) for unlimited savings.')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">{t('contact.faq3q', 'Can I cancel my booking?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq3a', 'Cancellation policies vary by hotel. Check the specific terms during booking for free cancellation deadlines.')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
