'use client';

import React, { useState } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Typography,
  Dropdown,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  CopyOutlined,
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  minBookingAmount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

// Mock data
const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'WINTER25',
    discountType: 'percentage',
    discountValue: 25,
    maxUses: 100,
    usedCount: 45,
    minBookingAmount: 500,
    validFrom: '2025-12-01',
    validUntil: '2025-12-31',
    isActive: true,
    createdAt: '2025-11-25',
  },
  {
    id: '2',
    code: 'NEWYEAR50',
    discountType: 'fixed',
    discountValue: 50,
    maxUses: 200,
    usedCount: 12,
    minBookingAmount: 300,
    validFrom: '2025-12-25',
    validUntil: '2026-01-05',
    isActive: true,
    createdAt: '2025-12-01',
  },
  {
    id: '3',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: -1, // Unlimited
    usedCount: 234,
    minBookingAmount: 0,
    validFrom: '2025-01-01',
    validUntil: '2025-12-31',
    isActive: true,
    createdAt: '2025-01-01',
  },
  {
    id: '4',
    code: 'SUMMER20',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 500,
    usedCount: 500,
    minBookingAmount: 1000,
    validFrom: '2025-06-01',
    validUntil: '2025-08-31',
    isActive: false,
    createdAt: '2025-05-15',
  },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const showModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      form.setFieldsValue({
        ...coupon,
        dateRange: [dayjs(coupon.validFrom), dayjs(coupon.validUntil)],
      });
    } else {
      setEditingCoupon(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [validFrom, validUntil] = values.dateRange;
      
      const couponData = {
        ...values,
        validFrom: validFrom.format('YYYY-MM-DD'),
        validUntil: validUntil.format('YYYY-MM-DD'),
        dateRange: undefined,
      };

      if (editingCoupon) {
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...c, ...couponData } : c));
        message.success('Coupon updated');
      } else {
        const newCoupon: Coupon = {
          ...couponData,
          id: Date.now().toString(),
          usedCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setCoupons([...coupons, newCoupon]);
        message.success('Coupon created');
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

const handleDelete = (id: string) => {
    setCoupons(coupons.filter(c => c.id !== id));
    message.success('Coupon deleted');
  };

  const toggleActive = (coupon: Coupon) => {
    setCoupons(coupons.map(c => 
      c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
    ));
    message.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('Coupon code copied');
  };

  const getActionItems = (record: Coupon): MenuProps['items'] => [
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Copy Code',
      onClick: () => copyCode(record.code),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => showModal(record),
    },
    {
      key: 'toggle',
      icon: record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
      label: record.isActive ? 'Deactivate' : 'Activate',
      onClick: () => toggleActive(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
    },
  ];

  const columns = [
    {
      title: 'Coupon Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <Tag color="purple" style={{ fontSize: 14, fontWeight: 'bold' }}>
            {code}
          </Tag>
          <Tooltip title="Copy">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyCode(code)} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_: any, record: Coupon) => (
        <Space>
          {record.discountType === 'percentage' ? (
            <Tag color="blue" icon={<PercentageOutlined />}>
              %{record.discountValue}
            </Tag>
          ) : (
            <Tag color="green" icon={<DollarOutlined />}>
              €{record.discountValue}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: any, record: Coupon) => {
        const percent = record.maxUses === -1 ? 0 : (record.usedCount / record.maxUses) * 100;
        return (
          <div>
            <Text>
              {record.usedCount} / {record.maxUses === -1 ? '∞' : record.maxUses}
            </Text>
            {record.maxUses !== -1 && percent >= 90 && (
              <Tag color="red" style={{ marginLeft: 8 }}>Running Out</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Min. Amount',
      dataIndex: 'minBookingAmount',
      key: 'minBookingAmount',
      render: (amount: number) => amount > 0 ? `€${amount}` : '-',
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_: any, record: Coupon) => {
        const isExpired = dayjs(record.validUntil).isBefore(dayjs());
        const isNotStarted = dayjs(record.validFrom).isAfter(dayjs());
        return (
          <div>
            <Text>{record.validFrom} - {record.validUntil}</Text>
            {isExpired && <Tag color="red" style={{ marginLeft: 8 }}>Expired</Tag>}
            {isNotStarted && <Tag color="orange" style={{ marginLeft: 8 }}>Not Started</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: Coupon) => record.isActive === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: Coupon) => (
        <Dropdown
          menu={{
            items: getActionItems(record),
            onClick: ({ key }) => {
              if (key === 'delete') {
                Modal.confirm({
                  title: 'Delete Coupon',
                  content: `Are you sure you want to delete coupon "${record.code}"?`,
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => handleDelete(record.id),
                });
              }
            },
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Coupons</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          New Coupon
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Coupons" 
              value={coupons.length}
              prefix={<GiftOutlined style={{ color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Active Coupons" 
              value={activeCoupons}
              styles={{ content: { color: '#10b981' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Usage" 
              value={totalUsage}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Usage Rate" 
              value={68}
              suffix="%"
              styles={{ content: { color: '#f59e0b' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search coupon code..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredCoupons}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} coupons`,
          }}
        />
      </Card>

      <Modal
        title={editingCoupon ? 'Edit Coupon' : 'New Coupon'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingCoupon ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={550}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            discountType: 'percentage',
            maxUses: 100,
            minBookingAmount: 0,
            isActive: true,
          }}
        >
          <Form.Item
            name="code"
            label="Coupon Code"
            rules={[
              { required: true, message: 'Coupon code is required' },
              { pattern: /^[A-Z0-9]+$/, message: 'Use only uppercase letters and numbers' },
            ]}
          >
            <Input 
              placeholder="WINTER25" 
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => form.setFieldValue('code', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Discount Type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="percentage">Percentage (%)</Select.Option>
                  <Select.Option value="fixed">Fixed Amount (€)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[{ required: true, message: 'Discount value is required' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxUses"
                label="Maximum Usage"
                tooltip="Enter -1 for unlimited"
              >
                <InputNumber min={-1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="minBookingAmount"
                label="Minimum Order Amount (€)"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label="Validity Period"
            rules={[{ required: true, message: 'Date range is required' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
