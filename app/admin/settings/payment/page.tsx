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

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  isEnabled: boolean;
  icon: string;
}

interface CurrencySettings {
  defaultCurrency: string;
  supportedCurrencies: string[];
  autoConvert: boolean;
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

// Mock data
const mockStripeSettings: StripeSettings = {
  isEnabled: true,
  testMode: true,
  publicKeyLive: '',
  secretKeyLive: '',
  publicKeyTest: 'pk_test_51...xxxx',
  secretKeyTest: 'sk_test_51...xxxx',
  webhookSecret: 'whsec_...xxxx',
  webhookUrl: 'https://freestays.com/api/webhooks/stripe',
};

const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', name: 'Visa', code: 'visa', isEnabled: true, icon: '💳' },
  { id: '2', name: 'Mastercard', code: 'mastercard', isEnabled: true, icon: '💳' },
  { id: '3', name: 'American Express', code: 'amex', isEnabled: true, icon: '💳' },
  { id: '4', name: 'Apple Pay', code: 'apple_pay', isEnabled: false, icon: '🍎' },
  { id: '5', name: 'Google Pay', code: 'google_pay', isEnabled: false, icon: '🔵' },
  { id: '6', name: 'iDEAL', code: 'ideal', isEnabled: true, icon: '🏦' },
  { id: '7', name: 'Bancontact', code: 'bancontact', isEnabled: false, icon: '🏦' },
  { id: '8', name: 'Sofort', code: 'sofort', isEnabled: true, icon: '🏦' },
];

const mockCurrencySettings: CurrencySettings = {
  defaultCurrency: 'EUR',
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'TRY'],
  autoConvert: true,
};

const mockTransactions: Transaction[] = [
  { id: 'txn_1', date: '2024-01-15 14:30', type: 'payment', amount: 450.00, currency: 'EUR', status: 'succeeded', bookingId: 'BK-001' },
  { id: 'txn_2', date: '2024-01-15 12:15', type: 'refund', amount: -120.00, currency: 'EUR', status: 'succeeded', bookingId: 'BK-098' },
  { id: 'txn_3', date: '2024-01-14 18:45', type: 'payment', amount: 890.00, currency: 'EUR', status: 'succeeded', bookingId: 'BK-002' },
  { id: 'txn_4', date: '2024-01-14 10:20', type: 'payment', amount: 320.00, currency: 'EUR', status: 'failed', bookingId: 'BK-003' },
  { id: 'txn_5', date: '2024-01-13 09:00', type: 'payment', amount: 1250.00, currency: 'EUR', status: 'succeeded', bookingId: 'BK-004' },
];

const currencies = [
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'TRY', label: '₺ Türk Lirası (TRY)' },
  { value: 'CHF', label: '₣ Swiss Franc (CHF)' },
  { value: 'PLN', label: 'zł Polish Zloty (PLN)' },
];

export default function PaymentSettingsPage() {
  const [stripeSettings, setStripeSettings] = useState<StripeSettings>(mockStripeSettings);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(mockCurrencySettings);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  
  const [stripeForm] = Form.useForm();
  const [currencyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const handleStripeSave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStripeSettings({ ...stripeSettings, ...values });
    message.success('Stripe settings saved');
    setLoading(false);
  };

  const handleCurrencySave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrencySettings(values);
    message.success('Currency settings saved');
    setLoading(false);
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(pm => 
      pm.id === id ? { ...pm, isEnabled: !pm.isEnabled } : pm
    ));
    message.success('Payment method updated');
  };

  const testStripeConnection = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('Stripe connection successful!');
    setLoading(false);
  };

  const paymentMethodColumns = [
    {
      title: 'Payment Method',
      key: 'name',
      render: (_: any, record: PaymentMethod) => (
        <Space>
          <span style={{ fontSize: 20 }}>{record.icon}</span>
          <Text strong>{record.name}</Text>
          <Text type="secondary" code style={{ fontSize: 11 }}>{record.code}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (isEnabled: boolean, record: PaymentMethod) => (
        <Switch 
          checked={isEnabled} 
          onChange={() => togglePaymentMethod(record.id)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Tip',
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
          initialValues={stripeSettings}
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
                <Alert message="No real payments in test mode" type="warning" showIcon />
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

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="webhookUrl" label="Webhook URL">
                <Input 
                  prefix={<LinkOutlined />} 
                  disabled 
                  addonAfter={
                    <Button 
                      type="text" 
                      size="small" 
                      onClick={() => {
                        navigator.clipboard.writeText(stripeSettings.webhookUrl);
                        message.success('URL copied');
                      }}
                    >
                      Copy
                    </Button>
                  }
                />
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
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                Save
              </Button>
              <Button icon={<ReloadOutlined />} onClick={testStripeConnection} loading={loading}>
                Test Connection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'methods',
      label: <Space><CreditCardOutlined />Payment Methods</Space>,
      children: (
        <div>
          <Alert
            message="Supported Payment Methods"
            description="You can enable or disable the payment methods available to your customers."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={paymentMethodColumns}
            dataSource={paymentMethods}
            rowKey="id"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'currency',
      label: <Space><DollarOutlined />Currency</Space>,
      children: (
        <Form
          form={currencyForm}
          layout="vertical"
          initialValues={currencySettings}
          onFinish={handleCurrencySave}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="defaultCurrency" label="Default Currency">
                <Select options={currencies} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="autoConvert" valuePropName="checked" label="Auto Conversion">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="supportedCurrencies" label="Supported Currencies">
            <Select 
              mode="multiple" 
              options={currencies} 
              placeholder="Select currencies"
            />
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
      key: 'transactions',
      label: <Space><HistoryOutlined />Recent Transactions</Space>,
      children: (
        <div>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Today's Revenue"
                  value={1340}
                  precision={2}
                  prefix="€"
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="This Month"
                  value={24580}
                  precision={2}
                  prefix="€"
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Refunds"
                  value={1250}
                  precision={2}
                  prefix="€"
                  styles={{ content: { color: '#cf1322' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Success Rate"
                  value={97.5}
                  precision={1}
                  suffix="%"
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <CreditCardOutlined style={{ marginRight: 12 }} />
          Payment Settings
        </Title>
        <Tag color={stripeSettings.testMode ? 'orange' : 'green'} style={{ fontSize: 14, padding: '4px 12px' }}>
          {stripeSettings.testMode ? '🧪 Test Mode' : '🟢 Live Mode'}
        </Tag>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
