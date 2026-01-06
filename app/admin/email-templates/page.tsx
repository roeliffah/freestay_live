'use client';

import React, { useState, useEffect } from 'react';
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
  Tabs,
  Select,
  Alert,
  Tooltip,
  Spin,
  App,
  Collapse,
  Badge,
  Divider,
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
  ReloadOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';
import { SUPPORTED_LOCALES } from '@/lib/constants/locales';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface EmailTemplateTranslation {
  locale: string;
  subject: string;
  body: string;
}

interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  translations: EmailTemplateTranslation[];
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  return (
    <App>
      <EmailTemplatesContent />
    </App>
  );
}

function EmailTemplatesContent() {
  const { message: messageApi } = App.useApp();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [form] = Form.useForm();
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmailForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState('tr');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response: any = await adminAPI.getEmailTemplates();
      const templatesData = Array.isArray(response) ? response : (response.items || []);
      setTemplates(templatesData);
    } catch (error: any) {
      console.error('Failed to load email templates:', error);
      messageApi.error(error.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setSelectedLocale('tr'); // Reset to default locale
    
    // Tüm diller için değerleri ayarla
    const formValues: any = {
      isActive: template.isActive,
    };
    
    SUPPORTED_LOCALES.forEach(locale => {
      const translation = template.translations?.find(t => t.locale === locale.code);
      if (translation) {
        formValues[`subject_${locale.code}`] = translation.subject;
        formValues[`body_${locale.code}`] = translation.body;
      }
    });
    
    form.setFieldsValue(formValues);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      if (!editingTemplate) return;

      // Tüm diller için çevirileri topla
      const translations: EmailTemplateTranslation[] = SUPPORTED_LOCALES.map(locale => ({
        locale: locale.code,
        subject: values[`subject_${locale.code}`] || '',
        body: values[`body_${locale.code}`] || '',
      })).filter(t => t.subject); // Sadece subject doldurulmuş olanları al

      const updateData = {
        name: editingTemplate.name,
        description: editingTemplate.description,
        isActive: values.isActive,
        translations,
      };

      await adminAPI.updateEmailTemplate(editingTemplate.id, updateData);
      messageApi.success('Template saved successfully');
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      messageApi.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const values = await testEmailForm.validateFields();
      if (!editingTemplate) return;

      await adminAPI.sendTestEmail(editingTemplate.code, {
        email: values.email,
        locale: values.locale || 'tr',
        testVariables: values.testVariables ? JSON.parse(values.testVariables) : undefined,
      });

      messageApi.success(`Test email sent to ${values.email}`);
      setTestEmailModalOpen(false);
      testEmailForm.resetFields();
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      messageApi.error(error.message || 'Failed to send test email');
    }
  };

  const toggleStatus = async (template: EmailTemplate) => {
    try {
      await adminAPI.toggleEmailTemplateStatus(template.id);
      messageApi.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`);
      fetchTemplates();
    } catch (error: any) {
      console.error('Failed to toggle status:', error);
      messageApi.error(error.message || 'Failed to update status');
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    messageApi.success(`{{${variable}}} copied`);
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Text ellipsis style={{ maxWidth: 250 }}>{description || '-'}</Text>
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
          {SUPPORTED_LOCALES.map(locale => {
            const hasTranslation = record.translations?.some(
              t => t.locale === locale.code && t.body && t.body.trim() !== ''
            ) || false;
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
      render: (isActive: boolean, record: EmailTemplate) => (
        <Switch
          checked={isActive}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => toggleStatus(record)}
        />
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
              testEmailForm.setFieldsValue({ locale: 'tr' });
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
        <Button icon={<ReloadOutlined />} onClick={fetchTemplates} loading={loading}>
          Refresh
        </Button>
      </div>

      <Alert
        title="Email Templates"
        description="You can edit the templates for system emails. Variables are used in {{variable}} format."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={templates || []}
            rowKey={(record) => record.id || `template-${Math.random()}`}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} templates`,
              responsive: true,
            }}
          />
        </Spin>
      </Card>

      {/* Edit Modal */}
      <Modal
        title={
          <Space>
            {editingTemplate?.name}
            <Select
              value={selectedLocale}
              onChange={setSelectedLocale}
              style={{ width: 150 }}
              options={SUPPORTED_LOCALES.map(l => ({
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
        confirmLoading={saving}
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
            name={`subject_${selectedLocale}`}
            label={`Subject (${SUPPORTED_LOCALES.find(l => l.code === selectedLocale)?.name})`}
            rules={[{ required: true, message: 'Subject is required' }]}
          >
            <Input placeholder="Email subject" />
          </Form.Item>

          <Form.Item
            name={`body_${selectedLocale}`}
            label={`Content (${SUPPORTED_LOCALES.find(l => l.code === selectedLocale)?.name})`}
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
        onOk={handleSendTestEmail}
        onCancel={() => {
          setTestEmailModalOpen(false);
          testEmailForm.resetFields();
        }}
        okText="Send"
        cancelText="Cancel"
      >
        <Form form={testEmailForm} layout="vertical">
          <Form.Item label="Template">
            <Text strong>{editingTemplate?.name}</Text>
            <br />
            <Text type="secondary" code>{editingTemplate?.code}</Text>
          </Form.Item>
          
          <Form.Item 
            name="email" 
            label="Email Address" 
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email format' }
            ]}
          >
            <Input
              type="email"
              placeholder="test@example.com"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item 
            name="locale" 
            label="Language"
            rules={[{ required: true, message: 'Language is required' }]}
          >
            <Select
              options={SUPPORTED_LOCALES.map(l => ({
                label: <Space>{l.flag} {l.name}</Space>,
                value: l.code,
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="testVariables" 
            label="Test Variables (JSON)"
          >
            <TextArea 
              rows={4} 
              placeholder={`{\n  "customerName": "John Doe",\n  "bookingId": "BK-12345"\n}`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Alert
            message="Test email will be sent with the provided variables or sample values."
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
}
