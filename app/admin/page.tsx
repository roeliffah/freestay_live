'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Spin,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  HomeOutlined,
  CarOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;

interface DashboardData {
  stats: {
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    commission: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
  recentBookings: Array<{
    id: string;
    customer: string;
    type: string;
    hotel: string;
    amount: number;
    status: string;
    date: string;
  }>;
  topDestinations: Array<{
    name: string;
    bookings: number;
    percent: number;
  }>;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardData['stats'] | null>(null);
  const [recentBookings, setRecentBookings] = useState<DashboardData['recentBookings']>([]);
  const [topDestinations, setTopDestinations] = useState<DashboardData['topDestinations']>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        // Load dashboard data from single endpoint
        const dashboardData = await adminAPI.getDashboard();
        
        // Backend response kontrolü
        if (dashboardData && dashboardData.stats) {
          setStats(dashboardData.stats);
          setRecentBookings(dashboardData.recentBookings || []);
          setTopDestinations(dashboardData.topDestinations || []);
          console.log('✅ Dashboard verileri API\'den yüklendi');
        } else {
          throw new Error('Backend invalid response format');
        }
      } catch (error: any) {
        console.error('🚫 Dashboard yükleme hatası:', error);
        
        // Don't show error or mock data if session expired - user will be redirected
        if (error.message?.includes('Session expired')) {
          return;
        }
        
        // For other errors, redirect to login as well for security
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        document.cookie = 'admin_token=; path=/; max-age=0';
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">Failed to load dashboard data</Text>
      </div>
    );
  }

  const { stats: statsData, recentBookings: bookingsData, topDestinations: destinationsData } = {
    stats,
    recentBookings,
    topDestinations,
  };

  const bookingColumns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const icons = {
          hotel: <HomeOutlined />,
          flight: <RocketOutlined />,
          car: <CarOutlined />,
        };
        return (
          <Space>
            {icons[type as keyof typeof icons] || <CalendarOutlined />}
            <Text style={{ textTransform: 'capitalize' }}>{type}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Service',
      dataIndex: 'hotel',
      key: 'hotel',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>₺{amount.toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          confirmed: { color: 'green', text: 'Confirmed' },
          pending: { color: 'orange', text: 'Pending' },
          cancelled: { color: 'red', text: 'Cancelled' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>
      
      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={statsData.totalBookings}
              prefix={<CalendarOutlined style={{ color: '#6366f1' }} />}
              suffix={
                <Text type="success" style={{ fontSize: 14 }}>
                  <RiseOutlined /> {statsData.bookingsGrowth}%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={statsData.totalRevenue}
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
              value={statsData.totalCustomers}
              prefix={<TeamOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Commission Revenue"
              value={statsData.commission}
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
            extra={<Link href="/admin/bookings">View All</Link>}
          >
            <Table 
              columns={bookingColumns} 
              dataSource={bookingsData} 
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        {/* Top Destinations */}
        <Col xs={24} lg={8}>
          <Card title="Popular Destinations">
            <div className="space-y-4">
              {destinationsData.map((item, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>{item.name}</Text>
                    <Text type="secondary">{item.bookings} bookings</Text>
                  </div>
                  <Progress 
                    percent={item.percent} 
                    showInfo={false} 
                    strokeColor="#6366f1"
                    size="small"
                  />
                </div>
              ))}
            </div>
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
                  <Text strong>Hotel Bookings</Text>
                  <br />
                  <Text type="secondary">Most popular service</Text>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#10b981' }} icon={<RocketOutlined />} />
                <div>
                  <Text strong>Flight Bookings</Text>
                  <br />
                  <Text type="secondary">Growing rapidly</Text>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#f59e0b' }} icon={<CarOutlined />} />
                <div>
                  <Text strong>Car Rentals</Text>
                  <br />
                  <Text type="secondary">Steady demand</Text>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
