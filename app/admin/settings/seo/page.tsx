'use client';

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  message,
  Typography,
  Tabs,
  Upload,
  Switch,
  Divider,
  Row,
  Col,
  Select,
  Table,
  Tag,
  Alert,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SaveOutlined,
  SearchOutlined,
  GlobalOutlined,
  UploadOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SEOSettings {
  locale: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
}

interface PageSEO {
  id: string;
  pageType: string;
  pageName: string;
  settings: Record<string, SEOSettings>;
}

const locales = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

// Mock data for different page types
const mockPageSEO: PageSEO[] = [
  {
    id: '1',
    pageType: 'home',
    pageName: 'Home Page',
    settings: {
      tr: {
        locale: 'tr',
        metaTitle: 'FreeStays - En İyi Otel Fırsatları',
        metaDescription: 'FreeStays ile dünyanın dört bir yanından en iyi otel fırsatlarını keşfedin. Ekonomik fiyatlar, güvenli rezervasyon.',
        keywords: 'otel, rezervasyon, tatil, konaklama, ucuz otel',
        ogImage: '/images/og/home-tr.jpg',
      },
      en: {
        locale: 'en',
        metaTitle: 'FreeStays - Best Hotel Deals',
        metaDescription: 'Discover the best hotel deals worldwide with FreeStays. Affordable prices, secure booking.',
        keywords: 'hotel, booking, vacation, accommodation, cheap hotel',
        ogImage: '/images/og/home-en.jpg',
      },
      de: {
        locale: 'de',
        metaTitle: 'FreeStays - Die besten Hotelangebote',
        metaDescription: 'Entdecken Sie die besten Hotelangebote weltweit mit FreeStays.',
        keywords: 'hotel, buchung, urlaub, unterkunft, günstiges hotel',
        ogImage: '/images/og/home-de.jpg',
      },
    },
  },
  {
    id: '2',
    pageType: 'search',
    pageName: 'Search Results',
    settings: {
      tr: {
        locale: 'tr',
        metaTitle: '{{destination}} Otelleri - FreeStays',
        metaDescription: '{{destination}} bölgesinde {{count}} otel bulundu. En iyi fiyatları karşılaştırın.',
        keywords: 'otel arama, {{destination}}, konaklama',
        ogImage: '/images/og/search.jpg',
      },
      en: {
        locale: 'en',
        metaTitle: '{{destination}} Hotels - FreeStays',
        metaDescription: 'Found {{count}} hotels in {{destination}}. Compare the best prices.',
        keywords: 'hotel search, {{destination}}, accommodation',
        ogImage: '/images/og/search.jpg',
      },
    },
  },
  {
    id: '3',
    pageType: 'hotel_detail',
    pageName: 'Hotel Details',
    settings: {
      tr: {
        locale: 'tr',
        metaTitle: '{{hotelName}} - {{city}} | FreeStays',
        metaDescription: '{{hotelName}} otelinde konaklayın. {{starRating}} yıldızlı otel, {{city}}.',
        keywords: '{{hotelName}}, {{city}} otel',
        ogImage: '',
      },
      en: {
        locale: 'en',
        metaTitle: '{{hotelName}} - {{city}} | FreeStays',
        metaDescription: 'Stay at {{hotelName}}. {{starRating}} star hotel in {{city}}.',
        keywords: '{{hotelName}}, {{city}} hotel',
        ogImage: '',
      },
    },
  },
  {
    id: '4',
    pageType: 'about',
    pageName: 'About Us',
    settings: {
      tr: {
        locale: 'tr',
        metaTitle: 'Hakkımızda - FreeStays',
        metaDescription: 'FreeStays hakkında bilgi edinin. Misyonumuz, vizyonumuz ve ekibimiz.',
        keywords: 'hakkımızda, freestays, şirket',
        ogImage: '/images/og/about.jpg',
      },
    },
  },
  {
    id: '5',
    pageType: 'contact',
    pageName: 'Contact',
    settings: {
      tr: {
        locale: 'tr',
        metaTitle: 'İletişim - FreeStays',
        metaDescription: 'FreeStays ile iletişime geçin. Sorularınız için bize ulaşın.',
        keywords: 'iletişim, destek, freestays',
        ogImage: '',
      },
    },
  },
];

// Robots.txt and sitemap settings
interface CrawlerSettings {
  robotsTxt: string;
  sitemapEnabled: boolean;
  googleVerification: string;
  bingVerification: string;
  yandexVerification: string;
}

const mockCrawlerSettings: CrawlerSettings = {
  robotsTxt: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: https://freestays.com/sitemap.xml`,
  sitemapEnabled: true,
  googleVerification: 'google-verification-code',
  bingVerification: '',
  yandexVerification: '',
};

export default function SEOSettingsPage() {
  const [pages, setPages] = useState<PageSEO[]>(mockPageSEO);
  const [selectedPage, setSelectedPage] = useState<PageSEO>(mockPageSEO[0]);
  const [selectedLocale, setSelectedLocale] = useState('tr');
  const [crawlerSettings, setCrawlerSettings] = useState<CrawlerSettings>(mockCrawlerSettings);
  const [form] = Form.useForm();
  const [crawlerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePageSelect = (page: PageSEO) => {
    setSelectedPage(page);
    const settings = page.settings[selectedLocale] || {
      locale: selectedLocale,
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      ogImage: '',
    };
    form.setFieldsValue(settings);
  };

  const handleLocaleChange = (locale: string) => {
    setSelectedLocale(locale);
    const settings = selectedPage.settings[locale] || {
      locale: locale,
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      ogImage: '',
    };
    form.setFieldsValue(settings);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPages(pages.map(p => {
      if (p.id === selectedPage.id) {
        return {
          ...p,
          settings: {
            ...p.settings,
            [selectedLocale]: { ...values, locale: selectedLocale },
          },
        };
      }
      return p;
    }));
    
    message.success('SEO settings saved');
    setLoading(false);
  };

  const handleCrawlerSave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCrawlerSettings(values);
    message.success('Crawler settings saved');
    setLoading(false);
  };

  const pageColumns = [
    {
      title: 'Page',
      dataIndex: 'pageName',
      key: 'pageName',
      render: (name: string, record: PageSEO) => (
        <Space>
          <Text strong>{name}</Text>
          <Text type="secondary" code style={{ fontSize: 11 }}>{record.pageType}</Text>
        </Space>
      ),
    },
    {
      title: 'Translations',
      key: 'translations',
      render: (_: any, record: PageSEO) => (
        <Space>
          {locales.slice(0, 5).map(locale => {
            const hasSettings = record.settings[locale.code]?.metaTitle;
            return (
              <Tag 
                key={locale.code} 
                color={hasSettings ? 'green' : 'default'}
                style={{ opacity: hasSettings ? 1 : 0.5, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedPage(record);
                  handleLocaleChange(locale.code);
                }}
              >
                {locale.flag}
              </Tag>
            );
          })}
        </Space>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'pages',
      label: <Space><SearchOutlined />Page SEO</Space>,
      children: (
        <Row gutter={24}>
          <Col span={8}>
            <Card title="Pages" size="small">
              <Table
                columns={pageColumns}
                dataSource={pages}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => handlePageSelect(record),
                  style: {
                    cursor: 'pointer',
                    backgroundColor: selectedPage.id === record.id ? '#e6f7ff' : 'transparent',
                  },
                })}
              />
            </Card>
          </Col>
          <Col span={16}>
            <Card 
              title={
                <Space>
                  <Text strong>{selectedPage.pageName} SEO Settings</Text>
                  <Select
                    value={selectedLocale}
                    onChange={handleLocaleChange}
                    style={{ width: 140 }}
                    options={locales.map(l => ({
                      label: <Space>{l.flag} {l.name}</Space>,
                      value: l.code,
                    }))}
                  />
                </Space>
              }
              size="small"
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={selectedPage.settings[selectedLocale] || {}}
                onFinish={handleSave}
              >
                <Form.Item
                  name="metaTitle"
                  label="Meta Title"
                  extra="Recommended length: 50-60 characters"
                >
                  <Input placeholder="Page title" showCount maxLength={70} />
                </Form.Item>

                <Form.Item
                  name="metaDescription"
                  label="Meta Description"
                  extra="Recommended length: 150-160 characters"
                >
                  <TextArea rows={3} placeholder="Page description" showCount maxLength={200} />
                </Form.Item>

                <Form.Item
                  name="keywords"
                  label="Keywords"
                  extra="Comma separated keywords"
                >
                  <Input placeholder="keywords, here, separated" />
                </Form.Item>

                <Form.Item
                  name="ogImage"
                  label="Open Graph Image"
                >
                  <Input placeholder="/images/og/page.jpg" addonBefore={<UploadOutlined />} />
                </Form.Item>

                <Alert
                  message="Dynamic Variables"
                  description={
                    <Space wrap>
                      <Tag color="blue">{`{{destination}}`}</Tag>
                      <Tag color="blue">{`{{hotelName}}`}</Tag>
                      <Tag color="blue">{`{{city}}`}</Tag>
                      <Tag color="blue">{`{{starRating}}`}</Tag>
                      <Tag color="blue">{`{{count}}`}</Tag>
                    </Space>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    Save
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'crawler',
      label: <Space><RobotOutlined />Crawler Settings</Space>,
      children: (
        <Form
          form={crawlerForm}
          layout="vertical"
          initialValues={crawlerSettings}
          onFinish={handleCrawlerSave}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Robots.txt" size="small">
                <Form.Item name="robotsTxt">
                  <TextArea rows={12} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Verification Codes" size="small">
                <Form.Item name="googleVerification" label="Google Search Console">
                  <Input placeholder="google-verification-code" />
                </Form.Item>

                <Form.Item name="bingVerification" label="Bing Webmaster">
                  <Input placeholder="bing-verification-code" />
                </Form.Item>

                <Form.Item name="yandexVerification" label="Yandex Webmaster">
                  <Input placeholder="yandex-verification-code" />
                </Form.Item>
              </Card>

              <Card title="Sitemap" size="small" style={{ marginTop: 16 }}>
                <Form.Item name="sitemapEnabled" valuePropName="checked">
                  <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                  <Text style={{ marginLeft: 12 }}>Auto sitemap generation</Text>
                </Form.Item>
                <Text type="secondary">
                  Sitemap URL: https://freestays.com/sitemap.xml
                </Text>
              </Card>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Kaydet
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SearchOutlined style={{ marginRight: 12 }} />
          SEO Settings
        </Title>
      </div>

      <Alert
        message="SEO Optimization"
        description="You can configure separate SEO settings for each page and language. Use variables for dynamic pages."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
