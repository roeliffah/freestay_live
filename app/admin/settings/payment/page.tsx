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
  Tag,
  Alert,
  Table,
  InputNumber,
  Statistic,
  Spin,
  App,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SaveOutlined,
  CreditCardOutlined,
  DollarOutlined,
  SafetyOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  LinkOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;

interface StripeSettings {
  isEnabled: boolean;
  testMode: boolean;
  publicKeyLive: string;
  secretKeyLive: string;
  publicKeyTest: string;
  secretKeyTest: string;
  webhookSecret: string;
  webhookUrl: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  bookingId: string;
}

export default function PaymentSettingsPage() {
  return (
    <App>
      <PaymentSettingsContent />
    </App>
  );
}

function PaymentSettingsContent() {
  const { message: messageApi } = App.useApp();
  const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
    isEnabled: false,
    testMode: false,
    publicKeyLive: '',
    secretKeyLive: '',
    publicKeyTest: '',
    secretKeyTest: '',
    webhookSecret: '',
    webhookUrl: '',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [stripeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getPaymentSettings() as any;
      
      // Yeni API yapısını parse et
      if (data?.provider === 'stripe') {
        const settings = {
          isEnabled: data.isActive,
          testMode: !data.isLive,
          publicKeyTest: data.testMode?.publicKey || '',
          secretKeyTest: data.testMode?.secretKey || '',
          publicKeyLive: data.liveMode?.publicKey || '',
          secretKeyLive: data.liveMode?.secretKey || '',
          webhookSecret: data.webhookSecret || '',
          webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/webhooks/stripe`,
        };
        
        setStripeSettings(settings);
        stripeForm.setFieldsValue(settings);
      }
      
      if (data?.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error: any) {
      console.error('Failed to load payment settings:', error);
      messageApi.error(error.response?.data?.message || error.message || 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSave = async (values: any) => {
    setSaving(true);
    try {
      // Backend API'nin beklediği yeni formata dönüştür
      const paymentData = {
        provider: 'stripe',
        testMode: {
          publicKey: values.publicKeyTest || '',
          secretKey: values.secretKeyTest || ''
        },
        liveMode: {
          publicKey: values.publicKeyLive || '',
          secretKey: values.secretKeyLive || ''
        },
        webhookSecret: values.webhookSecret || '',
        isLive: !values.testMode,
        isActive: values.isEnabled
      };
      
      await adminAPI.updatePaymentSettings(paymentData);
      setStripeSettings({ ...stripeSettings, ...values });
      messageApi.success('Stripe settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save Stripe settings:', error);
      messageApi.error(error.response?.data?.message || error.message || 'Failed to save Stripe settings');
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    setSaving(true);
    try {
      await adminAPI.testPaymentConnection({ provider: 'stripe' });
      messageApi.success('Stripe connection successful!');
    } catch (error: any) {
      console.error('Failed to test Stripe connection:', error);
      messageApi.error(error.message || 'Stripe connection failed');
    } finally {
      setSaving(false);
    }
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'payment' ? 'green' : 'orange'}>
          {type === 'payment' ? 'Payment' : 'Refund'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: Transaction) => (
        <Text type={record.amount > 0 ? 'success' : 'warning'} strong>
          {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)} {record.currency}
        </Text>
      ),
    },
    {
      title: 'Booking',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={status === 'succeeded' ? 'green' : status === 'pending' ? 'orange' : 'red'}
          icon={status === 'succeeded' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status === 'succeeded' ? 'Succeeded' : status === 'pending' ? 'Pending' : 'Failed'}
        </Tag>
      ),
    },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'stripe',
      label: <Space><CreditCardOutlined />Stripe</Space>,
      children: (
        <Form
          form={stripeForm}
          layout="vertical"
          onFinish={handleStripeSave}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="isEnabled" valuePropName="checked" label="Stripe Integration">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="testMode" valuePropName="checked" label="Test Mode">
                <Switch 
                  checkedChildren="Test" 
                  unCheckedChildren="Live" 
                />
              </Form.Item>
              {stripeSettings.testMode && (
                <Alert title="No real payments will be processed in test mode" type="warning" showIcon />
              )}
            </Col>
          </Row>

          <Divider>
            <Space>
              <Text strong>API Keys</Text>
              <Button 
                type="text" 
                size="small" 
                icon={showSecrets ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? 'Hide' : 'Show'}
              </Button>
            </Space>
          </Divider>

          <Card title="Test Keys" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="publicKeyTest" label="Public Key (Test)">
                  <Input.Password 
                    placeholder="pk_test_..." 
                    visibilityToggle={{ visible: showSecrets, onVisibleChange: () => {} }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="secretKeyTest" label="Secret Key (Test)">
                  <Input.Password 
                    placeholder="sk_test_..." 
                    visibilityToggle={{ visible: showSecrets, onVisibleChange: () => {} }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Live Keys" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="publicKeyLive" label="Public Key (Live)">
                  <Input.Password 
                    placeholder="pk_live_..." 
                    visibilityToggle={{ visible: showSecrets, onVisibleChange: () => {} }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="secretKeyLive" label="Secret Key (Live)">
                  <Input.Password 
                    placeholder="sk_live_..." 
                    visibilityToggle={{ visible: showSecrets, onVisibleChange: () => {} }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider><Text strong>Webhook</Text></Divider>

          <Alert 
            title="Add this URL as webhook endpoint in Stripe Dashboard"
            description={`Stripe Dashboard → Developers → Webhooks → Add endpoint → Enter this URL`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Webhook URL">
                <Space.Compact style={{ width: '100%' }}>
                  <Input 
                    prefix={<LinkOutlined />} 
                    value={stripeSettings.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL || ''}/webhooks/stripe`}
                    disabled 
                  />
                  <Button 
                    onClick={() => {
                      const url = stripeSettings.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/webhooks/stripe`;
                      navigator.clipboard.writeText(url);
                      messageApi.success('URL copied');
                    }}
                  >
                    Copy
                  </Button>
                </Space.Compact>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="webhookSecret" label="Webhook Secret">
                <Input.Password 
                  placeholder="whsec_..." 
                  visibilityToggle={{ visible: showSecrets, onVisibleChange: () => {} }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                Save
              </Button>
              <Button icon={<ReloadOutlined />} onClick={testStripeConnection} loading={saving}>
                Test Connection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'transactions',
      label: <Space><HistoryOutlined />Recent Transactions</Space>,
      children: (
        <div>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Today's Revenue"
                  value={(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return transactions
                      .filter(t => t.date.startsWith(today) && t.status === 'succeeded' && t.type === 'payment')
                      .reduce((sum, t) => sum + t.amount, 0);
                  })()}
                  precision={2}
                  prefix="€"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="This Month"
                  value={(() => {
                    const thisMonth = new Date().toISOString().substring(0, 7);
                    return transactions
                      .filter(t => t.date.startsWith(thisMonth) && t.status === 'succeeded' && t.type === 'payment')
                      .reduce((sum, t) => sum + t.amount, 0);
                  })()}
                  precision={2}
                  prefix="€"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Refunds"
                  value={(() => {
                    return Math.abs(transactions
                      .filter(t => t.type === 'refund' && t.status === 'succeeded')
                      .reduce((sum, t) => sum + t.amount, 0));
                  })()}
                  precision={2}
                  prefix="€"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Success Rate"
                  value={(() => {
                    if (transactions.length === 0) return 0;
                    const succeeded = transactions.filter(t => t.status === 'succeeded').length;
                    return (succeeded / transactions.length) * 100;
                  })()}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={transactionColumns}
            dataSource={transactions || []}
            rowKey={(record) => record.id || `transaction-${Math.random()}`}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
  ];

  if (loading) {
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
          <CreditCardOutlined style={{ marginRight: 12 }} />
          Payment Settings
        </Title>
        <Space>
          <Tag color={stripeSettings.testMode ? 'orange' : 'green'} style={{ fontSize: 14, padding: '4px 12px' }}>
            {stripeSettings.testMode ? '🧪 Test Mode' : '🟢 Live Mode'}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={fetchPaymentSettings}>
            Refresh
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
