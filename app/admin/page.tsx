'use client';

import React from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Tag, 
  Typography, 
  Progress,
  Space,
  Avatar,
  List,
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  HomeOutlined,
  CarOutlined,
  RocketOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock data - API'den gelecek
const stats = {
  totalBookings: 1234,
  totalRevenue: 456789,
  totalCustomers: 5678,
  commission: 45678,
  bookingsGrowth: 12.5,
  revenueGrowth: 8.3,
};

const recentBookings = [
  {
    key: '1',
    id: 'BK-001234',
    customer: 'Ahmet Yılmaz',
    type: 'hotel',
    hotel: 'Grand Hotel Antalya',
    amount: 2450,
    status: 'confirmed',
    date: '2025-12-05',
  },
  {
    key: '2',
    id: 'BK-001235',
    customer: 'Mehmet Demir',
    type: 'flight',
    hotel: 'IST → AYT',
    amount: 890,
    status: 'pending',
    date: '2025-12-05',
  },
  {
    key: '3',
    id: 'BK-001236',
    customer: 'Ayşe Kaya',
    type: 'car',
    hotel: 'Ekonomik Araç - 3 Gün',
    amount: 450,
    status: 'confirmed',
    date: '2025-12-04',
  },
  {
    key: '4',
    id: 'BK-001237',
    customer: 'Fatma Şahin',
    type: 'hotel',
    hotel: 'Lara Beach Resort',
    amount: 3200,
    status: 'cancelled',
    date: '2025-12-04',
  },
  {
    key: '5',
    id: 'BK-001238',
    customer: 'Ali Öztürk',
    type: 'hotel',
    hotel: 'Bodrum Palace',
    amount: 1890,
    status: 'confirmed',
    date: '2025-12-03',
  },
];

const topDestinations = [
  { name: 'Antalya', bookings: 456, percent: 35 },
  { name: 'İstanbul', bookings: 321, percent: 25 },
  { name: 'Bodrum', bookings: 234, percent: 18 },
  { name: 'Marmaris', bookings: 156, percent: 12 },
  { name: 'Fethiye', bookings: 130, percent: 10 },
];

const statusColors: Record<string, string> = {
  confirmed: 'green',
  pending: 'orange',
  cancelled: 'red',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
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

const columns = [
  {
    title: 'Booking',
    dataIndex: 'id',
    key: 'id',
    render: (id: string, record: any) => (
      <Space>
        <Tag color={typeColors[record.type]} icon={typeIcons[record.type]}>
          {record.type.toUpperCase()}
        </Tag>
        <Text strong>{id}</Text>
      </Space>
    ),
  },
  {
    title: 'Customer',
    dataIndex: 'customer',
    key: 'customer',
    render: (name: string) => (
      <Space>
        <Avatar size="small" icon={<UserOutlined />} />
        {name}
      </Space>
    ),
  },
  {
    title: 'Details',
    dataIndex: 'hotel',
    key: 'hotel',
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount: number) => <Text strong>€{amount.toLocaleString()}</Text>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    ),
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>
      
      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={stats.totalBookings}
              prefix={<CalendarOutlined style={{ color: '#6366f1' }} />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <RiseOutlined /> {stats.bookingsGrowth}%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              suffix="€"
              styles={{ content: { color: '#10b981' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers}
              prefix={<TeamOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Commission Revenue"
              value={stats.commission}
              prefix={<ShoppingCartOutlined style={{ color: '#ec4899' }} />}
              suffix="€"
              styles={{ content: { color: '#ec4899' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts & Tables Row */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Recent Bookings */}
        <Col xs={24} lg={16}>
          <Card 
            title="Recent Bookings" 
            extra={<a href="/admin/bookings">View All</a>}
          >
            <Table 
              columns={columns} 
              dataSource={recentBookings} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Top Destinations */}
        <Col xs={24} lg={8}>
          <Card title="Popular Destinations">
            <List
              dataSource={topDestinations}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>{item.name}</Text>
                      <Text type="secondary">{item.bookings} bookings</Text>
                    </div>
                    <Progress 
                      percent={item.percent} 
                      showInfo={false} 
                      strokeColor="#6366f1"
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Row */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#3b82f6' }} icon={<HomeOutlined />} />
                <div>
                  <Text type="secondary">Hotel Bookings</Text>
                  <Title level={4} style={{ margin: 0 }}>892</Title>
                </div>
              </Space>
              <Progress percent={72} strokeColor="#3b82f6" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#8b5cf6' }} icon={<RocketOutlined />} />
                <div>
                  <Text type="secondary">Flight Bookings</Text>
                  <Title level={4} style={{ margin: 0 }}>256</Title>
                </div>
              </Space>
              <Progress percent={21} strokeColor="#8b5cf6" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#06b6d4' }} icon={<CarOutlined />} />
                <div>
                  <Text type="secondary">Car Rentals</Text>
                  <Title level={4} style={{ margin: 0 }}>86</Title>
                </div>
              </Space>
              <Progress percent={7} strokeColor="#06b6d4" />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
