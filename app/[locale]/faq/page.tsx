'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { facsAPI } from '@/lib/api/client';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

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

const categories = [
  { value: 'general', label: 'General' },
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Payment' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'account', label: 'Account' },
];

export default function FAQPage() {
  const t = useTranslations('faq');
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const data = await facsAPI.getFaqsByCategory(locale, selectedCategory);
        setFaqs(data);
      } catch (error) {
        console.error('Failed to load FAQs:', error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [locale, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-12 flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`categories.${cat.value}`)}
            </button>
          ))}
        </div>

        {/* FAQs List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Yükleniyor...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Bu kategoride SSS bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs
              .filter(faq => faq.isActive)
              .sort((a, b) => a.order - b.order)
              .map(faq => {
                const translation = faq.translations?.find(t => t.locale === locale);
                const question = translation?.question || '';
                const answer = translation?.answer || '';

                if (!question) return null;

                return (
                  <Card
                    key={faq.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4">
                        {question}
                      </span>
                      {openFaqId === faq.id ? (
                        <ChevronUp className="h-5 w-5 text-blue-600 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                      )}
                    </button>

                    {openFaqId === faq.id && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {answer}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            {t('help.title')}
          </h3>
          <p className="mb-6 opacity-90">
            {t('help.description')}
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('help.button')}
          </a>
        </Card>
      </div>
    </div>
  );
}
