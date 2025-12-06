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
  Alert,
} from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ExternalService {
  id: string;
  name: string;
  code: string;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  lastSync: string | null;
  settings: Record<string, any>;
}

// Mock data
const mockServices: ExternalService[] = [
  {
    id: '1',
    name: 'SunHotels',
    code: 'sunhotels',
    baseUrl: 'http://xml.sunhotels.net/15/PostGet/NonStaticXMLAPI.asmx',
    apiKey: 'FreestaysTEST',
    apiSecret: 'Vision2024!@',
    isActive: true,
    lastSync: '2025-12-05 03:00',
    settings: {
      defaultCurrency: 'EUR',
      timeout: 30000,
      maxRetries: 3,
    },
  },
  {
    id: '2',
    name: 'Kiwi.com',
    code: 'kiwi',
    baseUrl: 'https://api.tequila.kiwi.com',
    apiKey: '',
    apiSecret: '',
    isActive: false,
    lastSync: null,
    settings: {
      defaultCurrency: 'EUR',
      searchRadius: 50,
    },
  },
  {
    id: '3',
    name: 'DiscoverCars',
    code: 'discovercars',
    baseUrl: 'https://api.discovercars.com',
    apiKey: '',
    apiSecret: '',
    isActive: false,
    lastSync: null,
    settings: {
      defaultCurrency: 'EUR',
    },
  },
  {
    id: '4',
    name: 'Stripe',
    code: 'stripe',
    baseUrl: 'https://api.stripe.com',
    apiKey: 'pk_test_xxx',
    apiSecret: 'sk_test_xxx',
    isActive: true,
    lastSync: null,
    settings: {
      webhookSecret: 'whsec_xxx',
      currency: 'EUR',
    },
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<ExternalService[]>(mockServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ExternalService | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();
  const [testing, setTesting] = useState<string | null>(null);

  const showModal = (service: ExternalService) => {
    setEditingService(service);
    form.setFieldsValue({
      ...service,
      settings: JSON.stringify(service.settings, null, 2),
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const settings = JSON.parse(values.settings);
      
      setServices(services.map(s => 
        s.id === editingService?.id ? { ...s, ...values, settings } : s
      ));
      
      message.success('Service settings saved');
      setIsModalOpen(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        message.error('Invalid JSON format');
      }
    }
  };

const toggleActive = (service: ExternalService) => {
    setServices(services.map(s => 
      s.id === service.id ? { ...s, isActive: !s.isActive } : s
    ));
    message.success(service.isActive ? 'Service deactivated' : 'Service activated');
  };

  const testConnection = async (service: ExternalService) => {
    setTesting(service.id);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting(null);
    
    if (service.apiKey) {
      message.success(`${service.name} connection successful!`);
    } else {
      message.error(`${service.name} connection failed: API key missing`);
    }
  };

  const triggerSync = async (service: ExternalService) => {
    message.loading(`${service.name} synchronization starting...`);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setServices(services.map(s => 
      s.id === service.id ? { ...s, lastSync: new Date().toLocaleString('en-US') } : s
    ));
    
    message.success(`${service.name} synchronization completed`);
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
    ...(record.code === 'sunhotels' ? [{
      key: 'sync',
      icon: <SyncOutlined />,
      label: 'Synchronize',
      onClick: () => triggerSync(record),
    }] : []),
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
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
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
            {maskSecret(record.apiKey, showSecrets[record.id])}
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
      title: 'Last Synchronization',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (date: string | null) => date || '-',
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
      </div>

      <Alert
        message="Service Integrations"
        description="Here you can manage API settings for external services like SunHotels, Kiwi.com, DiscoverCars and Stripe. Keep your API keys secure."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={`${editingService?.name} Settings`}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Service Name">
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
            name="settings"
            label="Additional Settings (JSON)"
            rules={[
              {
                validator: async (_, value) => {
                  try {
                    JSON.parse(value);
                  } catch {
                    throw new Error('Enter valid JSON format');
                  }
                },
              },
            ]}
          >
            <TextArea rows={6} style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
