'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Dropdown,
  Drawer,
  Descriptions,
  Tabs,
  Segmented,
  DatePicker,
  Select,
  Input,
  Timeline,
  Divider,
  Spin,
  App,
} from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  EyeOutlined,
  CloseOutlined,
  PrinterOutlined,
  MailOutlined,
  HomeOutlined,
  RocketOutlined,
  CarOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'car';
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  // Hotel specific
  hotelName?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  // Flight specific
  flightNumber?: string;
  departure?: string;
  arrival?: string;
  departureDate?: string;
  passengers?: number;
  // Car specific
  carType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  dropoffDate?: string;
  // Common
  amount: number;
  commission: number;
  couponCode?: string;
  couponDiscount?: number;
  externalBookingId?: string;
  createdAt: string;
}

// Mock data
const mockBookings: Booking[] = [
  {
    id: 'BK-001234',
    type: 'hotel',
    customer: { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@gmail.com', phone: '+90 532 111 2233' },
    status: 'confirmed',
    hotelName: 'Grand Hotel Antalya',
    roomType: 'Deluxe Sea View',
    checkIn: '2025-12-15',
    checkOut: '2025-12-20',
    guests: 2,
    amount: 2450,
    commission: 367.50,
    externalBookingId: 'SH-789456',
    createdAt: '2025-12-05 14:30',
  },
  {
    id: 'BK-001235',
    type: 'flight',
    customer: { id: '2', name: 'Mehmet Demir', email: 'mehmet@gmail.com', phone: '+90 533 222 3344' },
    status: 'pending',
    flightNumber: 'TK2234',
    departure: 'İstanbul (IST)',
    arrival: 'Antalya (AYT)',
    departureDate: '2025-12-18 08:30',
    passengers: 3,
    amount: 890,
    commission: 89,
    couponCode: 'WINTER10',
    couponDiscount: 89,
    createdAt: '2025-12-05 10:15',
  },
  {
    id: 'BK-001236',
    type: 'car',
    customer: { id: '3', name: 'Ayşe Kaya', email: 'ayse@gmail.com', phone: '+90 534 333 4455' },
    status: 'confirmed',
    carType: 'Ekonomik - Fiat Egea',
    pickupLocation: 'Antalya Havalimanı',
    dropoffLocation: 'Antalya Havalimanı',
    pickupDate: '2025-12-15 10:00',
    dropoffDate: '2025-12-18 10:00',
    amount: 450,
    commission: 67.50,
    createdAt: '2025-12-04 16:45',
  },
  {
    id: 'BK-001237',
    type: 'hotel',
    customer: { id: '4', name: 'Fatma Şahin', email: 'fatma@gmail.com', phone: '+90 535 444 5566' },
    status: 'cancelled',
    hotelName: 'Lara Beach Resort',
    roomType: 'Standard Room',
    checkIn: '2025-12-10',
    checkOut: '2025-12-14',
    guests: 4,
    amount: 3200,
    commission: 480,
    externalBookingId: 'SH-789123',
    createdAt: '2025-12-04 09:20',
  },
  {
    id: 'BK-001238',
    type: 'hotel',
    customer: { id: '5', name: 'Ali Öztürk', email: 'ali@gmail.com', phone: '+90 536 555 6677' },
    status: 'completed',
    hotelName: 'Bodrum Palace',
    roomType: 'Suite',
    checkIn: '2025-11-20',
    checkOut: '2025-11-25',
    guests: 2,
    amount: 1890,
    commission: 283.50,
    externalBookingId: 'SH-788999',
    createdAt: '2025-11-15 11:00',
  },
];

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

const typeLabels: Record<string, string> = {
  hotel: 'Hotel',
  flight: 'Flight',
  car: 'Car',
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  confirmed: { color: 'green', icon: <CheckCircleOutlined />, label: 'Confirmed' },
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  cancelled: { color: 'red', icon: <CloseCircleOutlined />, label: 'Cancelled' },
  completed: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Completed' },
};

export default function BookingsPage() {
  return (
    <App>
      <BookingsContent />
    </App>
  );
}

function BookingsContent() {
  const { message: messageApi } = App.useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, pageSize]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getBookings({ page: currentPage, pageSize });
      // Backend might return { items: [...] } or { data: [...] } or just [...]
      const bookingsArray = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
      setBookings(bookingsArray);
      setTotalCount((data as any)?.totalCount || bookingsArray.length);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      messageApi.error(error.message || 'Failed to load bookings');
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const showBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const cancelBooking = async (booking: Booking) => {
    Modal.confirm({
      title: 'Cancel Booking',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to cancel booking <strong>{booking.id}</strong>?</p>
          <p>Customer: {booking.customer.name}</p>
          <p>Amount: €{booking.amount}</p>
        </div>
      ),
      okText: 'Cancel Booking',
      okType: 'danger',
      cancelText: 'Go Back',
      onOk: async () => {
        try {
          await adminAPI.updateBookingStatus(booking.id, { status: 3, notes: 'Cancelled by admin' });
          messageApi.success('Booking cancelled successfully');
          setDrawerOpen(false);
          fetchBookings();
        } catch (error: any) {
          console.error('Failed to cancel booking:', error);
          messageApi.error(error.message || 'Failed to cancel booking');
        }
      },
    });
  };

  const getActionItems = (record: Booking): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => showBookingDetail(record),
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print Invoice',
      onClick: () => messageApi.info('Printing invoice...'),
    },
    {
      key: 'email',
      icon: <MailOutlined />,
      label: 'Send Email',
      onClick: () => messageApi.info('Sending email...'),
    },
    ...(record.status === 'confirmed' || record.status === 'pending' ? [
      { type: 'divider' as const },
      {
        key: 'cancel',
        icon: <CloseOutlined />,
        label: 'Cancel',
        danger: true,
        onClick: () => cancelBooking(record),
      },
    ] : []),
  ];

  const columns = [
    {
      title: 'Booking',
      key: 'booking',
      render: (_: any, record: Booking) => (
        <Space>
          <Tag color={typeColors[record.type]} icon={typeIcons[record.type]}>
            {typeLabels[record.type]}
          </Tag>
          <div>
            <Text strong>{record.id}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.createdAt}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: Booking) => (
        <div>
          <Text>{record.customer.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customer.email}</Text>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'detail',
      render: (_: any, record: Booking) => {
        if (record.type === 'hotel') {
          return (
            <div>
              <Text>{record.hotelName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.checkIn} → {record.checkOut}
              </Text>
            </div>
          );
        } else if (record.type === 'flight') {
          return (
            <div>
              <Text>{record.departure} → {record.arrival}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.departureDate}</Text>
            </div>
          );
        } else {
          return (
            <div>
              <Text>{record.carType}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.pickupDate?.split(' ')[0]} → {record.dropoffDate?.split(' ')[0]}
              </Text>
            </div>
          );
        }
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: Booking) => (
        <div>
          <Text strong>€{record.amount.toLocaleString()}</Text>
          <br />
          <Text type="success" style={{ fontSize: 12 }}>
            +€{record.commission} commission
          </Text>
        </div>
      ),
      sorter: (a: Booking, b: Booking) => a.amount - b.amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusConfig) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: Booking) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = typeFilter === 'all' || booking.type === typeFilter;
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    if (selectedBooking.type === 'hotel') {
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Hotel">{selectedBooking.hotelName}</Descriptions.Item>
          <Descriptions.Item label="Room Type">{selectedBooking.roomType}</Descriptions.Item>
          <Descriptions.Item label="Check-in Date">{selectedBooking.checkIn}</Descriptions.Item>
          <Descriptions.Item label="Check-out Date">{selectedBooking.checkOut}</Descriptions.Item>
          <Descriptions.Item label="Number of Guests">{selectedBooking.guests}</Descriptions.Item>
          <Descriptions.Item label="External Booking ID">{selectedBooking.externalBookingId || '-'}</Descriptions.Item>
        </Descriptions>
      );
    } else if (selectedBooking.type === 'flight') {
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Flight No">{selectedBooking.flightNumber}</Descriptions.Item>
          <Descriptions.Item label="Departure">{selectedBooking.departure}</Descriptions.Item>
          <Descriptions.Item label="Arrival">{selectedBooking.arrival}</Descriptions.Item>
          <Descriptions.Item label="Date">{selectedBooking.departureDate}</Descriptions.Item>
          <Descriptions.Item label="Number of Passengers">{selectedBooking.passengers}</Descriptions.Item>
        </Descriptions>
      );
    } else {
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Vehicle">{selectedBooking.carType}</Descriptions.Item>
          <Descriptions.Item label="Pick-up Location">{selectedBooking.pickupLocation}</Descriptions.Item>
          <Descriptions.Item label="Drop-off Location">{selectedBooking.dropoffLocation}</Descriptions.Item>
          <Descriptions.Item label="Start Date">{selectedBooking.pickupDate}</Descriptions.Item>
          <Descriptions.Item label="End Date">{selectedBooking.dropoffDate}</Descriptions.Item>
        </Descriptions>
      );
    }
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'details',
      label: 'Booking Details',
      children: renderBookingDetails(),
    },
    {
      key: 'customer',
      label: 'Customer Information',
      children: selectedBooking && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Full Name">{selectedBooking.customer.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{selectedBooking.customer.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{selectedBooking.customer.phone}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'payment',
      label: 'Payment Information',
      children: selectedBooking && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Amount">€{selectedBooking.amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Commission">€{selectedBooking.commission.toLocaleString()}</Descriptions.Item>
          {selectedBooking.couponCode && (
            <>
              <Descriptions.Item label="Coupon Code">{selectedBooking.couponCode}</Descriptions.Item>
              <Descriptions.Item label="Coupon Discount">-€{selectedBooking.couponDiscount}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="Net Amount">
            <Text strong>
              €{(selectedBooking.amount - (selectedBooking.couponDiscount || 0)).toLocaleString()}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'history',
      label: 'History',
      children: (
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Booking created</Text>
                  <br />
                  <Text type="secondary">{selectedBooking?.createdAt}</Text>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>Payment received</Text>
                  <br />
                  <Text type="secondary">{selectedBooking?.createdAt}</Text>
                </>
              ),
            },
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Confirmation email sent</Text>
                  <br />
                  <Text type="secondary">{selectedBooking?.createdAt}</Text>
                </>
              ),
            },
          ]}
        />
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
        <Title level={2} style={{ margin: 0 }}>Bookings</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchBookings}>
          Refresh
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search booking or customer..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          
          <Segmented
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as string)}
            options={[
              { label: 'All', value: 'all' },
              { label: '🏨 Hotel', value: 'hotel' },
              { label: '✈️ Flight', value: 'flight' },
              { label: '🚗 Car', value: 'car' },
            ]}
          />

          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'Completed', value: 'completed' },
            ]}
          />

          <RangePicker placeholder={['Start', 'End']} />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredBookings || []}
          rowKey={(record) => record.id || `booking-${Math.random()}`}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bookings`,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            },
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <Tag color={typeColors[selectedBooking?.type || 'hotel']} icon={typeIcons[selectedBooking?.type || 'hotel']}>
              {typeLabels[selectedBooking?.type || 'hotel']}
            </Tag>
            {selectedBooking?.id}
          </Space>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        size="large"
        extra={
          <Space>
            <Button icon={<PrinterOutlined />}>Print</Button>
            {(selectedBooking?.status === 'confirmed' || selectedBooking?.status === 'pending') && (
              <Button danger icon={<CloseOutlined />} onClick={() => selectedBooking && cancelBooking(selectedBooking)}>
                Cancel
              </Button>
            )}
          </Space>
        }
      >
        {selectedBooking && (
          <>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Tag 
                color={statusConfig[selectedBooking.status].color} 
                icon={statusConfig[selectedBooking.status].icon}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {statusConfig[selectedBooking.status].label}
              </Tag>
            </div>
            
            <Tabs items={tabItems} />
          </>
        )}
      </Drawer>
    </div>
  );
}
