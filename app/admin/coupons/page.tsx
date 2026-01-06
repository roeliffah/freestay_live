'use client';

import React, { useState, useEffect } from 'react';
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
  Switch,
  Typography,
  Dropdown,
  Statistic,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Spin,
  App,
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
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;

interface Coupon {
  id: string;
  code: string;
  kind: 0 | 1 | 'Annual' | 'OneTime'; // API'den string olarak geliyor
  discountType?: 0 | 1 | 'percentage' | 'fixed';
  discountValue?: number;
  usageLimit?: number | null;
  usageCount?: number;
  maxUses?: number;
  usedCount?: number;
  minimumAmount?: number | null;
  maximumDiscount?: number | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  assignedUserId?: string | null;
  assignedEmail?: string | null;
  usedAt?: string | null;
  priceAmount?: number;
  priceCurrency?: string;
  stripePaymentIntentId?: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  return (
    <App>
      <CouponsContent />
    </App>
  );
}

function CouponsContent() {
  const { message: messageApi } = App.useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getCoupons();
      setCoupons(data as any);
    } catch (error: any) {
      console.error('Failed to load coupons:', error);
      messageApi.error(error.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = (prefix: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  };

  const generateCoupon = async (kind: 0 | 1) => {
    setCreating(true);
    try {
      const prefix = kind === 0 ? 'PASS' : 'GOLD';
      const code = generateRandomCode(prefix);
      const now = dayjs();
      
      const couponData: any = {
        code,
        description: kind === 0 ? 'Single-use pass coupon' : 'Annual gold membership coupon',
        kind,
        discountType: 0,
        discountValue: kind === 0 ? 10 : 20,
        minimumAmount: null,
        maximumDiscount: null,
        usageLimit: kind === 0 ? 1 : -1,
        validFrom: now.toISOString(),
        validUntil: now.add(1, 'year').toISOString(),
      };

      console.log('🔵 Creating coupon with data:', JSON.stringify(couponData, null, 2));
      await adminAPI.createCoupon(couponData);
      messageApi.success(`${kind === 0 ? 'One-time' : 'Annual'} coupon created: ${code}`);
      fetchCoupons();
    } catch (error: any) {
      console.error('❌ Failed to generate coupon:', error);
      messageApi.error(error.message || 'Failed to generate coupon');
    } finally {
      setCreating(false);
    }
  };

  const showModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      const formValues: any = { ...coupon };
      // API'den string olarak geliyor, 'Annual' veya 'OneTime'
      formValues.kind = coupon.kind === 1 || coupon.kind === 'Annual' ? 'Annual' : 'OneTime';
      formValues.discountType = coupon.discountType === 0 || coupon.discountType === 'percentage' ? 'percentage' : 'fixed';
      formValues.minimumAmount = coupon.minimumAmount ?? (coupon as any).minBookingAmount ?? 0;
      form.setFieldsValue(formValues);
      setIsModalOpen(true);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCoupon) {
        const createdAt = editingCoupon.validFrom ? dayjs(editingCoupon.validFrom) : dayjs();
        const isAnnual = editingCoupon.kind === 1 || editingCoupon.kind === 'Annual';
        const updateData: any = {
          description: values.description || '',
          discountValue: values.discountValue,
          minimumAmount: values.minimumAmount ?? null,
          maximumDiscount: values.maximumDiscount ?? null,
          usageLimit: isAnnual ? -1 : 1,
          isActive: values.isActive,
          validUntil: createdAt.add(1, 'year').toISOString(),
        };
        await adminAPI.updateCoupon(editingCoupon.id, updateData);
        messageApi.success('Coupon updated successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to save coupon:', error);
      messageApi.error(error.message || 'Failed to save coupon');
    }
  };

const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteCoupon(id);
      messageApi.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to delete coupon:', error);
      messageApi.error(error.message || 'Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await adminAPI.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      messageApi.success(coupon.isActive ? 'Coupon deactivated successfully' : 'Coupon activated successfully');
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to toggle coupon:', error);
      messageApi.error(error.message || 'Failed to toggle coupon status');
    }
  };

  const extendCoupon = async (coupon: Coupon) => {
    try {
      const baseDate = coupon.validUntil ? dayjs(coupon.validUntil) : dayjs(coupon.validFrom);
      const newValidUntil = baseDate.add(1, 'year').toISOString();
      await adminAPI.updateCoupon(coupon.id, { validUntil: newValidUntil, isActive: true });
      messageApi.success('Coupon extended by 1 year');
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to extend coupon:', error);
      messageApi.error(error.message || 'Failed to extend coupon');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    messageApi.success('Coupon code copied to clipboard');
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
      key: 'extend',
      icon: <ReloadOutlined />,
      label: 'Extend 1 year',
      onClick: () => extendCoupon(record),
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
      title: 'Usage Type',
      key: 'kind',
      render: (_: any, record: Coupon) => {
        const isAnnual = record.kind === 1 || record.kind === 'Annual';
        return (
          <Tag color={isAnnual ? 'green' : 'blue'}>
            {isAnnual ? 'Annual' : 'One Time'}
          </Tag>
        );
      },
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_: any, record: Coupon) => {
        const used = record.usedCount ?? record.usageCount ?? 0;
        // Annual kuponlar sınırsız, OneTime kuponlar 1 kullanım
        const isAnnual = record.kind === 1 || record.kind === 'Annual';
        const max = isAnnual ? -1 : 1;
        const percent = max === -1 ? 0 : (used / max) * 100;
        return (
          <div>
            <Text>
              {used} / {max === -1 ? '∞' : max}
            </Text>
            {max !== -1 && max && percent >= 90 && (
              <Tag color="red" style={{ marginLeft: 8 }}>Running Out</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_: any, record: Coupon) => {
        if (!record.validFrom || !record.validUntil) {
          return <Tag color="cyan">No Expiry</Tag>;
        }
        const isExpired = dayjs(record.validUntil).isBefore(dayjs());
        const isNotStarted = dayjs(record.validFrom).isAfter(dayjs());
        return (
          <div>
            <Text>{dayjs(record.validFrom).format('YYYY-MM-DD')} - {dayjs(record.validUntil).format('YYYY-MM-DD')}</Text>
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
      width: 100,
      render: (_: any, record: Coupon) => (
        <Space size="small">
          <Dropdown
            menu={{
              items: getActionItems(record),
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
          <Popconfirm
            title="Delete Coupon"
            description={`Are you sure you want to delete coupon "${record.code}"?`}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button 
              type="text" 
              size="small"
              danger 
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const inactiveCoupons = coupons.filter(c => !c.isActive).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount ?? c.usageCount ?? 0), 0);
  const totalMaxUses = coupons.reduce((sum, c) => {
    const isAnnual = c.kind === 1 || c.kind === 'Annual';
    const limit = isAnnual ? null : 1;
    if (!limit) return sum;
    return sum + limit;
  }, 0);
  const usageRate = totalMaxUses > 0 ? Math.round((totalUsage / totalMaxUses) * 100) : 0;
  const expiredCoupons = coupons.filter(c => c.validUntil && dayjs(c.validUntil).isBefore(dayjs())).length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <Title level={2} style={{ margin: 0, minWidth: '200px' }}>
          <GiftOutlined style={{ marginRight: 12 }} />
          Coupons
        </Title>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchCoupons}>
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => generateCoupon(0)}
            loading={creating}
          >
            Generate One-Time Pass
          </Button>
          <Button 
            type="primary" 
            style={{ background: '#fbbf24', borderColor: '#fbbf24' }}
            icon={<GiftOutlined />} 
            onClick={() => generateCoupon(1)}
            loading={creating}
          >
            Generate Annual Gold
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Coupons" 
              value={coupons.length}
              prefix={<GiftOutlined style={{ color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Active / Inactive" 
              value={activeCoupons}
              suffix={`/ ${inactiveCoupons}`}
              styles={{ content: { color: '#10b981' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Usage" 
              value={totalUsage}
              suffix={totalMaxUses > 0 ? `/ ${totalMaxUses}` : ''}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title={expiredCoupons > 0 ? "Expired Coupons" : "Usage Rate"}
              value={expiredCoupons > 0 ? expiredCoupons : usageRate}
              suffix={expiredCoupons > 0 ? "" : "%"}
              styles={{ content: { color: expiredCoupons > 0 ? '#ef4444' : '#f59e0b' } }}
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
          dataSource={filteredCoupons || []}
          rowKey={(record) => record.id || `coupon-${Math.random()}`}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} coupons`,
            responsive: true,
          }}
        />
      </Card>

      <Modal
        title="Edit Coupon"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText="Update"
        cancelText="Cancel"
        width={550}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            discountType: 'percentage',
            minimumAmount: 0,
            isActive: true,
          }}
        >
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} placeholder="Coupon description (optional)" />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
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
            <Col xs={24} sm={12}>
              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[{ required: true, message: 'Discount value is required' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="minimumAmount"
                label="Minimum Order Amount (€)"
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="maximumDiscount"
            label="Maximum Discount Amount (€)"
            tooltip="For percentage discounts, cap the discount amount"
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="No limit" />
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
