'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Tabs,
  Switch,
  Divider,
  Row,
  Col,
  Select,
  Table,
  Tag,
  Alert,
  Spin,
  App,
  message as antdMessage,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SaveOutlined,
  SearchOutlined,
  GlobalOutlined,
  RobotOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Page types supported in the system
const PAGE_TYPES = [
  { value: 'home', label: 'Home Page' },
  { value: 'search', label: 'Search Page' },
  { value: 'hotel_detail', label: 'Hotel Detail' },
  { value: 'about', label: 'About Us' },
  { value: 'contact', label: 'Contact' },
  { value: 'booking', label: 'Booking' },
];

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

interface PageSeo {
  pageType: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  // Extended Open Graph
  ogType?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;
  // Twitter Card
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterImage?: string;
  // Schema.org Structured Data
  structuredDataJson?: string;
  // Hotel Schema
  hotelSchemaType?: string;
  hotelName?: string;
  hotelImage?: string[];
  hotelAddress?: string;
  hotelTelephone?: string;
  hotelPriceRange?: string;
  hotelStarRating?: number;
  hotelAggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

interface LocaleSeoData {
  pages: PageSeo[];
}

interface GeneralSeoSettings {
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  robotsTxt?: string;
  sitemapEnabled?: boolean;
  // Organization Schema
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationDescription?: string;
  socialProfiles?: string[];
  // Contact Information
  contactPhone?: string;
  contactEmail?: string;
  businessAddress?: string;
}

export default function SEOSettingsPage() {
  return (
    <App>
      <SEOSettingsContent />
    </App>
  );
}

function SEOSettingsContent() {
  const { message: messageApi } = App.useApp();
  const [selectedLocale, setSelectedLocale] = useState('tr');
  const [selectedPageType, setSelectedPageType] = useState<string>('home');
  const [localePages, setLocalePages] = useState<PageSeo[]>([]);
  const [generalSettings, setGeneralSettings] = useState<GeneralSeoSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  
  const [pageForm] = Form.useForm();
  const [generalForm] = Form.useForm();

  useEffect(() => {
    fetchGeneralSettings();
    fetchLocaleSeoSettings(selectedLocale);
  }, []);

  useEffect(() => {
    fetchLocaleSeoSettings(selectedLocale);
  }, [selectedLocale]);

  useEffect(() => {
    // Update form when page type changes
    const currentPage = localePages.find(p => p.pageType === selectedPageType);
    if (currentPage) {
      pageForm.setFieldsValue(currentPage);
    } else {
      pageForm.resetFields();
    }
  }, [selectedPageType, localePages]);

  const fetchGeneralSettings = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getSeoSettings();
      console.log('📥 Received SEO settings from API:', data);
      
      // socialProfiles field'ını düzelt - backend'den string veya farklı formatta gelebilir
      const formData: any = { ...data };
      if ((data as any)?.organizationSocialProfiles) {
        // Backend'den organizationSocialProfiles geliyorsa
        formData.socialProfiles = (data as any).organizationSocialProfiles;
      } else if ((data as any)?.socialProfiles) {
        // socialProfiles string ise array'e çevir
        if (typeof (data as any).socialProfiles === 'string') {
          formData.socialProfiles = (data as any).socialProfiles.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      
      setGeneralSettings(formData);
      generalForm.setFieldsValue(formData);
      console.log('✅ General form values set:', generalForm.getFieldsValue());
      setHasData(true);
      
      // Social settings'ten sosyal medya linklerini çek
      try {
        const socialData: any = await adminAPI.getSocialSettings();
        console.log('📱 Raw social data from API:', socialData);
        const links: string[] = [];
        
        // Doğrudan field'ları kontrol et
        if (socialData?.facebook) links.push(socialData.facebook);
        if (socialData?.twitter) links.push(socialData.twitter);
        if (socialData?.instagram) links.push(socialData.instagram);
        if (socialData?.youtube) links.push(socialData.youtube);
        if (socialData?.linkedin) links.push(socialData.linkedin);
        if (socialData?.tiktok) links.push(socialData.tiktok);
        if (socialData?.pinterest) links.push(socialData.pinterest);
        
        // Eğer socialLinks objesi içinde geliyorsa
        if (socialData?.socialLinks) {
          if (socialData.socialLinks.facebook) links.push(socialData.socialLinks.facebook);
          if (socialData.socialLinks.twitter) links.push(socialData.socialLinks.twitter);
          if (socialData.socialLinks.instagram) links.push(socialData.socialLinks.instagram);
          if (socialData.socialLinks.youTube) links.push(socialData.socialLinks.youTube);
          if (socialData.socialLinks.linkedIn) links.push(socialData.socialLinks.linkedIn);
        }
        
        setSocialLinks(links);
        console.log('👥 Social links extracted:', links);
      } catch (err) {
        console.error('Could not fetch social settings:', err);
      }
    } catch (error: any) {
      console.error('Failed to load general SEO settings:', error);
      if (error.message?.includes('404') || error.message?.includes('Not Found') || error.message?.includes('içerik bulunamadı')) {
        setHasData(false);
        messageApi.warning('SEO settings have not been created yet. Fill out the form to create new settings.');
      } else {
        messageApi.error(error.message || 'Failed to load general SEO settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLocaleSeoSettings = async (locale: string) => {
    setLoading(true);
    try {
      const data = await adminAPI.getLocaleSeoSettings(locale);
      const pages = data?.pages || [];
      setLocalePages(pages);
      
      // Set form values for currently selected page
      const currentPage = pages.find((p: PageSeo) => p.pageType === selectedPageType);
      if (currentPage) {
        pageForm.setFieldsValue(currentPage);
      } else {
        pageForm.resetFields();
      }
      setHasData(true);
    } catch (error: any) {
      console.error(`Failed to load SEO settings for ${locale}:`, error);
      if (error.message?.includes('404') || error.message?.includes('Not Found') || error.message?.includes('içerik bulunamadı')) {
        setHasData(false);
        setLocalePages([]);
        pageForm.resetFields();
        messageApi.info(`SEO settings for ${locale.toUpperCase()} have not been created yet.`);
      } else {
        messageApi.error(error.message || `Failed to load SEO settings for ${locale.toUpperCase()}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = async (values: any) => {
    setSaving(true);
    try {
      console.log('💾 Saving SEO settings:', values);
      
      // socialProfiles -> organizationSocialProfiles mapping
      const dataToSend = { ...values };
      if (values.socialProfiles) {
        dataToSend.organizationSocialProfiles = values.socialProfiles;
        delete dataToSend.socialProfiles; // Form field adını kaldır
      }
      
      console.log('📤 Data being sent to API:', dataToSend);
      await adminAPI.updateSeoSettings(dataToSend);
      setGeneralSettings(values);
      messageApi.success('General SEO settings saved successfully');
      setHasData(true);
      fetchGeneralSettings();
    } catch (error: any) {
      console.error('Failed to save general SEO settings:', error);
      messageApi.error(error.message || 'Failed to save general SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePageSeo = async (values: any) => {
    setSaving(true);
    try {
      // Find existing page or create new
      const existingPageIndex = localePages.findIndex(p => p.pageType === selectedPageType);
      let updatedPages: PageSeo[];
      
      if (existingPageIndex >= 0) {
        // Update existing page
        updatedPages = [...localePages];
        updatedPages[existingPageIndex] = { ...values, pageType: selectedPageType };
      } else {
        // Add new page
        updatedPages = [...localePages, { ...values, pageType: selectedPageType }];
      }

      await adminAPI.updateLocaleSeoSettings(selectedLocale, { pages: updatedPages });
      setLocalePages(updatedPages);
      messageApi.success(`${selectedLocale.toUpperCase()} - ${PAGE_TYPES.find(p => p.value === selectedPageType)?.label} SEO settings saved`);
      setHasData(true);
    } catch (error: any) {
      console.error('Failed to save page SEO settings:', error);
      messageApi.error(error.message || 'Failed to save page SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLocaleChange = (locale: string) => {
    setSelectedLocale(locale);
  };

  const handlePageTypeChange = (pageType: string) => {
    setSelectedPageType(pageType);
  };

  const pageColumns = [
    {
      title: 'Page',
      dataIndex: 'pageType',
      key: 'pageType',
      render: (pageType: string) => {
        const page = PAGE_TYPES.find(p => p.value === pageType);
        return (
          <Space>
            <Text strong>{page?.label || pageType}</Text>
            <Text type="secondary" code style={{ fontSize: 11 }}>{pageType}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: PageSeo) => {
        const hasContent = record.metaTitle || record.metaDescription;
        return (
          <Tag color={hasContent ? 'green' : 'default'}>
            {hasContent ? 'Configured' : 'Empty'}
          </Tag>
        );
      },
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'pages',
      label: <Space><SearchOutlined />Page SEO Settings</Space>,
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <GlobalOutlined />
                  <Text strong>Language Selection</Text>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Select
                value={selectedLocale}
                onChange={handleLocaleChange}
                style={{ width: '100%' }}
                size="large"
                options={locales.map(l => ({
                  label: <Space>{l.flag} {l.name}</Space>,
                  value: l.code,
                }))}
              />
            </Card>

            <Card title="Pages" size="small">
              <Table
                columns={pageColumns}
                dataSource={localePages || []}
                rowKey={(record) => record.pageType || `page-${Math.random()}`}
                size="small"
                pagination={false}
                onRow={(record) => ({
                  onClick: () => handlePageTypeChange(record.pageType),
                  style: {
                    cursor: 'pointer',
                    backgroundColor: selectedPageType === record.pageType ? '#e6f7ff' : 'transparent',
                  },
                })}
              />
              
              <Divider />
              
              <Text type="secondary" style={{ fontSize: 12 }}>
                Unconfigured page types:
              </Text>
              <Space orientation="vertical" style={{ width: '100%', marginTop: 8 }}>
                {PAGE_TYPES.filter(pt => !localePages.find(p => p.pageType === pt.value)).map(pt => (
                  <Button 
                    key={pt.value}
                    size="small" 
                    type="dashed" 
                    block
                    onClick={() => handlePageTypeChange(pt.value)}
                  >
                    + {pt.label}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <Text strong>
                    {PAGE_TYPES.find(p => p.value === selectedPageType)?.label || selectedPageType}
                  </Text>
                  <Tag>{selectedLocale.toUpperCase()}</Tag>
                </Space>
              }
              size="small"
            >
              <Form
                form={pageForm}
                layout="vertical"
                onFinish={handleSavePageSeo}
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
                  name="metaKeywords"
                  label="Meta Keywords"
                  extra="Comma separated keywords"
                >
                  <Input placeholder="keywords, separated, by, commas" />
                </Form.Item>

                <Form.Item
                  name="ogImage"
                  label="Open Graph Image"
                  extra="Image URL for social media sharing"
                >
                  <Input placeholder="/images/og/page.jpg" />
                </Form.Item>

                <Divider>Extended Open Graph</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="ogType"
                      label="OG Type"
                      extra="Type of content"
                    >
                      <Select placeholder="Select type" allowClear>
                        <Select.Option value="website">Website</Select.Option>
                        <Select.Option value="article">Article</Select.Option>
                        <Select.Option value="product">Product</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="ogLocale"
                      label="OG Locale"
                      extra="Content locale"
                    >
                      <Input placeholder="en_US" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="ogUrl"
                  label="OG URL"
                  extra="Canonical URL for this page"
                >
                  <Input placeholder="https://freestays.com/page" />
                </Form.Item>

                <Form.Item
                  name="ogSiteName"
                  label="OG Site Name"
                  extra="Name of your website"
                >
                  <Input placeholder="FreeStays" />
                </Form.Item>

                <Divider>Twitter Card</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="twitterCard"
                      label="Twitter Card Type"
                    >
                      <Select placeholder="Select card type" allowClear>
                        <Select.Option value="summary">Summary</Select.Option>
                        <Select.Option value="summary_large_image">Summary Large Image</Select.Option>
                        <Select.Option value="app">App</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="twitterSite"
                      label="Twitter Site"
                      extra="@username"
                    >
                      <Input placeholder="@freestays" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="twitterCreator"
                      label="Twitter Creator"
                      extra="@username"
                    >
                      <Input placeholder="@creator" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="twitterImage"
                      label="Twitter Image"
                    >
                      <Input placeholder="/images/twitter/card.jpg" />
                    </Form.Item>
                  </Col>
                </Row>

                {selectedPageType === 'hotel_detail' && (
                  <>
                    <Divider>Hotel Schema.org</Divider>
                    
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="hotelSchemaType"
                          label="Schema Type"
                        >
                          <Select placeholder="Select type" allowClear>
                            <Select.Option value="Hotel">Hotel</Select.Option>
                            <Select.Option value="Resort">Resort</Select.Option>
                            <Select.Option value="Motel">Motel</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="hotelName"
                          label="Hotel Name"
                        >
                          <Input placeholder="Grand Plaza Hotel" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="hotelTelephone"
                          label="Telephone"
                        >
                          <Input placeholder="+90-212-555-0000" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="hotelPriceRange"
                          label="Price Range"
                        >
                          <Input placeholder="$$$" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="hotelAddress"
                      label="Address (JSON)"
                      extra='Example: {"street":"123 Main St","city":"Istanbul","region":"Marmara","postalCode":"34000","country":"TR"}'
                    >
                      <TextArea rows={2} placeholder='{"street":"...","city":"..."}' />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name="hotelStarRating"
                          label="Star Rating"
                        >
                          <Input type="number" min={1} max={5} placeholder="5" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name={['hotelAggregateRating', 'ratingValue']}
                          label="Rating Value"
                        >
                          <Input type="number" step={0.1} min={0} max={5} placeholder="4.5" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          name={['hotelAggregateRating', 'reviewCount']}
                          label="Review Count"
                        >
                          <Input type="number" min={0} placeholder="248" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}

                <Divider>Custom Structured Data</Divider>

                <Form.Item
                  name="structuredDataJson"
                  label="JSON-LD Structured Data"
                  extra="Custom schema.org JSON-LD for this page"
                >
                  <TextArea 
                    rows={6} 
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                    placeholder='{"@context":"https://schema.org","@type":"WebPage",...}'
                  />
                </Form.Item>

                <Alert
                  title="Dynamic Variables"
                  description={
                    <Space wrap>
                      <Tag color="blue">{`{{destination}}`}</Tag>
                      <Tag color="blue">{`{{hotelName}}`}</Tag>
                      <Tag color="blue">{`{{city}}`}</Tag>
                      <Tag color="blue">{`{{starRating}}`}</Tag>
                      <Tag color="blue">{`{{count}}`}</Tag>
                      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                        These variables will be automatically filled based on page content.
                      </Text>
                    </Space>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
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
      key: 'general',
      label: <Space><RobotOutlined />General SEO Settings</Space>,
      children: (
        <Form
          form={generalForm}
          layout="vertical"
          onFinish={handleSaveGeneralSettings}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="General Settings" size="small">
                <Form.Item name="defaultMetaTitle" label="Default Meta Title">
                  <Input placeholder="Your site's default title" />
                </Form.Item>

                <Form.Item name="defaultMetaDescription" label="Default Meta Description">
                  <TextArea rows={3} placeholder="Your site's default description" />
                </Form.Item>
              </Card>

              <Card title="Organization Schema" size="small" style={{ marginTop: 16 }}>
                <Form.Item name="organizationName" label="Organization Name">
                  <Input placeholder="FreeStays" />
                </Form.Item>

                <Form.Item name="organizationUrl" label="Organization URL">
                  <Input placeholder="https://freestays.com" />
                </Form.Item>

                <Form.Item name="organizationLogo" label="Logo URL">
                  <Input placeholder="https://freestays.com/logo.png" />
                </Form.Item>

                <Form.Item name="organizationDescription" label="Description">
                  <TextArea rows={2} placeholder="Premium hotel booking platform" />
                </Form.Item>

                <Divider>Social Profiles</Divider>

                <Form.Item 
                  name="socialProfiles" 
                  label="Social Media URLs"
                  extra="Type to add custom URLs or select from social settings"
                >
                  <Select 
                    mode="tags" 
                    style={{ width: '100%' }}
                    placeholder="Enter or select social media URLs"
                    tokenSeparators={[',']}
                    options={socialLinks.map(link => ({ label: link, value: link }))}
                    notFoundContent={socialLinks.length === 0 ? 'No social links found in social settings' : null}
                  />
                </Form.Item>

                {socialLinks.length > 0 && (
                  <Button 
                    type="dashed" 
                    size="small" 
                    onClick={() => {
                      generalForm.setFieldValue('socialProfiles', [...socialLinks]);
                    }}
                    style={{ marginTop: -16, marginBottom: 16 }}
                  >
                    Import all from Social Settings ({socialLinks.length})
                  </Button>
                )}

                <Alert
                  description={
                    <div style={{ fontSize: 11 }}>
                      Examples:<br />
                      • https://facebook.com/freestays<br />
                      • https://twitter.com/freestays<br />
                      • https://instagram.com/freestays
                    </div>
                  }
                  type="info"
                  showIcon={false}
                  style={{ marginTop: -8 }}
                />
              </Card>

              <Card title="Contact Information" size="small" style={{ marginTop: 16 }}>
                <Form.Item name="contactPhone" label="Phone">
                  <Input placeholder="+1-234-567-8900" />
                </Form.Item>

                <Form.Item name="contactEmail" label="Email">
                  <Input placeholder="support@freestays.com" />
                </Form.Item>

                <Form.Item 
                  name="businessAddress" 
                  label="Business Address (JSON)"
                  extra='Example: {"street":"123 Main St","city":"New York","region":"NY","postalCode":"10001","country":"US"}'
                >
                  <TextArea rows={2} placeholder='{"street":"...","city":"..."}' />
                </Form.Item>
              </Card>

              <Card title="Robots.txt" size="small" style={{ marginTop: 16 }}>
                <Form.Item name="robotsTxt">
                  <TextArea 
                    rows={8} 
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                    placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://freestays.com/sitemap.xml`}
                  />
                </Form.Item>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Analytics & Tracking" size="small">
                <Form.Item name="googleAnalyticsId" label="Google Analytics ID">
                  <Input placeholder="G-XXXXXXXXXX" />
                </Form.Item>

                <Form.Item name="googleTagManagerId" label="Google Tag Manager ID">
                  <Input placeholder="GTM-XXXXXXX" />
                </Form.Item>

                <Form.Item name="facebookPixelId" label="Facebook Pixel ID">
                  <Input placeholder="XXXXXXXXXXXXXXX" />
                </Form.Item>
              </Card>

              <Card title="Sitemap" size="small" style={{ marginTop: 16 }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Form.Item name="sitemapEnabled" valuePropName="checked" style={{ marginBottom: 0 }}>
                      <Switch />
                    </Form.Item>
                    <Text>Automatically generate sitemap</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Sitemap URL: https://freestays.com/sitemap.xml
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
              Save General Settings
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  if (loading && !localePages.length && !generalSettings.defaultMetaTitle) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <SearchOutlined style={{ marginRight: 12 }} />
          SEO Settings
        </Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => {
            fetchGeneralSettings();
            fetchLocaleSeoSettings(selectedLocale);
          }}
        >
          Refresh
        </Button>
      </div>

      {!hasData && (
        <Alert
          title="SEO Settings Not Found"
          description="SEO settings have not been created yet. You can create new SEO settings by filling out the forms below."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Alert
        title="SEO Optimization"
        description="You can configure separate SEO settings for each page and language. Use variables for dynamic pages. Schema.org structured data is now supported!"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Tabs items={tabItems} destroyOnHidden={false} />
      </Card>
    </div>
  );
}
