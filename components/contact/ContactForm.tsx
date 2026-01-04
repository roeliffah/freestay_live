'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

interface ContactFormProps {
  email?: string;
}

export default function ContactForm({ email }: ContactFormProps) {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setErrorMessage(t('form.allFieldsRequired'));
      return;
    }

    setStatus('loading');

    try {
      // API endpoint'ine gönder
      const response = await fetch('/api/v1/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // 5 saniye sonra durumu sıfırla
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(t('form.sendError') || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        {t('form.title')}
      </h2>

      {status === 'success' && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {t('form.sendSuccess')}
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.name')}
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('form.namePlaceholder')}
            disabled={status === 'loading'}
            className="w-full"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.email')}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('form.emailPlaceholder')}
            disabled={status === 'loading'}
            className="w-full"
          />
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.subject')}
          </label>
          <Input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            placeholder={t('form.subjectPlaceholder')}
            disabled={status === 'loading'}
            className="w-full"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.message')}
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder={t('form.messagePlaceholder')}
            disabled={status === 'loading'}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {status === 'loading' ? t('form.sending') : t('form.send')}
        </Button>
      </form>
    </Card>
  );
}
