'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  App,
  Input,
  Typography,
  Avatar,
  Dropdown,
  Drawer,
  Descriptions,
  Tabs,
  List,
  Statistic,
  Row,
  Col,
  Badge,
  Switch,
} from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EyeOutlined,
  StopOutlined,
  CheckOutlined,
  CalendarOutlined,
  DollarOutlined,
  HomeOutlined,
  RocketOutlined,
  CarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  locale: string;
  isBlocked: boolean;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string | null;
  createdAt: string;
  notes?: string;
}

interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  locale: string;
  isBlocked: boolean;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string | null;
  createdAt: string;
  notes?: string;
}

interface CustomerBooking {
  id: string;
  type: number; // 0=Hotel, 1=Flight, 2=Car
  hotelName?: string;
  flightInfo?: string;
  carInfo?: string;
  amount: number;
  status: number; // 0=Pending, 1=Confirmed, 2=Cancelled, 3=Completed
  checkInDate?: string;
  checkOutDate?: string;
  createdAt: string;
}

const localeFlags: Record<string, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  nl: '🇳🇱',
  it: '🇮🇹',
  ru: '🇷🇺',
  el: '🇬🇷',
};

const typeIcons: Record<number, React.ReactNode> = {
  0: <HomeOutlined />,
  1: <RocketOutlined />,
  2: <CarOutlined />,
};

const typeColors: Record<number, string> = {
  0: 'blue',
  1: 'purple',
  2: 'cyan',
};

const typeLabels: Record<number, string> = {
  0: 'Hotel',
  1: 'Flight',
  2: 'Car',
};

const bookingStatusColors: Record<number, string> = {
  0: 'orange',
  1: 'green',
  2: 'red',
  3: 'blue',
};

const bookingStatusLabels: Record<number, string> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Cancelled',
  3: 'Completed',
};

export default function CustomersPage() {
  return (
    <App>
      <CustomersContent />
    </App>
  );
}

function CustomersContent() {
  const { message, modal } = App.useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCustomers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText || undefined,
      });

      // Map API response to UI format
      const mappedCustomers: Customer[] = (response as any).items.map((item: ApiCustomer) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        locale: item.locale,
        isBlocked: item.isBlocked,
        totalBookings: item.totalBookings,
        totalSpent: item.totalSpent,
        lastBookingAt: item.lastBookingAt,
        createdAt: item.createdAt,
        notes: item.notes,
      }));

      setCustomers(mappedCustomers);
      setPagination(prev => ({
        ...prev,
        total: (response as any).totalCount,
      }));
    } catch (error: any) {
      console.error('❌ Load customers error:', error);
      message.error(error.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerBookings = async (customerId: string) => {
    try {
      setLoadingBookings(true);
      const response = await adminAPI.getCustomerBookings(customerId);
      setCustomerBookings((response as any).items || []);
    } catch (error: any) {
      console.error('❌ Load bookings error:', error);
      message.error('Failed to load customer bookings');
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const showCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
    loadCustomerBookings(customer.id);
  };

  const toggleBlockStatus = async (customer: Customer) => {
    try {
      const newStatus = !customer.isBlocked;
      await adminAPI.updateCustomer(customer.id, {
        isBlocked: newStatus,
        blockReason: newStatus ? 'Blocked by admin' : undefined,
      });

      // Update local state
      setCustomers(customers.map(c =>
        c.id === customer.id ? { ...c, isBlocked: newStatus } : c
      ));

      // Update selected customer if open
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer({ ...customer, isBlocked: newStatus });
      }

      message.success(newStatus ? 'Customer blocked successfully' : 'Customer unblocked successfully');
    } catch (error: any) {
      console.error('❌ Block status update error:', error);
      message.error(error.message || 'Failed to update customer status');
    }
  };

  const getActionItems = (record: Customer): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => showCustomerDetail(record),
    },
    {
      key: 'email',
      icon: <MailOutlined />,
      label: 'Send Email',
      onClick: () => message.info('Email feature coming soon'),
    },
    {
      type: 'divider',
    },
    {
      key: 'block',
      icon: record.isBlocked ? <CheckOutlined /> : <StopOutlined />,
      label: record.isBlocked ? 'Unblock' : 'Block',
      danger: !record.isBlocked,
      onClick: () => {
        modal.confirm({
          title: record.isBlocked ? 'Unblock Customer' : 'Block Customer',
          content: record.isBlocked
            ? `Are you sure you want to unblock "${record.name}"?`
            : `Are you sure you want to block "${record.name}"?`,
          okText: 'Yes',
          cancelText: 'Cancel',
          onOk: () => toggleBlockStatus(record),
        });
      },
    },
  ];

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      fixed: 'left' as const,
      width: 280,
      render: (_: any, record: Customer) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Space size={4}>
              <Text strong>{record.name}</Text>
              <span>{localeFlags[record.locale] || '🌐'}</span>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      width: 110,
      sorter: (a: Customer, b: Customer) => a.totalBookings - b.totalBookings,
      render: (count: number) => <Badge count={count} showZero color="#6366f1" />,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 120,
      sorter: (a: Customer, b: Customer) => a.totalSpent - b.totalSpent,
      render: (amount: number) => <Text strong>€{amount.toFixed(2)}</Text>,
    },
    {
      title: 'Last Booking',
      dataIndex: 'lastBookingAt',
      key: 'lastBookingAt',
      width: 130,
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      width: 100,
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? 'Blocked' : 'Active'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: false },
        { text: 'Blocked', value: true },
      ],
      onFilter: (value: any, record: Customer) => record.isBlocked === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 80,
      render: (_: any, record: Customer) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total,
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'info',
      label: 'Information',
      children: selectedCustomer && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Full Name">{selectedCustomer.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedCustomer.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{selectedCustomer.phone}</Descriptions.Item>
          <Descriptions.Item label="Language">
            {localeFlags[selectedCustomer.locale] || '🌐'} {selectedCustomer.locale?.toUpperCase() || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">
            {new Date(selectedCustomer.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={selectedCustomer.isBlocked ? 'red' : 'green'}>
              {selectedCustomer.isBlocked ? 'Blocked' : 'Active'}
            </Tag>
          </Descriptions.Item>
          {selectedCustomer.notes && (
            <Descriptions.Item label="Notes">{selectedCustomer.notes}</Descriptions.Item>
          )}
        </Descriptions>
      ),
    },
    {
      key: 'bookings',
      label: `Bookings (${customerBookings.length})`,
      children: loadingBookings ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading bookings...</div>
      ) : customerBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No bookings yet
        </div>
      ) : (
        <List
          dataSource={customerBookings}
          renderItem={(booking) => {
            const title = booking.hotelName || booking.flightInfo || booking.carInfo || 'Booking';
            const date = booking.checkInDate || booking.createdAt;
            
            return (
              <List.Item extra={<Text strong>€{booking.amount.toFixed(2)}</Text>}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={typeIcons[booking.type]}
                      style={{
                        backgroundColor:
                          typeColors[booking.type] === 'blue'
                            ? '#3b82f6'
                            : typeColors[booking.type] === 'purple'
                            ? '#8b5cf6'
                            : '#06b6d4',
                      }}
                    />
                  }
                  title={
                    <Space>
                      {booking.id}
                      <Tag color={typeColors[booking.type]}>{typeLabels[booking.type]}</Tag>
                      <Tag color={bookingStatusColors[booking.status]}>
                        {bookingStatusLabels[booking.status]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <>
                      {title}
                      <br />
                      <Text type="secondary">
                        {new Date(date).toLocaleDateString()}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            );
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Customers</Title>
          <Text type="secondary">Manage customer accounts and bookings</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadCustomers}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name, email or phone..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 350 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={customers || []}
          rowKey={(record) => record.id || `customer-${Math.random()}`}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} customers`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title={selectedCustomer?.name}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        size="large"
        extra={
          selectedCustomer && (
            <Space>
              <Switch
                checked={!selectedCustomer.isBlocked}
                onChange={() => toggleBlockStatus(selectedCustomer)}
                checkedChildren="Active"
                unCheckedChildren="Blocked"
              />
            </Space>
          )
        }
      >
        {selectedCustomer && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Total Bookings"
                    value={selectedCustomer.totalBookings}
                    prefix={<CalendarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Total Spent"
                    value={selectedCustomer.totalSpent.toFixed(2)}
                    prefix={<DollarOutlined />}
                    suffix="€"
                  />
                </Card>
              </Col>
            </Row>

            <Tabs items={tabItems} />
          </>
        )}
      </Drawer>
    </div>
  );
}
