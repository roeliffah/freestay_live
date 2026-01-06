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
  Select,
  Typography,
  Dropdown,
  Alert,
  Spin,
  App,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  EditOutlined,
  MoreOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ExternalService {
  id: string;
  serviceName: string;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  affiliateCode?: string;
  integrationMode: number; // 1=Test, 2=Production
  isActive: boolean;
  settings?: string; // JSON string
  createdAt?: string;
  updatedAt?: string;
}

export default function ServicesPage() {
  return (
    <App>
      <ServicesContent />
    </App>
  );
}

function ServicesContent() {
  const { message: messageApi } = App.useApp();
  const [services, setServices] = useState<ExternalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ExternalService | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response: any = await adminAPI.getExternalServices();
      const servicesData = Array.isArray(response) ? response : (response.items || []);
      setServices(servicesData);
    } catch (error: any) {
      console.error('Failed to load services:', error);
      messageApi.error(error.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (service: ExternalService) => {
    setEditingService(service);
    form.setFieldsValue({
      serviceName: service.serviceName,
      baseUrl: service.baseUrl,
      apiKey: service.apiKey,
      apiSecret: service.apiSecret,
      username: service.username,
      password: service.password,
      affiliateCode: service.affiliateCode,
      integrationMode: service.integrationMode,
      isActive: service.isActive,
      settings: service.settings || '{}',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      if (!editingService) return;

      // Validate settings JSON
      if (values.settings) {
        try {
          JSON.parse(values.settings);
        } catch {
          messageApi.error('Invalid JSON format in settings');
          setSaving(false);
          return;
        }
      }
      
      const updateData = {
        baseUrl: values.baseUrl,
        apiKey: values.apiKey,
        apiSecret: values.apiSecret,
        username: values.username,
        password: values.password,
        affiliateCode: values.affiliateCode,
        integrationMode: values.integrationMode,
        isActive: values.isActive,
        settings: values.settings,
      };

      await adminAPI.updateExternalService(editingService.id, updateData);
      messageApi.success('Service settings saved successfully');
      setIsModalOpen(false);
      fetchServices();
    } catch (error: any) {
      console.error('Failed to save service:', error);
      messageApi.error(error.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: ExternalService) => {
    try {
      await adminAPI.toggleExternalServiceStatus(service.id);
      messageApi.success(service.isActive ? 'Service deactivated' : 'Service activated');
      fetchServices();
    } catch (error: any) {
      console.error('Failed to toggle status:', error);
      messageApi.error(error.message || 'Failed to update status');
    }
  };

  const testConnection = async (service: ExternalService) => {
    setTesting(service.id);
    try {
      await adminAPI.testExternalServiceConnection(service.id);
      messageApi.success(`${service.serviceName} connection test successful!`);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      messageApi.error(error.message || `${service.serviceName} connection test failed`);
    } finally {
      setTesting(null);
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskSecret = (secret: string, show: boolean) => {
    if (!secret) return '-';
    if (show) return secret;
    return secret.substring(0, 4) + '••••••••' + secret.substring(secret.length - 4);
  };

  const getActionItems = (record: ExternalService): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Settings',
      onClick: () => showModal(record),
    },
    {
      key: 'test',
      icon: <ApiOutlined />,
      label: 'Test Connection',
      onClick: () => testConnection(record),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'toggle',
      icon: record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      label: record.isActive ? 'Deactivate' : 'Activate',
      onClick: () => toggleActive(record),
    },
  ];

  const columns = [
    {
      title: 'Service',
      key: 'service',
      render: (_: any, record: ExternalService) => (
        <Space>
          <ApiOutlined style={{ fontSize: 24, color: record.isActive ? '#52c41a' : '#d9d9d9' }} />
          <div>
            <Text strong>{record.serviceName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.integrationMode === 1 ? 'Test Mode' : 'Production'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Base URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      render: (url: string) => (
        <Text copyable style={{ fontSize: 12 }}>{url}</Text>
      ),
    },
    {
      title: 'API Key',
      key: 'apiKey',
      render: (_: any, record: ExternalService) => (
        <Space>
          <Text style={{ fontFamily: 'monospace' }}>
            {maskSecret(record.apiKey || '', showSecrets[record.id])}
          </Text>
          <Button
            type="text"
            size="small"
            icon={showSecrets[record.id] ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => toggleSecretVisibility(record.id)}
          />
        </Space>
      ),
    },
    {
      title: 'Affiliate Code',
      dataIndex: 'affiliateCode',
      key: 'affiliateCode',
      render: (code: string) => code || '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ExternalService) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ApiOutlined />}
            loading={testing === record.id}
            onClick={() => testConnection(record)}
          >
            Test
          </Button>
          <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <ApiOutlined style={{ marginRight: 12 }} />
          External Services
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchServices} loading={loading}>
          Refresh
        </Button>
      </div>

      <Alert
        title="Service Integrations"
        description="Here you can manage API settings for external services like SunHotels, Kiwi.com, DiscoverCars and Stripe. Keep your API keys secure."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={services || []}
            rowKey={(record) => record.id || `service-${Math.random()}`}
            scroll={{ x: 800 }}
            pagination={false}
          />
        </Spin>
      </Card>

      <Modal
        title={`${editingService?.serviceName} Settings`}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width="90%"
        style={{ maxWidth: 700 }}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="serviceName" label="Service Name">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="Base URL"
            rules={[{ required: true, message: 'Base URL is required' }]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
          >
            <Input.Password placeholder="API key" />
          </Form.Item>

          <Form.Item
            name="apiSecret"
            label="API Secret"
          >
            <Input.Password placeholder="API secret key" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
          >
            <Input placeholder="Username (if required)" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
          >
            <Input.Password placeholder="Password (if required)" />
          </Form.Item>

          <Form.Item
            name="affiliateCode"
            label="Affiliate Code"
          >
            <Input placeholder="Affiliate or partner code" />
          </Form.Item>

          <Form.Item
            name="integrationMode"
            label="Integration Mode"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value={1}>Test Mode</Select.Option>
              <Select.Option value={2}>Production</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="settings"
            label="Additional Settings (JSON)"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.trim() === '' || value.trim() === '{}') return;
                  try {
                    JSON.parse(value);
                  } catch {
                    throw new Error('Enter valid JSON format');
                  }
                },
              },
            ]}
          >
            <TextArea rows={6} style={{ fontFamily: 'monospace' }} placeholder='{"key": "value"}' />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {editingService?.createdAt && (
            <Alert
              type="info"
              icon={<SyncOutlined />}
              title="Service Information"
              description={
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    Created: {new Date(editingService.createdAt).toLocaleString('tr-TR')}
                  </Text>
                  {editingService.updatedAt && (
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      Last Updated: {new Date(editingService.updatedAt).toLocaleString('tr-TR')}
                    </Text>
                  )}
                </div>
              }
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
}
