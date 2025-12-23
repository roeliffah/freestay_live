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
  Upload,
  Switch,
  Divider,
  Row,
  Col,
  Select,
  TimePicker,
  Alert,
  Spin,
  App,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  UploadOutlined,
  CrownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SiteSettings {
  siteName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  defaultLocale?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  // Social Media
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  // Branding
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Contact
  supportEmail?: string;
  salesEmail?: string;
  supportPhone?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string[];
}

export default function SettingsPage() {
  return (
    <App>
      <SettingsContent />
    </App>
  );
}

function SettingsContent() {
  const { message: messageApi } = App.useApp();
  const [generalForm] = Form.useForm();
  const [socialForm] = Form.useForm();
  const [brandingForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getSiteSettings();
      console.log('📥 Received settings from API:', data);
      setSettings(data);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      messageApi.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Update forms when settings change
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      console.log('🔄 Updating forms with settings:', settings);
      
      generalForm.setFieldsValue({
        siteName: settings.siteName,
        tagline: settings.tagline,
        email: settings.supportEmail || settings.email,
        phone: settings.supportPhone || settings.phone,
        address: settings.address,
        timezone: settings.timezone,
        currency: settings.defaultCurrency || settings.currency,
        defaultLocale: settings.defaultLocale,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      });

      socialForm.setFieldsValue({
        facebook: settings.socialLinks?.facebook || settings.facebook,
        twitter: settings.socialLinks?.twitter || settings.twitter,
        instagram: settings.socialLinks?.instagram || settings.instagram,
        youtube: settings.socialLinks?.youTube || settings.youtube,
        linkedin: settings.socialLinks?.linkedIn || settings.linkedin,
        tiktok: settings.tiktok,
      });

      brandingForm.setFieldsValue({
        logo: settings.logoUrl || settings.logo,
        favicon: settings.favicon,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
      });

      contactForm.setFieldsValue({
        supportEmail: settings.supportEmail,
        salesEmail: settings.salesEmail,
        supportPhone: settings.supportPhone,
        workingHoursStart: settings.workingHoursStart ? dayjs(settings.workingHoursStart, 'HH:mm') : undefined,
        workingHoursEnd: settings.workingHoursEnd ? dayjs(settings.workingHoursEnd, 'HH:mm') : undefined,
        workingDays: settings.workingDays,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleSave = async (formName: string, values: any) => {
    setSaving(true);
    try {
      console.log('💾 Saving settings for tab:', formName);
      console.log('📝 Form values:', values);
      console.log('📦 Current settings:', settings);

      // Prepare complete data structure preserving all existing settings
      const updateData: any = {
        siteName: settings.siteName,
        supportEmail: settings.supportEmail || settings.email,
        supportPhone: settings.supportPhone || settings.phone,
        defaultLocale: settings.defaultLocale,
        availableLocales: settings.availableLocales || (settings.defaultLocale ? [settings.defaultLocale] : undefined),
        defaultCurrency: settings.defaultCurrency || settings.currency,
        availableCurrencies: settings.availableCurrencies || (settings.currency ? [settings.currency] : undefined),
        maintenanceMode: settings.maintenanceMode || false,
        logoUrl: settings.logoUrl || settings.logo,
        socialLinks: {
          facebook: settings.facebook || (settings.socialLinks?.facebook),
          twitter: settings.twitter || (settings.socialLinks?.twitter),
          instagram: settings.instagram || (settings.socialLinks?.instagram),
          linkedIn: settings.linkedin || (settings.socialLinks?.linkedIn),
          youTube: settings.youtube || (settings.socialLinks?.youTube),
        },
      };

      // Update with new values from the current tab
      if (formName === 'general') {
        updateData.siteName = values.siteName;
        updateData.supportEmail = values.email;
        updateData.supportPhone = values.phone;
        updateData.defaultLocale = values.defaultLocale;
        updateData.availableLocales = values.defaultLocale ? [values.defaultLocale] : undefined;
        updateData.defaultCurrency = values.currency;
        updateData.availableCurrencies = values.currency ? [values.currency] : undefined;
        updateData.maintenanceMode = values.maintenanceMode;
      } else if (formName === 'social') {
        updateData.socialLinks = {
          facebook: values.facebook || '',
          twitter: values.twitter || '',
          instagram: values.instagram || '',
          linkedIn: values.linkedin || '',
          youTube: values.youtube || '',
        };
      } else if (formName === 'branding') {
        if (values.logo) {
          updateData.logoUrl = values.logo;
        }
      } else if (formName === 'contact') {
        updateData.supportEmail = values.supportEmail;
        updateData.supportPhone = values.supportPhone;
      }

      console.log('📤 Sending to API:', JSON.stringify(updateData, null, 2));

      await adminAPI.updateSiteSettings(updateData);
      messageApi.success('Settings saved successfully');
      await fetchSettings(); // Reload to get updated values
    } catch (error: any) {
      console.error('❌ Failed to save settings:', error);
      messageApi.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const timezones = [
    { value: 'Europe/Istanbul', label: 'Istanbul (UTC+3)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  ];

  const currencies = [
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'TRY', label: '₺ Türk Lirası (TRY)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
  ];

  const locales = [
    { value: 'tr', label: '🇹🇷 Türkçe' },
    { value: 'en', label: '🇬🇧 English' },
    { value: 'de', label: '🇩🇪 Deutsch' },
    { value: 'nl', label: '🇳🇱 Nederlands' },
  ];

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'general',
      label: <Space><SettingOutlined />General</Space>,
      children: (
        <Form
          form={generalForm}
          layout="vertical"
          onFinish={(values) => handleSave('general', values)}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="siteName"
                label="Site Name"
                rules={[{ required: true, message: 'Site name is required' }]}
              >
                <Input prefix={<CrownOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tagline" label="Tagline">
                <Input placeholder="Site tagline" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="timezone" label="Timezone">
                <Select options={timezones} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Default Currency">
                <Select options={currencies} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="defaultLocale" label="Default Language">
                <Select options={locales} />
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Contact Information</Text></Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={2} />
          </Form.Item>

          <Divider><Text strong>Maintenance Mode</Text></Divider>

          <Form.Item name="maintenanceMode" label="Maintenance Mode" valuePropName="checked">
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>

          <Form.Item name="maintenanceMessage" label="Maintenance Message">
            <TextArea rows={2} placeholder="Message to display during maintenance" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'social',
      label: <Space><GlobalOutlined />Social Media</Space>,
      children: (
        <Form
          form={socialForm}
          layout="vertical"
          onFinish={(values) => handleSave('social', values)}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="facebook" label="Facebook">
                <Input prefix={<FacebookOutlined style={{ color: '#1877F2' }} />} placeholder="https://facebook.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="twitter" label="Twitter / X">
                <Input prefix={<TwitterOutlined style={{ color: '#1DA1F2' }} />} placeholder="https://twitter.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="instagram" label="Instagram">
                <Input prefix={<InstagramOutlined style={{ color: '#E4405F' }} />} placeholder="https://instagram.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="youtube" label="YouTube">
                <Input prefix={<YoutubeOutlined style={{ color: '#FF0000' }} />} placeholder="https://youtube.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="linkedin" label="LinkedIn">
                <Input prefix={<LinkedinOutlined style={{ color: '#0A66C2' }} />} placeholder="https://linkedin.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tiktok" label="TikTok">
                <Input prefix={<span style={{ marginRight: 8 }}>🎵</span>} placeholder="https://tiktok.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'branding',
      label: <Space><CrownOutlined />Branding</Space>,
      children: (
        <Form
          form={brandingForm}
          layout="vertical"
          onFinish={(values) => handleSave('branding', values)}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Logo">
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
                <Text type="secondary">Recommended size: 200x50px</Text>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Favicon">
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
                <Text type="secondary">Recommended size: 32x32px</Text>
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Colors</Text></Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="primaryColor" label="Primary Color">
                <Input type="color" style={{ width: 100, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secondaryColor" label="Secondary Color">
                <Input type="color" style={{ width: 100, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'contact',
      label: <Space><PhoneOutlined />Contact</Space>,
      children: (
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={(values) => handleSave('contact', values)}
        >
          <Divider><Text strong>Email Addresses</Text></Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="supportEmail" label="Support Email">
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salesEmail" label="Sales Email">
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="supportPhone" label="Support Phone">
            <Input prefix={<PhoneOutlined />} style={{ maxWidth: 300 }} />
          </Form.Item>

          <Divider><Text strong>Working Hours</Text></Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="workingHoursStart" label="Start">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workingHoursEnd" label="End">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="workingDays" label="Working Days">
            <Select mode="multiple" options={weekDays} placeholder="Select working days" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save
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
          <SettingOutlined style={{ marginRight: 12 }} />
          Site Settings
        </Title>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}
