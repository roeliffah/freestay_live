'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, Typography, Empty, Button } from 'antd';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function BookingsPage() {
  const locale = useLocale();
  const t = useTranslations('bookings');
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isAuthenticated, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Typography.Text>Loading...</Typography.Text>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Title level={1}>{t('title') || 'My Bookings'}</Title>
          <Text type="secondary">{t('subtitle') || 'Manage your reservations'}</Text>
        </div>

        <Card className="rounded-lg shadow-md">
          <Empty
            description={t('noBookings') || 'No bookings yet'}
            style={{ marginTop: 48, marginBottom: 48 }}
          />
          <div className="text-center">
            <Link href={`/${locale}`}>
              <Button type="primary" size="large">
                {t('searchHotels') || 'Start Searching Hotels'}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
