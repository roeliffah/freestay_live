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
  message,
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
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  locale: string;
  status: 'active' | 'blocked';
  totalBookings: number;
  totalSpent: number;
  lastBookingAt: string;
  createdAt: string;
}

interface CustomerBooking {
  id: string;
  type: 'hotel' | 'flight' | 'car';
  title: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@gmail.com',
    phone: '+90 532 111 2233',
    locale: 'tr',
    status: 'active',
    totalBookings: 12,
    totalSpent: 15600,
    lastBookingAt: '2025-12-01',
    createdAt: '2024-06-15',
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john.smith@gmail.com',
    phone: '+1 555 123 4567',
    locale: 'en',
    status: 'active',
    totalBookings: 5,
    totalSpent: 8900,
    lastBookingAt: '2025-11-28',
    createdAt: '2024-08-20',
  },
  {
    id: '3',
    name: 'Hans Müller',
    email: 'hans@web.de',
    phone: '+49 170 123 4567',
    locale: 'de',
    status: 'blocked',
    totalBookings: 2,
    totalSpent: 2300,
    lastBookingAt: '2025-10-15',
    createdAt: '2024-09-10',
  },
  {
    id: '4',
    name: 'Maria Garcia',
    email: 'maria@outlook.es',
    phone: '+34 612 345 678',
    locale: 'es',
    status: 'active',
    totalBookings: 8,
    totalSpent: 11200,
    lastBookingAt: '2025-12-03',
    createdAt: '2024-07-05',
  },
];

const mockBookings: CustomerBooking[] = [
  { id: 'BK-001', type: 'hotel', title: 'Grand Hotel Antalya', amount: 2450, status: 'confirmed', date: '2025-12-01' },
  { id: 'BK-002', type: 'flight', title: 'IST → AYT', amount: 890, status: 'confirmed', date: '2025-11-15' },
  { id: 'BK-003', type: 'car', title: 'Ekonomik Araç - 3 Gün', amount: 450, status: 'cancelled', date: '2025-10-20' },
  { id: 'BK-004', type: 'hotel', title: 'Lara Beach Resort', amount: 3200, status: 'confirmed', date: '2025-09-10' },
];

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

const statusColors = {
  active: 'green',
  blocked: 'red',
};

const statusLabels = {
  active: 'Active',
  blocked: 'Blocked',
};

const typeIcons: Record<string, React.ReactNode> = {
  hotel: <HomeOutlined />,
  flight: <RocketOutlined />,
  car: <CarOutlined />,
};

const typeColors: Record<string, string> = {
  hotel: 'blue',
  flight: 'purple',
  car: 'cyan',
};

const bookingStatusColors: Record<string, string> = {
  confirmed: 'green',
  pending: 'orange',
  cancelled: 'red',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchText, setSearchText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const showCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const toggleBlockStatus = (customer: Customer) => {
    const newStatus = customer.status === 'active' ? 'blocked' : 'active';
    setCustomers(customers.map(c => 
      c.id === customer.id ? { ...c, status: newStatus } : c
    ));
    message.success(newStatus === 'blocked' ? 'Customer blocked' : 'Customer unblocked');
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
      onClick: () => message.info('Email sending modal will open'),
    },
    {
      type: 'divider',
    },
    {
      key: 'block',
      icon: record.status === 'active' ? <StopOutlined /> : <CheckOutlined />,
      label: record.status === 'active' ? 'Block' : 'Unblock',
      danger: record.status === 'active',
      onClick: () => {
        Modal.confirm({
          title: record.status === 'active' ? 'Block Customer' : 'Unblock Customer',
          content: record.status === 'active' 
            ? `Are you sure you want to block customer "${record.name}"?`
            : `Are you sure you want to unblock customer "${record.name}"?`,
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
      render: (_: any, record: Customer) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <Space size={4}>
              <Text strong>{record.name}</Text>
              <span>{localeFlags[record.locale]}</span>
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
    },
    {
      title: 'Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      sorter: (a: Customer, b: Customer) => a.totalBookings - b.totalBookings,
      render: (count: number) => <Badge count={count} showZero color="#6366f1" />,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      sorter: (a: Customer, b: Customer) => a.totalSpent - b.totalSpent,
      render: (amount: number) => <Text strong>€{amount.toLocaleString()}</Text>,
    },
    {
      title: 'Last Booking',
      dataIndex: 'lastBookingAt',
      key: 'lastBookingAt',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusLabels) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Blocked', value: 'blocked' },
      ],
      onFilter: (value: any, record: Customer) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Customer) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone.includes(searchText)
  );

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
            {localeFlags[selectedCustomer.locale]} {selectedCustomer.locale.toUpperCase()}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Date">{selectedCustomer.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[selectedCustomer.status]}>
              {statusLabels[selectedCustomer.status]}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'bookings',
      label: 'Bookings',
      children: (
        <List
          dataSource={mockBookings}
          renderItem={(booking) => (
            <List.Item
              extra={<Text strong>€{booking.amount}</Text>}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={typeIcons[booking.type]} 
                    style={{ backgroundColor: typeColors[booking.type] === 'blue' ? '#3b82f6' : typeColors[booking.type] === 'purple' ? '#8b5cf6' : '#06b6d4' }}
                  />
                }
                title={
                  <Space>
                    {booking.id}
                    <Tag color={bookingStatusColors[booking.status]}>{booking.status}</Tag>
                  </Space>
                }
                description={
                  <>
                    {booking.title}
                    <br />
                    <Text type="secondary">{booking.date}</Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Customers</Title>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search customers..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} customers`,
          }}
        />
      </Card>

      <Drawer
        title={selectedCustomer?.name}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={500}
        extra={
          <Button 
            danger={selectedCustomer?.status === 'active'}
            onClick={() => {
              if (selectedCustomer) {
                toggleBlockStatus(selectedCustomer);
                setDrawerOpen(false);
              }
            }}
          >
            {selectedCustomer?.status === 'active' ? 'Block' : 'Unblock'}
          </Button>
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
                    value={selectedCustomer.totalSpent}
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
