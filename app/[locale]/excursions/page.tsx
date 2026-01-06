'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Typography, Row, Col, Card, Spin, Empty, Button, Space } from 'antd';
import { ShoppingOutlined, LoadingOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

interface AffiliateProgram {
  active: boolean;
  affiliateCode: string | null;
  widgetCode: string | null;
}

interface AffiliateSettings {
  excursions: AffiliateProgram;
  carRental: AffiliateProgram;
  flightBooking: AffiliateProgram;
}

export default function ExcursionsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAffiliatePrograms = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/public/settings/affiliate-programs`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch affiliate programs');
        }

        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching affiliate programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliatePrograms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  const excursionsProgram = settings?.excursions;
  const isActive = excursionsProgram?.active;
  const hasWidget = excursionsProgram?.widgetCode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
            <ShoppingOutlined className="text-3xl text-white" />
          </div>

          <Title level={1} className="!mb-4">
            {t('excursions.title') || 'Tours & Activities'}
          </Title>

          <Text type="secondary" className="text-lg">
            {t('excursions.subtitle') || 'Discover amazing tours and activities at your destination'}
          </Text>
        </div>

        {/* Status Alert */}
        {!isActive && (
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24}>
              <Card
                className="border-l-4 border-yellow-500 bg-yellow-50"
                style={{ borderLeft: '4px solid #eab308' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <Text strong>
                      {t('excursions.notActive') || 'Tours & Activities Coming Soon'}
                    </Text>
                    <Text type="secondary" className="block mt-2">
                      {t('excursions.notActiveDesc') ||
                        'We are working on integrating tours and activities into our platform. Please check back soon!'}
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Main Content */}
        <Row gutter={[24, 24]}>
          {isActive && hasWidget ? (
            <Col xs={24}>
              <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                <div
                  dangerouslySetInnerHTML={{ __html: excursionsProgram.widgetCode || '' }}
                  className="w-full"
                />
              </Card>
            </Col>
          ) : isActive && !hasWidget ? (
            <Col xs={24}>
              <Card className="text-center py-16">
                <Empty
                  description={
                    <Text>{t('excursions.noWidget') || 'No widget available'}</Text>
                  }
                  style={{ marginTop: 48, marginBottom: 48 }}
                />
              </Card>
            </Col>
          ) : (
            <>
              {/* Features Cards */}
              <Col xs={24}>
                <Row gutter={[24, 24]}>
                  {[
                    {
                      icon: '🏖️',
                      title: t('excursions.feature1') || 'Beach Tours',
                      desc: t('excursions.feature1Desc') || 'Explore beautiful beaches and coastal activities'
                    },
                    {
                      icon: '🏔️',
                      title: t('excursions.feature2') || 'Mountain Adventures',
                      desc: t('excursions.feature2Desc') || 'Experience thrilling mountain activities and hiking'
                    },
                    {
                      icon: '🏛️',
                      title: t('excursions.feature3') || 'Cultural Tours',
                      desc: t('excursions.feature3Desc') || 'Discover local culture and historical sites'
                    },
                    {
                      icon: '🍽️',
                      title: t('excursions.feature4') || 'Food Tours',
                      desc: t('excursions.feature4Desc') || 'Taste local cuisine and food experiences'
                    },
                  ].map((feature, idx) => (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                      <Card
                        className="h-full hover:shadow-lg transition-shadow"
                        hoverable
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-4">{feature.icon}</div>
                          <Title level={5} className="!mb-2">
                            {feature.title}
                          </Title>
                          <Text type="secondary" className="text-sm">
                            {feature.desc}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>

              {/* Info Section */}
              <Col xs={24}>
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
                  <Row gutter={[32, 32]}>
                    <Col xs={24} md={12}>
                      <Title level={4} className="!mb-4">
                        {t('excursions.infoTitle') || 'Why Book With Us?'}
                      </Title>
                      <ul className="space-y-3">
                        {[
                          t('excursions.benefit1') || 'Best prices guaranteed',
                          t('excursions.benefit2') || 'Expert local guides',
                          t('excursions.benefit3') || 'Instant confirmation',
                          t('excursions.benefit4') || '24/7 customer support'
                        ].map((benefit, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="text-green-500 font-bold">✓</span>
                            <Text>{benefit}</Text>
                          </li>
                        ))}
                      </ul>
                    </Col>

                    <Col xs={24} md={12}>
                      <Title level={4} className="!mb-4">
                        {t('excursions.ctaTitle') || 'Start Exploring'}
                      </Title>
                      <Text type="secondary" className="block mb-6">
                        {t('excursions.ctaDesc') ||
                          'Browse our collection of amazing tours and book your next adventure today.'}
                      </Text>
                      <Space wrap>
                        <Button
                          type="primary"
                          size="large"
                          className="!rounded-lg !h-11 !px-8"
                        >
                          {t('excursions.browseTours') || 'Browse Tours'}
                        </Button>
                        <Button
                          size="large"
                          className="!rounded-lg !h-11"
                        >
                          <Link href={`/${locale}`}>
                            {t('excursions.backHome') || 'Back to Home'}
                          </Link>
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </>
          )}
        </Row>
      </div>
    </div>
  );
}
