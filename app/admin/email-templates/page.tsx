'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Typography,
  Dropdown,
  Tabs,
  Select,
  Alert,
  Tooltip,
} from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  EditOutlined,
  MoreOutlined,
  MailOutlined,
  SendOutlined,
  EyeOutlined,
  CopyOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: Record<string, string>;
  body: Record<string, string>;
  variables: string[];
  isActive: boolean;
}

const locales = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Mock data
const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    code: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: {
      tr: 'Rezervasyonunuz onaylandı - {{bookingId}}',
      en: 'Your booking is confirmed - {{bookingId}}',
      de: 'Ihre Buchung ist bestätigt - {{bookingId}}',
    },
    body: {
      tr: `Sayın {{customerName}},

Rezervasyonunuz başarıyla onaylanmıştır.

Rezervasyon Detayları:
- Rezervasyon No: {{bookingId}}
- Otel: {{hotelName}}
- Giriş Tarihi: {{checkIn}}
- Çıkış Tarihi: {{checkOut}}
- Toplam Tutar: {{totalAmount}}

İyi tatiller dileriz!

FreeStays Ekibi`,
      en: `Dear {{customerName}},

Your booking has been confirmed.

Booking Details:
- Booking ID: {{bookingId}}
- Hotel: {{hotelName}}
- Check-in: {{checkIn}}
- Check-out: {{checkOut}}
- Total: {{totalAmount}}

Have a great vacation!

FreeStays Team`,
      de: `Sehr geehrte(r) {{customerName}},

Ihre Buchung wurde bestätigt.

Buchungsdetails:
- Buchungsnummer: {{bookingId}}
- Hotel: {{hotelName}}
- Check-in: {{checkIn}}
- Check-out: {{checkOut}}
- Gesamtbetrag: {{totalAmount}}

Wir wünschen Ihnen einen schönen Urlaub!

FreeStays Team`,
    },
    variables: ['customerName', 'bookingId', 'hotelName', 'checkIn', 'checkOut', 'totalAmount'],
    isActive: true,
  },
  {
    id: '2',
    code: 'welcome',
    name: 'Welcome',
    subject: {
      tr: 'FreeStays\'e Hoş Geldiniz!',
      en: 'Welcome to FreeStays!',
      de: 'Willkommen bei FreeStays!',
    },
    body: {
      tr: `Merhaba {{customerName}},

FreeStays ailesine hoş geldiniz!

Hesabınız başarıyla oluşturuldu. Artık binlerce otel arasından seçim yapabilir ve özel fırsatlardan yararlanabilirsiniz.

İlk rezervasyonunuzda %10 indirim için WELCOME10 kupon kodunu kullanmayı unutmayın!

FreeStays Ekibi`,
      en: `Hello {{customerName}},

Welcome to FreeStays!

Your account has been created successfully. You can now choose from thousands of hotels and take advantage of special offers.

Don't forget to use the coupon code WELCOME10 for 10% off your first booking!

FreeStays Team`,
      de: '',
    },
    variables: ['customerName'],
    isActive: true,
  },
  {
    id: '3',
    code: 'password_reset',
    name: 'Password Reset',
    subject: {
      tr: 'Şifre Sıfırlama İsteği',
      en: 'Password Reset Request',
      de: 'Passwort zurücksetzen',
    },
    body: {
      tr: `Merhaba {{customerName}},

Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:

{{resetLink}}

Bu bağlantı 24 saat geçerlidir.

Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

FreeStays Ekibi`,
      en: `Hello {{customerName}},

Click the link below to reset your password:

{{resetLink}}

This link is valid for 24 hours.

If you didn't request this, you can ignore this email.

FreeStays Team`,
      de: '',
    },
    variables: ['customerName', 'resetLink'],
    isActive: true,
  },
  {
    id: '4',
    code: 'booking_cancelled',
    name: 'Booking Cancelled',
    subject: {
      tr: 'Rezervasyonunuz iptal edildi - {{bookingId}}',
      en: 'Your booking has been cancelled - {{bookingId}}',
      de: 'Ihre Buchung wurde storniert - {{bookingId}}',
    },
    body: {
      tr: `Sayın {{customerName}},

{{bookingId}} numaralı rezervasyonunuz iptal edilmiştir.

İade tutarı 5-10 iş günü içinde hesabınıza yatırılacaktır.

Sorularınız için bizimle iletişime geçebilirsiniz.

FreeStays Ekibi`,
      en: '',
      de: '',
    },
    variables: ['customerName', 'bookingId'],
    isActive: true,
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedLocale, setSelectedLocale] = useState('tr');
  const [form] = Form.useForm();
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const showModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      subject: template.subject[selectedLocale] || '',
      body: template.body[selectedLocale] || '',
      isActive: template.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      setTemplates(templates.map(t => {
        if (t.id === editingTemplate?.id) {
          return {
            ...t,
            subject: { ...t.subject, [selectedLocale]: values.subject },
            body: { ...t.body, [selectedLocale]: values.body },
            isActive: values.isActive,
          };
        }
        return t;
      }));
      
      message.success('Template saved');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const onLocaleChange = (locale: string) => {
    setSelectedLocale(locale);
    if (editingTemplate) {
      form.setFieldsValue({
        subject: editingTemplate.subject[locale] || '',
        body: editingTemplate.body[locale] || '',
      });
    }
  };

  const sendTestEmail = () => {
    if (!testEmail) {
      message.error('Enter email address');
      return;
    }
    message.success(`Test email sent to ${testEmail}`);
    setTestEmailModalOpen(false);
    setTestEmail('');
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    message.success(`{{${variable}}} copied`);
  };

  const columns = [
    {
      title: 'Template',
      key: 'template',
      render: (_: any, record: EmailTemplate) => (
        <Space>
          <MailOutlined style={{ fontSize: 20 }} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" code style={{ fontSize: 12 }}>{record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Subject (TR)',
      dataIndex: ['subject', 'tr'],
      key: 'subject',
      render: (subject: string) => (
        <Text ellipsis style={{ maxWidth: 300 }}>{subject}</Text>
      ),
    },
    {
      title: 'Variables',
      dataIndex: 'variables',
      key: 'variables',
      render: (variables: string[]) => (
        <Space wrap>
          {variables.slice(0, 3).map(v => (
            <Tag key={v} color="blue" style={{ cursor: 'pointer' }} onClick={() => copyVariable(v)}>
              {`{{${v}}}`}
            </Tag>
          ))}
          {variables.length > 3 && (
            <Tooltip title={variables.slice(3).map(v => `{{${v}}}`).join(', ')}>
              <Tag>+{variables.length - 3}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Translations',
      key: 'translations',
      render: (_: any, record: EmailTemplate) => (
        <Space>
          {locales.map(locale => {
            const hasTranslation = record.body[locale.code] && record.body[locale.code].trim() !== '';
            return (
              <Tag 
                key={locale.code} 
                color={hasTranslation ? 'green' : 'default'}
                style={{ opacity: hasTranslation ? 1 : 0.5 }}
              >
                {locale.flag}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: EmailTemplate) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Button 
            size="small" 
            icon={<SendOutlined />} 
            onClick={() => {
              setEditingTemplate(record);
              setTestEmailModalOpen(true);
            }}
          >
            Test
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <MailOutlined style={{ marginRight: 12 }} />
          Email Templates
        </Title>
      </div>

      <Alert
        message="Email Templates"
        description="You can edit the templates for system emails. Variables are used in {{variable}} format."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title={
          <Space>
            {editingTemplate?.name}
            <Select
              value={selectedLocale}
              onChange={onLocaleChange}
              style={{ width: 150 }}
              options={locales.map(l => ({
                label: <Space>{l.flag} {l.name}</Space>,
                value: l.code,
              }))}
            />
          </Space>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Available variables: </Text>
          <Space wrap>
            {editingTemplate?.variables.map(v => (
              <Tag 
                key={v} 
                color="blue" 
                style={{ cursor: 'pointer' }} 
                icon={<CopyOutlined />}
                onClick={() => copyVariable(v)}
              >
                {`{{${v}}}`}
              </Tag>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="subject"
            label={`Subject (${selectedLocale.toUpperCase()})`}
            rules={[{ required: true, message: 'Subject is required' }]}
          >
            <Input placeholder="Email subject" />
          </Form.Item>

          <Form.Item
            name="body"
            label={`Content (${selectedLocale.toUpperCase()})`}
            rules={[{ required: true, message: 'Content is required' }]}
          >
            <TextArea rows={15} placeholder="Email content" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Test Email Modal */}
      <Modal
        title="Send Test Email"
        open={testEmailModalOpen}
        onOk={sendTestEmail}
        onCancel={() => {
          setTestEmailModalOpen(false);
          setTestEmail('');
        }}
        okText="Send"
        cancelText="Cancel"
      >
        <Form layout="vertical">
          <Form.Item label="Template">
            <Text strong>{editingTemplate?.name}</Text>
          </Form.Item>
          <Form.Item label="Email Address" required>
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </Form.Item>
          <Alert
            message="Test email will be sent with sample values."
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
}
