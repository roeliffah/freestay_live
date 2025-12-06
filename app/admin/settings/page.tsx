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
  TimePicker,
  InputNumber,
  ColorPicker,
  Alert,
} from 'antd';
import type { TabsProps, UploadFile } from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  UploadOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface GeneralSettings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  defaultLocale: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

interface SocialSettings {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

interface BrandingSettings {
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
}

interface ContactSettings {
  supportEmail: string;
  salesEmail: string;
  supportPhone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string[];
}

// Mock data
const mockGeneralSettings: GeneralSettings = {
  siteName: 'FreeStays',
  tagline: 'En İyi Otel Fırsatları',
  email: 'info@freestays.com',
  phone: '+90 212 555 0000',
  address: 'İstanbul, Türkiye',
  timezone: 'Europe/Istanbul',
  currency: 'EUR',
  defaultLocale: 'tr',
  maintenanceMode: false,
  maintenanceMessage: 'Site bakım modundadır. Lütfen daha sonra tekrar deneyin.',
};

const mockSocialSettings: SocialSettings = {
  facebook: 'https://facebook.com/freestays',
  twitter: 'https://twitter.com/freestays',
  instagram: 'https://instagram.com/freestays',
  youtube: 'https://youtube.com/@freestays',
  linkedin: 'https://linkedin.com/company/freestays',
  tiktok: 'https://tiktok.com/@freestays',
};

const mockBrandingSettings: BrandingSettings = {
  logo: '/images/logo.png',
  favicon: '/favicon.ico',
  primaryColor: '#1890ff',
  secondaryColor: '#52c41a',
};

const mockContactSettings: ContactSettings = {
  supportEmail: 'support@freestays.com',
  salesEmail: 'sales@freestays.com',
  supportPhone: '+90 212 555 0001',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
};

export default function SettingsPage() {
  const [generalForm] = Form.useForm();
  const [socialForm] = Form.useForm();
  const [brandingForm] = Form.useForm();
  const [contactForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async (formName: string, values: any) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Saving ${formName}:`, values);
    message.success('Settings saved');
    setLoading(false);
  };

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
          initialValues={mockGeneralSettings}
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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
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
          initialValues={mockSocialSettings}
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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
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
          initialValues={mockBrandingSettings}
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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
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
          initialValues={{
            ...mockContactSettings,
            workingHoursStart: dayjs(mockContactSettings.workingHoursStart, 'HH:mm'),
            workingHoursEnd: dayjs(mockContactSettings.workingHoursEnd, 'HH:mm'),
          }}
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
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
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
