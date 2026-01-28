'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
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
  Alert,
  Spin,
  App,
  Collapse,
  Badge,
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
  TranslationOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';
import { SUPPORTED_LOCALES, SUPPORTED_CURRENCIES, SUPPORTED_TIMEZONES } from '@/lib/constants/locales';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface LocalizedText {
  [locale: string]: string;
}

interface SiteSettings {
  siteName?: string | LocalizedText;
  siteTagline?: string | LocalizedText;  // Localized tagline in General tab
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
  pinterest?: string;
  // Branding
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  footerText?: string;
  // Contact (all contact info in Contact tab)
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  workingHours?: string;  // Free text format (e.g., "Mon-Fri: 9:00-18:00")
  mapLatitude?: string;
  mapLongitude?: string;
  googleMapsIframe?: string;
  // Email Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEnableSsl?: boolean;
  smtpFromEmail?: string;
  smtpFromName?: string;
  emailProvider?: string;
  // Pricing
  profitMargin?: number;
  extraFee?: number;
  defaultVatRate?: number;
  discountRate?: number;
  // Coupon Pricing
  oneTimeCouponPrice?: number;
  annualCouponPrice?: number;
  // Affiliate Programs
  excursionsActive?: boolean;
  excursionsAffiliateCode?: string;
  excursionsWidgetCode?: string;
  carRentalActive?: boolean;
  carRentalAffiliateCode?: string;
  carRentalWidgetCode?: string;
  flightBookingActive?: boolean;
  flightBookingAffiliateCode?: string;
  flightBookingWidgetCode?: string;
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
  const [emailForm] = Form.useForm();
  const [affiliateForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings>({});
  const [pages, setPages] = useState<any[]>([]);
  const [logoFileList, setLogoFileList] = useState<any[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formsInitialized, setFormsInitialized] = useState<Record<string, boolean>>({
    general: false,
    social: false,
    branding: false,
    contact: false,
    email: false,
    affiliate: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Tüm ayar gruplarını paralel olarak çek
      const [siteData, socialData, brandingData, contactData, emailData, pagesData] = await Promise.all([
        adminAPI.getSiteSettings().catch(() => ({} as any)),
        adminAPI.getSocialSettings().catch(() => ({} as any)),
        adminAPI.getBrandingSettings().catch(() => ({} as any)),
        adminAPI.getContactSettings().catch(() => ({} as any)),
        adminAPI.getEmailSettings().catch(() => ({} as any)),
        adminAPI.getPages().catch((err) => {
          console.error('Failed to load pages:', err);
          return [];
        }),
      ]);

      // Tüm verileri birleştir
      const combinedSettings = {
        ...(siteData || {}),
        ...(socialData || {}),
        ...(brandingData || {}),
        ...(contactData || {}),
        ...(emailData || {}),
      };

      console.log('📥 Received settings from API:', combinedSettings);
      console.log('📄 Received pages:', pagesData);
      console.log('📄 Pages is array?', Array.isArray(pagesData));
      console.log('📄 Pages.items:', (pagesData as any)?.items);
      setSettings(combinedSettings as any);
      const pagesList = Array.isArray(pagesData) ? pagesData : (pagesData as any)?.items || [];
      console.log('📄 Final pages list:', pagesList);
      setPages(pagesList);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      messageApi.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Update forms when settings change
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0 && pages.length >= 0) {
      console.log('🔄 Updating forms with settings:', settings);
      
      // SiteName ve tagline çoklu dil desteği
      const siteNameValues: any = {};
      const taglineValues: any = {};
      
      if (typeof settings.siteName === 'object' && settings.siteName !== null) {
        Object.assign(siteNameValues, settings.siteName);
      } else if (typeof settings.siteName === 'string') {
        siteNameValues.tr = settings.siteName;
      }
      
      const settingsTagline = (settings as any).siteTagline || (settings as any).tagline;
      if (typeof settingsTagline === 'object' && settingsTagline !== null) {
        Object.assign(taglineValues, settingsTagline);
      } else if (typeof settingsTagline === 'string') {
        taglineValues.tr = settingsTagline;
      }

      const logoUrl = (settings as any).logoUrl || (settings as any).logo;
      const faviconUrl = (settings as any).favicon;

      // Sadece aktif tab'ın formunu güncelle
      if (activeTab === 'general' || formsInitialized.general) {
        generalForm.setFieldsValue({
          siteName: siteNameValues,
          tagline: taglineValues,
          timezone: settings.timezone,
          currency: (settings as any).defaultCurrency || (settings as any).currency,
          defaultLocale: settings.defaultLocale,
          profitMargin: (settings as any).profitMargin,
          extraFee: (settings as any).extraFee,
          defaultVatRate: (settings as any).defaultVatRate,
          discountRate: (settings as any).discountRate,
          oneTimeCouponPrice: (settings as any).oneTimeCouponPrice,
          annualCouponPrice: (settings as any).annualCouponPrice,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
        });
        setFormsInitialized(prev => ({ ...prev, general: true }));
      }

      if (activeTab === 'social' || formsInitialized.social) {
        socialForm.setFieldsValue({
          facebook: (settings as any).socialLinks?.facebook || (settings as any).facebook,
          twitter: (settings as any).socialLinks?.twitter || (settings as any).twitter,
          instagram: (settings as any).socialLinks?.instagram || (settings as any).instagram,
          youtube: (settings as any).socialLinks?.youTube || (settings as any).youtube,
          linkedin: (settings as any).socialLinks?.linkedIn || (settings as any).linkedin,
          tiktok: (settings as any).tiktok,
          pinterest: (settings as any).pinterest,
        });
        setFormsInitialized(prev => ({ ...prev, social: true }));
      }

      if (activeTab === 'branding' || formsInitialized.branding) {
        brandingForm.setFieldsValue({
          logo: logoUrl,
          favicon: faviconUrl,
          primaryColor: (settings as any).primaryColor,
          secondaryColor: (settings as any).secondaryColor,
          accentColor: (settings as any).accentColor,
          footerText: (settings as any).footerText,
        });
        setFormsInitialized(prev => ({ ...prev, branding: true }));
      }

      if (activeTab === 'contact' || formsInitialized.contact) {
        contactForm.setFieldsValue({
          email: (settings as any).email || (settings as any).supportEmail,
          phone: (settings as any).phone || (settings as any).supportPhone,
          whatsapp: (settings as any).whatsapp,
          address: (settings as any).address,
          city: (settings as any).city,
          country: (settings as any).country,
          postalCode: (settings as any).postalCode,
          workingHours: (settings as any).workingHours,
          mapLatitude: (settings as any).mapLatitude,
          mapLongitude: (settings as any).mapLongitude,
          googleMapsIframe: (settings as any).googleMapsIframe,
          privacyPolicyPageSlug: (settings as any).privacyPolicy,
          termsOfServicePageSlug: (settings as any).termsOfService,
          cancellationPolicyPageSlug: (settings as any).cancellationPolicy,
        });
        setFormsInitialized(prev => ({ ...prev, contact: true }));
      }

      if (activeTab === 'email' || formsInitialized.email) {
        // Email settings'leri ayrı bir endpoint'ten almak gerekebilir
        emailForm.setFieldsValue({
          smtpHost: (settings as any).smtpHost,
          smtpPort: (settings as any).smtpPort,
          smtpUsername: (settings as any).smtpUsername,
          smtpEnableSsl: (settings as any).useSsl ?? (settings as any).smtpEnableSsl ?? true,
          smtpFromEmail: (settings as any).smtpFromEmail,
          smtpFromName: (settings as any).smtpFromName,
          emailProvider: (settings as any).emailProvider || 'smtp',
        });
        setFormsInitialized(prev => ({ ...prev, email: true }));
      }

      if (activeTab === 'affiliate' || formsInitialized.affiliate) {
        affiliateForm.setFieldsValue({
          excursionsActive: (settings as any).excursionsActive,
          excursionsAffiliateCode: (settings as any).excursionsAffiliateCode,
          excursionsWidgetCode: (settings as any).excursionsWidgetCode,
          carRentalActive: (settings as any).carRentalActive,
          carRentalAffiliateCode: (settings as any).carRentalAffiliateCode,
          carRentalWidgetCode: (settings as any).carRentalWidgetCode,
          flightBookingActive: (settings as any).flightBookingActive,
          flightBookingAffiliateCode: (settings as any).flightBookingAffiliateCode,
          flightBookingWidgetCode: (settings as any).flightBookingWidgetCode,
        });
        setFormsInitialized(prev => ({ ...prev, affiliate: true }));
      }
      
      // Update file lists for preview
      if (logoUrl) {
        setLogoFileList([{
          uid: '-1',
          name: 'logo',
          status: 'done',
          url: logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${logoUrl}`,
        }]);
      } else {
        setLogoFileList([]);
      }
      
      if (faviconUrl) {
        setFaviconFileList([{
          uid: '-1',
          name: 'favicon',
          status: 'done',
          url: faviconUrl.startsWith('http') ? faviconUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${faviconUrl}`,
        }]);
      } else {
        setFaviconFileList([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, activeTab, pages]);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await adminAPI.uploadImage(file, 'logos');
      messageApi.success('Logo uploaded successfully');
      brandingForm.setFieldValue('logo', response.url);
      setLogoFileList([{
        uid: file.name,
        name: file.name,
        status: 'done',
        url: response.url.startsWith('http') ? response.url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${response.url}`,
      }]);
      return false; // Prevent default upload
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to upload logo');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await adminAPI.uploadImage(file, 'logos');
      messageApi.success('Favicon uploaded successfully');
      brandingForm.setFieldValue('favicon', response.url);
      setFaviconFileList([{
        uid: file.name,
        name: file.name,
        status: 'done',
        url: response.url.startsWith('http') ? response.url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${response.url}`,
      }]);
      return false; // Prevent default upload
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to upload favicon');
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await emailForm.validateFields();
      const values = emailForm.getFieldsValue();
      
      if (!values.smtpFromEmail) {
        messageApi.error('Please enter From Email first');
        return;
      }

      setTestingEmail(true);
      await adminAPI.testEmail({ toEmail: values.smtpFromEmail });
      messageApi.success('Test email sent successfully! Check your inbox.');
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSave = async (formName: string, values: any) => {
    setSaving(true);
    try {
      console.log('💾 Saving settings for tab:', formName);
      console.log('📝 Form values:', values);

      // Her tab için kendi endpoint'ine gönder
      if (formName === 'general') {
        // siteName: Çoklu dil formundan default dil değerini al
        const siteNameObj = values.siteName || {};
        const siteName = siteNameObj.tr || siteNameObj.en || Object.values(siteNameObj).find(v => v) || '';
        
        // tagline: Çoklu dil formundan default dil değerini al
        const taglineObj = values.tagline || {};
        const tagline = taglineObj.tr || taglineObj.en || Object.values(taglineObj).find(v => v) || '';
        
        const updateData: any = {
          siteName,
          tagline: tagline || undefined,  // Boşsa undefined gönder
          defaultLocale: values.defaultLocale || undefined,
          defaultCurrency: values.currency || undefined,
          timezone: values.timezone || undefined,
          profitMargin: values.profitMargin !== undefined && values.profitMargin !== '' ? parseFloat(values.profitMargin) : undefined,
          extraFee: values.extraFee !== undefined && values.extraFee !== '' ? parseFloat(values.extraFee) : undefined,
          defaultVatRate: values.defaultVatRate !== undefined && values.defaultVatRate !== '' ? parseFloat(values.defaultVatRate) : undefined,
          discountRate: values.discountRate !== undefined && values.discountRate !== '' ? parseFloat(values.discountRate) : undefined,
          oneTimeCouponPrice: values.oneTimeCouponPrice !== undefined && values.oneTimeCouponPrice !== '' ? parseFloat(values.oneTimeCouponPrice) : undefined,
          annualCouponPrice: values.annualCouponPrice !== undefined && values.annualCouponPrice !== '' ? parseFloat(values.annualCouponPrice) : undefined,
          maintenanceMode: values.maintenanceMode || false,
          maintenanceMessage: values.maintenanceMessage || undefined,
        };
        
        console.log('📤 Sending to /admin/settings/site:', updateData);
        console.log('📝 Raw form values:', values);
        await adminAPI.updateSiteSettings(updateData);
      } 
      else if (formName === 'social') {
        const updateData = {
          facebook: values.facebook || '',
          twitter: values.twitter || '',
          instagram: values.instagram || '',
          youtube: values.youtube || '',
          linkedin: values.linkedin || '',
          tiktok: values.tiktok || '',
          pinterest: values.pinterest || '',
        };
        
        console.log('📤 Sending to /admin/settings/social:', updateData);
        await adminAPI.updateSocialSettings(updateData);
      } 
      else if (formName === 'branding') {
        const updateData = {
          logoUrl: values.logo || '',
          faviconUrl: values.favicon || '',
          primaryColor: values.primaryColor || '',
          secondaryColor: values.secondaryColor || '',
          accentColor: values.accentColor || '',
          footerText: values.footerText || '',
        };
        
        console.log('📤 Sending to /admin/settings/branding:', updateData);
        await adminAPI.updateBrandingSettings(updateData);
      } 
      else if (formName === 'contact') {
        const updateData = {
          email: values.email || '',
          phone: values.phone || '',
          whatsapp: values.whatsapp || '',
          address: values.address || '',
          city: values.city || '',
          country: values.country || '',
          postalCode: values.postalCode || '',
          workingHours: values.workingHours || '',
          mapLatitude: values.mapLatitude || '',
          mapLongitude: values.mapLongitude || '',
          googleMapsIframe: values.googleMapsIframe || '',
          privacyPolicy: values.privacyPolicyPageSlug || '',
          termsOfService: values.termsOfServicePageSlug || '',
          cancellationPolicy: values.cancellationPolicyPageSlug || '',
        };
        
        console.log('📤 Sending to /admin/settings/contact:', updateData);
        await adminAPI.updateContactSettings(updateData);
      }
      else if (formName === 'email') {
        const updateData = {
          smtpHost: values.smtpHost,
          smtpPort: values.smtpPort ? parseInt(values.smtpPort, 10) : 587,
          smtpUsername: values.smtpUsername,
          smtpPassword: values.smtpPassword,
          smtpFromEmail: values.smtpFromEmail,
          smtpFromName: values.smtpFromName,
          useSsl: values.smtpEnableSsl ?? true,
          isActive: true,
        };
        
        console.log('📤 Sending to /admin/settings/email:', updateData);
        await adminAPI.updateEmailSettings(updateData);
      }
      else if (formName === 'affiliate') {
        const updateData = {
          excursionsActive: values.excursionsActive || false,
          excursionsAffiliateCode: values.excursionsAffiliateCode || '',
          excursionsWidgetCode: values.excursionsWidgetCode || '',
          carRentalActive: values.carRentalActive || false,
          carRentalAffiliateCode: values.carRentalAffiliateCode || '',
          carRentalWidgetCode: values.carRentalWidgetCode || '',
          flightBookingActive: values.flightBookingActive || false,
          flightBookingAffiliateCode: values.flightBookingAffiliateCode || '',
          flightBookingWidgetCode: values.flightBookingWidgetCode || '',
        };
        
        console.log('📤 Sending affiliate settings to /admin/settings/site:', updateData);
        await adminAPI.updateSiteSettings(updateData);
      }

      messageApi.success(`${formName.charAt(0).toUpperCase() + formName.slice(1)} settings saved successfully`);
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

  // Locales array SUPPORTED_LOCALES'ten türetiliyor
  const locales = SUPPORTED_LOCALES.map(locale => ({
    value: locale.code,
    label: `${locale.flag} ${locale.name}`,
  }));

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
          <Divider><Space><TranslationOutlined />Localized Content</Space></Divider>
          
          <Collapse
            items={SUPPORTED_LOCALES.map(locale => ({
              key: locale.code,
              label: (
                <Space>
                  <span>{locale.flag}</span>
                  <Text strong>{locale.name}</Text>
                </Space>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name={['siteName', locale.code]}
                      label={`Site Name (${locale.name})`}
                      rules={locale.code === 'tr' ? [
                        { required: true, message: 'Site name is required for Turkish (default language)' },
                        { min: 2, message: 'Site name must be at least 2 characters' },
                      ] : []}
                    >
                      <Input prefix={<CrownOutlined />} placeholder={`Enter site name in ${locale.name}`} maxLength={100} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name={['tagline', locale.code]} 
                      label={`Tagline (${locale.name})`}
                    >
                      <Input placeholder={`Enter tagline in ${locale.name}`} />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            }))}
            defaultActiveKey={['tr']}
          />

          <Divider><Text strong>General Settings</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="timezone" label="Timezone">
                <Select options={SUPPORTED_TIMEZONES} showSearch placeholder="Select timezone" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="currency" label="Default Currency">
                <Select options={SUPPORTED_CURRENCIES} placeholder="Select currency" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="defaultLocale" label="Default Language">
                <Select options={locales} placeholder="Select language" />
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Pricing & Tax Settings</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="profitMargin" 
                label="Profit Margin (%)"
                tooltip="Percentage markup on hotel base prices"
                rules={[
                  { type: 'number', min: 0, max: 100, message: 'Profit margin must be between 0 and 100' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  max={100}
                  suffix="%"
                  placeholder="e.g., 15.50" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="extraFee" 
                label="Standard Service Fee (€)"
                tooltip="Fixed service fee added to each booking"
                rules={[
                  { type: 'number', min: 0, message: 'Service fee must be 0 or greater' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  prefix="€"
                  placeholder="e.g., 25.00" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="defaultVatRate" 
                label="Default VAT Rate (%)"
                tooltip="Default tax rate applied to bookings"
                rules={[
                  { type: 'number', min: 0, max: 100, message: 'VAT rate must be between 0 and 100' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  max={100}
                  suffix="%"
                  placeholder="e.g., 20.00" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="discountRate" 
                label="Coupon Discount Rate (%)"
                tooltip="Discount percentage applied when a coupon is used"
                rules={[
                  { type: 'number', min: 0, max: 100, message: 'Discount rate must be between 0 and 100' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  max={100}
                  suffix="%"
                  placeholder="e.g., 10.00" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Coupon Pricing</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="oneTimeCouponPrice" 
                label="One-Time Coupon Price (€)"
                tooltip="Price for purchasing a one-time use coupon"
                rules={[
                  { type: 'number', min: 0, message: 'Price must be 0 or greater' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  prefix="€"
                  placeholder="e.g., 9.99" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="annualCouponPrice" 
                label="Annual Gold Coupon Price (€)"
                tooltip="Price for purchasing an annual gold membership coupon"
                rules={[
                  { type: 'number', min: 0, message: 'Price must be 0 or greater' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  step={0.01}
                  min={0}
                  prefix="€"
                  placeholder="e.g., 99.99" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            title="Pricing Information"
            description="Profit margin is added to hotel base prices. Service fee is a fixed amount added to each booking. VAT/Tax is calculated on the final price including profit margin and service fee. Coupon prices are standalone pricing for one-time and annual coupon purchases."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

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
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="facebook" label="Facebook">
                <Input prefix={<FacebookOutlined style={{ color: '#1877F2' }} />} placeholder="https://facebook.com/..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="twitter" label="Twitter / X">
                <Input prefix={<TwitterOutlined style={{ color: '#1DA1F2' }} />} placeholder="https://twitter.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="instagram" label="Instagram">
                <Input prefix={<InstagramOutlined style={{ color: '#E4405F' }} />} placeholder="https://instagram.com/..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="youtube" label="YouTube">
                <Input prefix={<YoutubeOutlined style={{ color: '#FF0000' }} />} placeholder="https://youtube.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="linkedin" label="LinkedIn">
                <Input prefix={<LinkedinOutlined style={{ color: '#0A66C2' }} />} placeholder="https://linkedin.com/..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="tiktok" label="TikTok">
                <Input prefix={<span style={{ marginRight: 8 }}>🎵</span>} placeholder="https://tiktok.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="pinterest" label="Pinterest">
            <Input prefix={<span style={{ marginRight: 8 }}>📍</span>} placeholder="https://pinterest.com/..." />
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
      key: 'branding',
      label: <Space><CrownOutlined />Branding</Space>,
      children: (
        <Form
          form={brandingForm}
          layout="vertical"
          onFinish={(values) => handleSave('branding', values)}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="logo" label="Logo" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="Logo">
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  maxCount={1}
                  beforeUpload={handleLogoUpload}
                  onRemove={() => {
                    setLogoFileList([]);
                    brandingForm.setFieldValue('logo', undefined);
                  }}
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                >
                  {logoFileList.length === 0 && (
                    <Button icon={<UploadOutlined />} loading={uploading}>Upload Logo</Button>
                  )}
                </Upload>
                <Text type="secondary">Recommended size: 200x50px (Max: 5MB)</Text>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="favicon" label="Favicon" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="Favicon">
                <Upload
                  listType="picture-card"
                  fileList={faviconFileList}
                  maxCount={1}
                  beforeUpload={handleFaviconUpload}
                  onRemove={() => {
                    setFaviconFileList([]);
                    brandingForm.setFieldValue('favicon', undefined);
                  }}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.ico"
                >
                  {faviconFileList.length === 0 && (
                    <Button icon={<UploadOutlined />} loading={uploading}>Upload Favicon</Button>
                  )}
                </Upload>
                <Text type="secondary">Recommended size: 32x32px (Max: 5MB)</Text>
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Colors</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="primaryColor" label="Primary Color">
                <Input type="color" style={{ width: 100, height: 40 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="secondaryColor" label="Secondary Color">
                <Input type="color" style={{ width: 100, height: 40 }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="accentColor" label="Accent Color">
                <Input type="color" style={{ width: 100, height: 40 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="footerText" label="Footer Text">
            <TextArea rows={2} placeholder="Copyright text or additional information" />
          </Form.Item>

          <Alert
            title="Note: Site Name and Tagline"
            description="Site name and tagline are configured in the General tab with multi-language support."
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
      ),
    },
    {
      key: 'email',
      label: (
        <Space>
          <MailOutlined />
          Email
          <Badge count="SMTP" style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      children: (
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={(values) => handleSave('email', values)}
        >
          <Alert
            title="SMTP Configuration"
            description="Configure your SMTP server to send emails. Password will be encrypted before storage."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Divider><Text strong>SMTP Server Settings</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="smtpHost"
                label="SMTP Host"
                rules={[{ required: true, message: 'SMTP host is required' }]}
              >
                <Input placeholder="smtp.gmail.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="smtpPort"
                label="SMTP Port"
                rules={[{ required: true, message: 'SMTP port is required' }]}
              >
                <Input type="number" placeholder="587" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="smtpUsername"
                label="SMTP Username"
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input placeholder="noreply@freestays.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="smtpPassword"
                label="SMTP Password"
                rules={[{ required: true, message: 'Password is required' }]}
                extra="Password will be encrypted with AES-256"
              >
                <Input.Password placeholder="Enter SMTP password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="smtpEnableSsl" label="Enable SSL/TLS" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <Divider><Text strong>Email Sender Information</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="smtpFromEmail"
                label="From Email"
                rules={[
                  { required: true, message: 'From email is required' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="noreply@freestays.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="smtpFromName"
                label="From Name"
                rules={[{ required: true, message: 'From name is required' }]}
              >
                <Input placeholder="FreeStays" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="emailProvider" label="Email Provider">
            <Select
              options={[
                { value: 'smtp', label: 'SMTP' },
                { value: 'sendgrid', label: 'SendGrid', disabled: true },
                { value: 'mailgun', label: 'Mailgun', disabled: true },
              ]}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                Save Email Settings
              </Button>
              <Button
                icon={<MailOutlined />}
                onClick={handleTestEmail}
                loading={testingEmail}
              >
                Test Email
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'affiliate',
      label: <Space><GlobalOutlined />Affiliate Programs</Space>,
      children: (
        <Form
          form={affiliateForm}
          layout="vertical"
          onFinish={(values) => handleSave('affiliate', values)}
        >
          <Alert
            title="Affiliate Programs"
            description="Configure affiliate links for travel services. When active, these links will appear in the header dropdown menu and travel CTA cards."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Divider><Text strong>Tours & Activities (Excursions)</Text></Divider>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Form.Item 
                name="excursionsActive" 
                label="Active" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={18}>
              <Form.Item 
                name="excursionsAffiliateCode" 
                label="Affiliate Link"
                tooltip="Full URL to your affiliate partner (e.g., https://getyourguide.com/?partner_id=XXX)"
              >
                <Input placeholder="https://getyourguide.com/?partner_id=XXX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="excursionsWidgetCode" 
            label="Widget Code (Optional)"
            tooltip="Paste your affiliate widget embed code (HTML + Script)"
          >
            <TextArea 
              rows={6} 
              placeholder='<div data-vi-partner-id="U00202819" data-vi-widget-ref="W-46e0b4fc-2d24-4a08-8178-2464b72e88a1"></div>&#10;<script async src="https://www.viator.com/orion/partner/widget.js"></script>'
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>

          <Divider><Text strong>Car Rental</Text></Divider>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Form.Item 
                name="carRentalActive" 
                label="Active" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={18}>
              <Form.Item 
                name="carRentalAffiliateCode" 
                label="Affiliate Link"
                tooltip="Full URL to your affiliate partner (e.g., https://rentalcars.com/?affiliateCode=XXX)"
              >
                <Input placeholder="https://rentalcars.com/?affiliateCode=XXX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="carRentalWidgetCode" 
            label="Widget Code (Optional)"
            tooltip="Paste your car rental widget embed code (HTML + Script)"
          >
            <TextArea 
              rows={6} 
              placeholder='<div id="car-rental-widget"></div>&#10;<script src="https://widget.rentalcars.com/widget.js"></script>'
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>

          <Divider><Text strong>Flight Booking</Text></Divider>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Form.Item 
                name="flightBookingActive" 
                label="Active" 
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={18}>
              <Form.Item 
                name="flightBookingAffiliateCode" 
                label="Affiliate Link"
                tooltip="Full URL to your affiliate partner (e.g., https://skyscanner.com/?associateid=XXX)"
              >
                <Input placeholder="https://skyscanner.com/?associateid=XXX" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="flightBookingWidgetCode" 
            label="Widget Code (Optional)"
            tooltip="Paste your flight booking widget embed code (HTML + Script)"
          >
            <TextArea 
              rows={6} 
              placeholder='<div id="flight-widget"></div>&#10;<script src="https://widget.skyscanner.com/widget.js"></script>'
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              Save Affiliate Settings
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
          <Divider><Text strong>Contact Information</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email">
                <Input prefix={<MailOutlined />} placeholder="info@freestays.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone">
                <Input prefix={<PhoneOutlined />} placeholder="+90 555 123 4567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="whatsapp" label="WhatsApp Number">
            <Input prefix={<PhoneOutlined />} placeholder="+90 555 123 4567" />
          </Form.Item>

          <Divider><Text strong>Address Information</Text></Divider>

          <Form.Item name="address" label="Street Address">
            <TextArea rows={2} placeholder="Atatürk Caddesi No:123" />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="city" label="City">
                <Input placeholder="İstanbul" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="country" label="Country">
                <Input placeholder="Turkey" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item name="postalCode" label="Postal Code">
                <Input placeholder="34000" />
              </Form.Item>
            </Col>
          </Row>

          <Divider><Text strong>Working Hours</Text></Divider>

          <Form.Item 
            name="workingHours" 
            label="Working Hours"
            extra="Enter working hours as free text (e.g., Mon-Fri: 9:00-18:00, Sat: 10:00-14:00)"
          >
            <Input placeholder="Mon-Fri: 9:00-18:00, Sat: 10:00-14:00" />
          </Form.Item>

          <Divider><Text strong>Google Maps Integration</Text></Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="mapLatitude" label="Map Latitude">
                <Input placeholder="41.0082" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="mapLongitude" label="Map Longitude">
                <Input placeholder="28.9784" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="googleMapsIframe" label="Google Maps Embed Code">
            <TextArea 
              rows={4} 
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>' 
            />
          </Form.Item>

          <Divider><Text strong>Policy & Pages Links</Text></Divider>

          <Alert
            title="Available Pages"
            description={`Total pages available: ${pages.length}. Pages found: ${pages.map((p: any) => p.title || p.slug).join(', ') || 'None'}`}
            type={pages.length > 0 ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="privacyPolicyPageSlug" 
                label="Privacy Policy Page"
                tooltip="Select the page to be used as Privacy Policy"
              >
                <Select 
                  placeholder="Select privacy policy page"
                  allowClear
                  optionLabelProp="label"
                >
                  {pages && pages.length > 0 ? (
                    pages.map((page: any) => {
                      const label = page.translations?.[0]?.title || page.title || page.slug || `Page ${page.slug}`;
                      return (
                        <Option key={page.slug} value={page.slug}>
                          {label}
                        </Option>
                      );
                    })
                  ) : (
                    <Option disabled value="">No pages available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="termsOfServicePageSlug" 
                label="Terms of Service Page"
                tooltip="Select the page to be used as Terms of Service"
              >
                <Select 
                  placeholder="Select terms of service page"
                  allowClear
                  optionLabelProp="label"
                >
                  {pages && pages.length > 0 ? (
                    pages.map((page: any) => {
                      const label = page.translations?.[0]?.title || page.title || page.slug || `Page ${page.slug}`;
                      return (
                        <Option key={page.slug} value={page.slug}>
                          {label}
                        </Option>
                      );
                    })
                  ) : (
                    <Option disabled value="">No pages available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item 
                name="cancellationPolicyPageSlug" 
                label="Cancellation Policy Page"
                tooltip="Select the page to be used as Cancellation Policy"
              >
                <Select 
                  placeholder="Select cancellation policy page"
                  allowClear
                  optionLabelProp="label"
                >
                  {pages && pages.length > 0 ? (
                    pages.map((page: any) => {
                      const label = page.translations?.[0]?.title || page.title || page.slug || `Page ${page.slug}`;
                      return (
                        <Option key={page.slug} value={page.slug}>
                          {label}
                        </Option>
                      );
                    })
                  ) : (
                    <Option disabled value="">No pages available</Option>
                  )}
                </Select>
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
