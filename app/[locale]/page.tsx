import { getTranslations } from 'next-intl/server';
import DynamicHomePage from '@/components/home/DynamicHomePage';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  return <DynamicHomePage locale={locale} />;
}
