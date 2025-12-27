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
  DatePicker,
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
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  minBookingAmount: number;
  usageType: 'single' | 'annual';
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
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
  const [saving, setSaving] = useState(false);

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

  const showModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      const formValues: any = { ...coupon };
      if (coupon.validFrom && coupon.validUntil) {
        formValues.dateRange = [dayjs(coupon.validFrom), dayjs(coupon.validUntil)];
      }
      form.setFieldsValue(formValues);
    } else {
      setEditingCoupon(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      const couponData: any = {
        code: values.code,
        description: values.description || '',
        discountType: values.discountType === 'percentage' ? 0 : 1, // Convert to enum
        discountValue: values.discountValue,
        minimumAmount: values.minimumAmount || null,
        maximumDiscount: values.maximumDiscount || null,
        usageLimit: values.usageLimit || null,
        validFrom: dayjs().toISOString(),
        validUntil: dayjs().add(1, 'year').toISOString(),
      };

      // Tarih alanları girilmişse ekle
      if (values.dateRange && values.dateRange.length === 2) {
        const [validFrom, validUntil] = values.dateRange;
        couponData.validFrom = validFrom.toISOString();
        couponData.validUntil = validUntil.toISOString();
      }

      if (editingCoupon) {
        const updateData: any = {
          description: values.description || '',
          discountValue: values.discountValue,
          minimumAmount: values.minimumAmount || null,
          maximumDiscount: values.maximumDiscount || null,
          usageLimit: values.usageLimit || null,
          isActive: values.isActive,
        };
        if (values.dateRange && values.dateRange.length === 2) {
          updateData.validUntil = values.dateRange[1].toISOString();
        }
        await adminAPI.updateCoupon(editingCoupon.id, updateData);
        messageApi.success('Coupon updated successfully');
      } else {
        await adminAPI.createCoupon(couponData);
        messageApi.success('Coupon created successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchCoupons();
    } catch (error: any) {
      console.error('Failed to save coupon:', error);
      messageApi.error(error.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
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
      title: 'Usage Type',
      key: 'usageType',
      render: (_: any, record: Coupon) => (
        <Tag color={record.usageType === 'single' ? 'blue' : 'green'}>
          {record.usageType === 'single' ? 'Single Use' : 'Annual'}
        </Tag>
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
        if (!record.validFrom || !record.validUntil) {
          return <Tag color="cyan">No Expiry</Tag>;
        }
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
  const inactiveCoupons = coupons.filter(c => !c.isActive).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const totalMaxUses = coupons.reduce((sum, c) => c.maxUses === -1 ? sum : sum + c.maxUses, 0);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <GiftOutlined style={{ marginRight: 12 }} />
          Coupons
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCoupons}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            New Coupon
          </Button>
        </Space>
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
              title="Active / Inactive" 
              value={activeCoupons}
              suffix={`/ ${inactiveCoupons}`}
              styles={{ content: { color: '#10b981' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Usage" 
              value={totalUsage}
              suffix={totalMaxUses > 0 ? `/ ${totalMaxUses}` : ''}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
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
          dataSource={filteredCoupons}
          rowKey="id"
          scroll={{ x: 'max-content' }}
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
        confirmLoading={saving}
        width={550}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            discountType: 'percentage',
            usageLimit: 100,
            minimumAmount: 0,
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

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} placeholder="Coupon description (optional)" />
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
                name="usageLimit"
                label="Maximum Usage"
                tooltip="Leave empty for unlimited"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            name="dateRange"
            label="Validity Period (Optional)"
            tooltip="Leave empty for no expiry"
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
