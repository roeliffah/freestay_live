'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { pagesAPI } from '@/lib/api/client';

interface PageTranslation {
  id: string;
  language: string;
  title: string;
  content: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface StaticPage {
  id: string;
  slug: string;
  isActive: boolean;
  translations: PageTranslation[];
  createdAt: string;
  updatedAt: string;
}

export default function StaticPageDetail() {
  const params = useParams();
  const locale = useLocale();
  const slug = params.slug as string;
  
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        // Public API'den sayfayı getir
        const response: any = await pagesAPI.getPage(slug, locale);
        console.log('📄 Page response:', response);
        
        const data = response?.data || response;
        
        if (!data) {
          setError('Sayfa bulunamadı');
          return;
        }
        
        // Sayfanın aktif olup olmadığını kontrol et
        if (!data.isActive) {
          setError('Bu sayfa yayında değil');
          return;
        }
        
        setPage(data as StaticPage);
      } catch (err) {
        console.error('❌ Sayfa yükleme hatası:', err);
        setError('Sayfa yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Sayfa yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
            Hata
          </h1>
          <p className="text-red-700 dark:text-red-300">
            {error || 'Sayfa bulunamadı'}
          </p>
        </div>
      </div>
    );
  }

  // Mevcut dilin çevirisini bul
  const translation = page.translations.find(
    (t) => t.language.toLowerCase() === locale.toLowerCase()
  ) || page.translations[0]; // Fallback to first translation

  if (!translation) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-300">
            Bu sayfanın {locale} dilinde çevirisi bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {translation.title}
          </h1>
          {translation.metaDescription && (
            <p className="text-lg text-muted-foreground">
              {translation.metaDescription}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose dark:prose-invert max-w-none">
            <div
              className="text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: translation.content }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
