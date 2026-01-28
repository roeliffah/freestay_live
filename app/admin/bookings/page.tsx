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
  Badge,
  Alert,
  Statistic,
  Row,
  Col,
  Tooltip,
  InputNumber,
  Form,
  Radio,
  Popconfirm,
  Checkbox,
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
  UndoOutlined,
  WarningOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Customer {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface HotelBooking {
  id?: string;
  hotelId?: string;
  externalHotelId?: number;
  hotelName?: string;
  roomId?: number;
  roomTypeId?: string;
  roomTypeName?: string;
  boardTypeId?: string;
  boardTypeName?: string;
  mealId?: number;
  mealName?: string; // Alternative to boardTypeName
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number; // Number of rooms
  guestFirstName?: string;
  guestLastName?: string;
  guestName?: string; // Combined guest name
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  preBookCode?: string;
  externalBookingCode?: string;
  sunhotelsBookingCode?: string; // SunHotels booking reference
  confirmationCode?: string;
  hotelConfirmationNumber?: string;
  voucher?: string;
  invoiceRef?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  hotelNotes?: string;
  isSuperDeal?: boolean;
  sunHotelsBookingDate?: string;
  confirmationEmailSent?: boolean;
  confirmationEmailSentAt?: string;
  // Price details
  totalPrice?: number;
  taxAmount?: number;
  currency?: string;
  // Cancellation policy fields
  isRefundable?: boolean;
  freeCancellationDeadline?: string;
  cancellationPercentage?: number;
  maxRefundableAmount?: number;
  cancellationPolicyText?: string;
  cancellationPolicies?: string;
}

interface Payment {
  id?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripePaymentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paidAt?: string;
  failureReason?: string;
}

// Failed confirmation item from API
interface FailedConfirmation {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  externalHotelId: number;
  roomId: number;
  roomTypeName: string;
  mealId: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  preBookCode?: string;
  isSuperDeal: boolean;
  specialRequests?: string;
  totalPrice: number;
  currency: string;
  paymentAmount: number;
  paymentStatus: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  canRetry: boolean;
  canRefund: boolean;
  // Cancellation policy fields
  isRefundable: boolean;
  freeCancellationDeadline?: string;
  cancellationPercentage: number;
  maxRefundableAmount: number;
  cancellationPolicyText?: string;
}

interface Booking {
  id: string;
  userId?: string;
  type: string; // 'Hotel' | 'Flight' | 'Car'
  status: string; // 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed'
  totalPrice: number;
  commission: number;
  currency?: string;
  couponDiscount?: number;
  notes?: string;
  createdAt: string;
  // Nested objects from API
  hotelBooking?: HotelBooking | null;
  flightBooking?: any | null;
  carRental?: any | null;
  payment?: Payment | null;
  // Legacy customer field (for backwards compatibility)
  customer?: Customer;
  // Legacy fields
  amount?: number;
  couponCode?: string;
  externalBookingId?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  hotel: <HomeOutlined />,
  Hotel: <HomeOutlined />,
  flight: <RocketOutlined />,
  Flight: <RocketOutlined />,
  car: <CarOutlined />,
  Car: <CarOutlined />,
};

const typeColors: Record<string, string> = {
  hotel: 'blue',
  Hotel: 'blue',
  flight: 'purple',
  Flight: 'purple',
  car: 'cyan',
  Car: 'cyan',
};

const typeLabels: Record<string, string> = {
  hotel: 'Hotel',
  Hotel: 'Hotel',
  flight: 'Flight',
  Flight: 'Flight',
  car: 'Car',
  Car: 'Car',
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  confirmed: { color: 'green', icon: <CheckCircleOutlined />, label: 'Confirmed' },
  Confirmed: { color: 'green', icon: <CheckCircleOutlined />, label: 'Confirmed' },
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  Pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  cancelled: { color: 'red', icon: <CloseCircleOutlined />, label: 'Cancelled' },
  Cancelled: { color: 'red', icon: <CloseCircleOutlined />, label: 'Cancelled' },
  completed: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Completed' },
  Completed: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Completed' },
  failed: { color: 'red', icon: <CloseCircleOutlined />, label: 'Failed' },
  Failed: { color: 'red', icon: <CloseCircleOutlined />, label: 'Failed' },
  refunded: { color: 'purple', icon: <DollarOutlined />, label: 'Refunded' },
  Refunded: { color: 'purple', icon: <DollarOutlined />, label: 'Refunded' },
  confirmationfailed: { color: 'volcano', icon: <ExclamationCircleOutlined />, label: 'Confirmation Failed' },
  ConfirmationFailed: { color: 'volcano', icon: <ExclamationCircleOutlined />, label: 'Confirmation Failed' },
};

// Helper functions to get customer info from booking
const getCustomerName = (record: Booking): string => {
  if (record.customer?.name) return record.customer.name;
  if (record.hotelBooking) {
    // Check for combined guestName first
    if (record.hotelBooking.guestName) return record.hotelBooking.guestName;
    const firstName = record.hotelBooking.guestFirstName || '';
    const lastName = record.hotelBooking.guestLastName || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  }
  return 'N/A';
};

const getCustomerEmail = (record: Booking): string => {
  if (record.customer?.email) return record.customer.email;
  if (record.hotelBooking?.guestEmail) return record.hotelBooking.guestEmail;
  return 'N/A';
};

const getCustomerPhone = (record: Booking): string => {
  if (record.customer?.phone) return record.customer.phone;
  if (record.hotelBooking?.guestPhone) return record.hotelBooking.guestPhone;
  return 'N/A';
};

const getBookingAmount = (record: Booking): number => {
  return record.totalPrice ?? record.amount ?? 0;
};

export default function BookingsPage() {
  return (
    <App>
      <BookingsContent />
    </App>
  );
}

function BookingsContent() {
  const { message: messageApi, modal } = App.useApp();
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
  
  // New state for stats and failed confirmations
  const [stats, setStats] = useState<any>(null);
  const [failedConfirmations, setFailedConfirmations] = useState<any[]>([]);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundForm] = Form.useForm();

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [currentPage, pageSize, showFailedOnly, statusFilter, searchText]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (showFailedOnly) {
        const data = await adminAPI.getFailedConfirmations({ page: currentPage, pageSize });
        const bookingsArray = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
        setFailedConfirmations(bookingsArray);
        setBookings(bookingsArray);
        setTotalCount((data as any)?.total || (data as any)?.totalCount || bookingsArray.length);
      } else {
        const params: any = { page: currentPage, pageSize };
        if (statusFilter) params.status = statusFilter;
        if (searchText) params.search = searchText;
        
        const data = await adminAPI.getBookings(params);
        const bookingsArray = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
        setBookings(bookingsArray);
        setTotalCount((data as any)?.total || (data as any)?.totalCount || bookingsArray.length);
      }
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      messageApi.error(error.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getBookingStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRetrySunHotels = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const result = await adminAPI.retrySunHotelsBooking(bookingId, {
        customerCountry: 'TR',
        sendConfirmationEmail: true,
      });
      
      if ((result as any).success) {
        messageApi.success(`SunHotels booking confirmed! Code: ${(result as any).confirmationCode}`);
        fetchBookings();
        fetchStats();
      } else {
        messageApi.error((result as any).message || 'Retry failed');
      }
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to retry SunHotels booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (bookingId: string, values: any) => {
    setActionLoading(bookingId);
    try {
      const result = await adminAPI.refundBooking(bookingId, {
        amount: values.amount || undefined,
        reason: values.reason || 'requested_by_customer',
        adminNote: values.adminNote,
        sendRefundEmail: values.sendRefundEmail ?? true,
        forceRefund: values.forceRefund ?? false,
      });
      
      if ((result as any).success) {
        // Check for policy warnings
        if ((result as any).policyInfo?.warning) {
          messageApi.warning((result as any).policyInfo.warning, 8);
        }
        messageApi.success(`Refund processed! Amount: €${(result as any).refundAmount}`);
        setRefundModalOpen(false);
        refundForm.resetFields();
        fetchBookings();
        fetchStats();
      } else {
        // Handle non-refundable warning
        if ((result as any).warning) {
          modal.warning({
            title: 'Non-Refundable Booking',
            content: (
              <div>
                <p>{(result as any).warning}</p>
                <p style={{ marginTop: 8 }}>
                  <strong>Cancellation Policy:</strong> {(result as any).cancellationPolicy}
                </p>
                <p style={{ marginTop: 8 }}>
                  <strong>Recommended Refund:</strong> €{(result as any).recommendedRefundAmount}
                </p>
              </div>
            ),
            okText: 'Understood',
          });
        } else {
          messageApi.error((result as any).message || 'Refund failed');
        }
      }
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to process refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSunHotels = async (bookingId: string, processRefund: boolean) => {
    setActionLoading(bookingId);
    try {
      const result = await adminAPI.cancelSunHotelsBooking(bookingId, { processRefund });
      
      if ((result as any).success) {
        messageApi.success('SunHotels booking cancelled successfully');
        if ((result as any).cancellationFee > 0) {
          messageApi.info(`Cancellation fee: €${(result as any).cancellationFee}`);
        }
        fetchBookings();
        fetchStats();
      } else {
        messageApi.error((result as any).message || 'Cancellation failed');
      }
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to cancel SunHotels booking');
    } finally {
      setActionLoading(null);
    }
  };

  const showBookingDetail = async (booking: Booking) => {
    try {
      // Fetch full booking details
      const detail = await adminAPI.getBookingDetail(booking.id);
      setSelectedBooking(detail as any);
    } catch (error) {
      setSelectedBooking(booking);
    }
    setDrawerOpen(true);
  };

  const cancelBooking = async (booking: Booking) => {
    try {
      await adminAPI.updateBookingStatus(booking.id, { status: 3, notes: 'Cancelled by admin' });
      messageApi.success('Booking cancelled successfully');
      setDrawerOpen(false);
      fetchBookings();
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      messageApi.error(error.message || 'Failed to cancel booking');
    }
  };

  const getActionItems = (record: Booking): MenuProps['items'] => {
    const isConfirmationFailed = record.status === 'ConfirmationFailed' || record.status === 'confirmationfailed';
    const canRetry = isConfirmationFailed && (record as any).canRetry !== false;
    const canRefund = (record as any).canRefund !== false && (record as any).payment?.stripePaymentIntentId;
    
    return [
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
      // Retry SunHotels for ConfirmationFailed
      ...(canRetry ? [
        { type: 'divider' as const },
        {
          key: 'retry',
          icon: <ReloadOutlined />,
          label: 'Retry SunHotels',
          onClick: () => {
            // Open drawer for confirmation via Popconfirm
            showBookingDetail(record);
          },
        },
      ] : []),
      // Refund option
      ...(canRefund ? [
        {
          key: 'refund',
          icon: <UndoOutlined />,
          label: 'Process Refund',
          onClick: () => {
            setSelectedBooking(record);
            setRefundModalOpen(true);
          },
        },
      ] : []),
      // Cancel SunHotels booking
      ...(record.status === 'Confirmed' || record.status === 'confirmed' ? [
        { type: 'divider' as const },
        {
          key: 'cancel-sunhotels',
          icon: <StopOutlined />,
          label: 'Cancel SunHotels Booking',
          danger: true,
          onClick: () => {
            // Open drawer for confirmation via Popconfirm
            showBookingDetail(record);
          },
        },
      ] : []),
      // Legacy cancel for pending
      ...(record.status === 'pending' || record.status === 'Pending' ? [
        { type: 'divider' as const },
        {
          key: 'cancel',
          icon: <CloseOutlined />,
          label: 'Cancel Booking',
          danger: true,
          onClick: () => {
            // Open drawer for confirmation via Popconfirm
            showBookingDetail(record);
          },
        },
      ] : []),
    ];
  };

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
          <Text>{getCustomerName(record)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{getCustomerEmail(record)}</Text>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'detail',
      render: (_: any, record: Booking) => {
        const type = record.type?.toLowerCase();
        if (type === 'hotel') {
          const hotelName = record.hotelBooking?.hotelName || 'N/A';
          const checkIn = record.hotelBooking?.checkIn?.split('T')[0] || 'N/A';
          const checkOut = record.hotelBooking?.checkOut?.split('T')[0] || 'N/A';
          return (
            <div>
              <Text>{hotelName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {checkIn} → {checkOut}
              </Text>
            </div>
          );
        } else if (type === 'flight') {
          const departure = record.flightBooking?.departure || 'N/A';
          const arrival = record.flightBooking?.arrival || 'N/A';
          const date = record.flightBooking?.departureDate || 'N/A';
          return (
            <div>
              <Text>{departure} → {arrival}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>{date}</Text>
            </div>
          );
        } else if (type === 'car') {
          const carType = record.carRental?.carType || 'N/A';
          const pickupDate = record.carRental?.pickupDate?.split('T')[0] || 'N/A';
          const dropoffDate = record.carRental?.dropoffDate?.split('T')[0] || 'N/A';
          return (
            <div>
              <Text>{carType}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {pickupDate} → {dropoffDate}
              </Text>
            </div>
          );
        } else {
          return <Text type="secondary">-</Text>;
        }
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: Booking) => (
        <div>
          <Text strong>{record.currency || '€'}{getBookingAmount(record).toLocaleString()}</Text>
          <br />
          <Text type="success" style={{ fontSize: 12 }}>
            +{record.currency || '€'}{(record.commission || 0).toLocaleString()} commission
          </Text>
        </div>
      ),
      sorter: (a: Booking, b: Booking) => getBookingAmount(a) - getBookingAmount(b),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', icon: null, label: status };
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
    const customerName = getCustomerName(booking).toLowerCase();
    const customerEmail = getCustomerEmail(booking).toLowerCase();
    const searchLower = searchText.toLowerCase();
    
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchLower) ||
      customerName.includes(searchLower) ||
      customerEmail.includes(searchLower);
    
    const bookingType = booking.type?.toLowerCase();
    const matchesType = typeFilter === 'all' || bookingType === typeFilter.toLowerCase();
    
    const bookingStatus = booking.status?.toLowerCase();
    const matchesStatus = !statusFilter || bookingStatus === statusFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    const type = selectedBooking.type?.toLowerCase();
    
    if (type === 'hotel') {
      const hb = selectedBooking.hotelBooking;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Hotel">{hb?.hotelName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Room Type">{hb?.roomTypeName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Board Type">{hb?.boardTypeName || hb?.mealName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Number of Rooms">{hb?.rooms || 1}</Descriptions.Item>
          <Descriptions.Item label="Check-in Date">{hb?.checkIn?.split('T')[0] || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Check-out Date">{hb?.checkOut?.split('T')[0] || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Adults">{hb?.adults || 0}</Descriptions.Item>
          <Descriptions.Item label="Children">{hb?.children || 0}</Descriptions.Item>
          <Descriptions.Item label="Guest Name">
            {hb?.guestName || (hb?.guestFirstName && hb?.guestLastName ? `${hb.guestFirstName} ${hb.guestLastName}` : 'N/A')}
          </Descriptions.Item>
          <Descriptions.Item label="Guest Email">{hb?.guestEmail || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Guest Phone">{hb?.guestPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Special Requests">{hb?.specialRequests || '-'}</Descriptions.Item>
          <Descriptions.Item label="SunHotels Booking Code">
            <Text copyable={!!hb?.sunhotelsBookingCode}>
              {hb?.sunhotelsBookingCode || hb?.externalBookingCode || '-'}
            </Text>
          </Descriptions.Item>
          {hb?.hotelConfirmationNumber && (
            <Descriptions.Item label="Hotel Confirmation #">
              <Text copyable>{hb.hotelConfirmationNumber}</Text>
            </Descriptions.Item>
          )}
          {hb?.totalPrice && (
            <Descriptions.Item label="Room Price">
              {hb.currency || '€'}{hb.totalPrice.toLocaleString()}
              {hb.taxAmount && ` (Tax: ${hb.currency || '€'}${hb.taxAmount.toLocaleString()})`}
            </Descriptions.Item>
          )}
          {hb?.voucher && (
            <Descriptions.Item label="Voucher">
              <a href={hb.voucher} target="_blank" rel="noopener noreferrer">View Voucher</a>
            </Descriptions.Item>
          )}
        </Descriptions>
      );
    } else if (type === 'flight') {
      const fb = selectedBooking.flightBooking;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Flight No">{fb?.flightNumber || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Departure">{fb?.departure || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Arrival">{fb?.arrival || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Date">{fb?.departureDate || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Number of Passengers">{fb?.passengers || 0}</Descriptions.Item>
        </Descriptions>
      );
    } else if (type === 'car') {
      const cr = selectedBooking.carRental;
      return (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Vehicle">{cr?.carType || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Pick-up Location">{cr?.pickupLocation || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Drop-off Location">{cr?.dropoffLocation || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Start Date">{cr?.pickupDate?.split('T')[0] || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="End Date">{cr?.dropoffDate?.split('T')[0] || 'N/A'}</Descriptions.Item>
        </Descriptions>
      );
    } else {
      return <Text type="secondary">No details available</Text>;
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
          <Descriptions.Item label="Full Name">{getCustomerName(selectedBooking)}</Descriptions.Item>
          <Descriptions.Item label="Email">{getCustomerEmail(selectedBooking)}</Descriptions.Item>
          <Descriptions.Item label="Phone">{getCustomerPhone(selectedBooking)}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'payment',
      label: 'Payment Information',
      children: selectedBooking && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Amount">{selectedBooking.currency || '€'}{getBookingAmount(selectedBooking).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Commission">{selectedBooking.currency || '€'}{(selectedBooking.commission || 0).toLocaleString()}</Descriptions.Item>
          {(selectedBooking.couponDiscount && selectedBooking.couponDiscount > 0) && (
            <Descriptions.Item label="Coupon Discount">-{selectedBooking.currency || '€'}{selectedBooking.couponDiscount}</Descriptions.Item>
          )}
          <Descriptions.Item label="Net Amount">
            <Text strong>
              {selectedBooking.currency || '€'}{(getBookingAmount(selectedBooking) - (selectedBooking.couponDiscount || 0)).toLocaleString()}
            </Text>
          </Descriptions.Item>
          {selectedBooking.payment && (
            <>
              <Descriptions.Item label="Payment Status">
                <Tag color={selectedBooking.payment.status === 'Paid' ? 'green' : 'orange'}>
                  {selectedBooking.payment.status || 'Unknown'}
                </Tag>
              </Descriptions.Item>
              {selectedBooking.payment.paidAt && (
                <Descriptions.Item label="Paid At">{selectedBooking.payment.paidAt}</Descriptions.Item>
              )}
            </>
          )}
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
              content: (
                <>
                  <Text strong>Booking created</Text>
                  <br />
                  <Text type="secondary">{selectedBooking?.createdAt}</Text>
                </>
              ),
            },
            {
              color: 'blue',
              content: (
                <>
                  <Text strong>Payment received</Text>
                  <br />
                  <Text type="secondary">{selectedBooking?.createdAt}</Text>
                </>
              ),
            },
            {
              color: 'green',
              content: (
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
    // Cancellation Policy Tab (only for hotel bookings)
    ...(selectedBooking?.type?.toLowerCase() === 'hotel' && selectedBooking.hotelBooking ? [{
      key: 'policy',
      label: (
        <Space>
          <span>Cancellation Policy</span>
          {selectedBooking.hotelBooking.isRefundable === false && (
            <Tag color="red" style={{ marginLeft: 4 }}>Non-Refundable</Tag>
          )}
        </Space>
      ),
      children: (
        <div>
          {selectedBooking.hotelBooking.isRefundable === false ? (
            <Alert
              title="Non-Refundable Booking"
              description="This booking cannot be refunded. If you process a refund, the company will absorb 100% of the cost as SunHotels will charge full cancellation fee."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : selectedBooking.hotelBooking.freeCancellationDeadline ? (
            <Alert
              title={
                new Date(selectedBooking.hotelBooking.freeCancellationDeadline) > new Date()
                  ? `Free Cancellation until ${dayjs(selectedBooking.hotelBooking.freeCancellationDeadline).format('DD MMM YYYY HH:mm')}`
                  : `Free Cancellation Period Ended on ${dayjs(selectedBooking.hotelBooking.freeCancellationDeadline).format('DD MMM YYYY')}`
              }
              type={new Date(selectedBooking.hotelBooking.freeCancellationDeadline) > new Date() ? 'success' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : null}
          
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Refundable">
              <Tag color={selectedBooking.hotelBooking.isRefundable !== false ? 'green' : 'red'}>
                {selectedBooking.hotelBooking.isRefundable !== false ? 'Yes' : 'No (Non-Refundable)'}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.hotelBooking.freeCancellationDeadline && (
              <Descriptions.Item label="Free Cancellation Until">
                {dayjs(selectedBooking.hotelBooking.freeCancellationDeadline).format('DD MMM YYYY HH:mm')}
                {new Date(selectedBooking.hotelBooking.freeCancellationDeadline) < new Date() && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>Expired</Tag>
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Current Cancellation Fee">
              <Text type={(selectedBooking.hotelBooking.cancellationPercentage ?? 0) > 0 ? 'danger' : 'success'}>
                {selectedBooking.hotelBooking.cancellationPercentage ?? 0}%
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Max Refundable Amount">
              <Text strong style={{ color: (selectedBooking.hotelBooking.maxRefundableAmount ?? 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                €{(selectedBooking.hotelBooking.maxRefundableAmount ?? 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
            {selectedBooking.hotelBooking.cancellationPolicyText && (
              <Descriptions.Item label="Policy Details">
                <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedBooking.hotelBooking.cancellationPolicyText}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    }] : []),
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Bookings</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchBookings(); fetchStats(); }}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue || 0}
                prefix="€"
                precision={2}
                styles={{ content: { color: '#3f8600' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Refunded"
                value={stats.totalRefunded || 0}
                prefix="€"
                precision={2}
                styles={{ content: { color: '#cf1322' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Confirmed"
                value={stats.byStatus?.find((s: any) => s.status === 'Confirmed')?.count || 0}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Badge count={stats.needsAttention || 0} offset={[10, 0]}>
                <Statistic
                  title="Needs Attention"
                  value={stats.failedConfirmations || 0}
                  styles={{ content: { color: stats.failedConfirmations > 0 ? '#fa541c' : undefined } }}
                />
              </Badge>
            </Card>
          </Col>
        </Row>
      )}

      {/* Failed Confirmations Alert */}
      {stats?.failedConfirmations > 0 && (
        <Alert
          title={
            <Space>
              <WarningOutlined />
              <span>
                <strong>{stats.failedConfirmations}</strong> booking(s) need attention - Payment received but SunHotels confirmation failed
              </span>
            </Space>
          }
          type="warning"
          showIcon={false}
          action={
            <Button 
              size="small" 
              type={showFailedOnly ? 'primary' : 'default'}
              onClick={() => setShowFailedOnly(!showFailedOnly)}
            >
              {showFailedOnly ? 'Show All' : 'View Failed'}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Space style={{ marginBottom: 16, width: '100%' }} wrap orientation="vertical" size="middle">
          <Input
            placeholder="Search booking or customer..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: '100%' }}
            allowClear
          />
          
          <Space wrap style={{ width: '100%' }}>
            <Segmented
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as string)}
              options={[
                { label: 'All', value: 'all' },
                { label: '🏨 Hotel', value: 'hotel' },
                { label: '✈️ Flight', value: 'flight' },
                { label: '🚗 Car', value: 'car' },
              ]}
              style={{ maxWidth: '100%' }}
            />

            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150, minWidth: 120 }}
              allowClear
              options={[
                { label: 'Confirmed', value: 'Confirmed' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Cancelled', value: 'Cancelled' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Failed', value: 'Failed' },
                { label: 'Refunded', value: 'Refunded' },
                { label: '⚠️ Confirmation Failed', value: 'ConfirmationFailed' },
              ]}
            />

            <RangePicker placeholder={['Start', 'End']} style={{ maxWidth: '100%' }} />
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredBookings || []}
          rowKey={(record) => record.id || `booking-${Math.random()}`}
          scroll={{ x: 800 }}
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
            responsive: true,
          }}
        />
      </Card>
      
      <style jsx global>{`
        @media (max-width: 768px) {
          .bookings-page .ant-card {
            padding: 12px;
          }
          .bookings-page .ant-table {
            font-size: 12px;
          }
          .bookings-page .ant-segmented {
            display: flex;
            flex-wrap: wrap;
          }
        }
      `}</style>

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
          <Space wrap>
            <Button icon={<PrinterOutlined />}>Print</Button>
            {/* Retry button for ConfirmationFailed */}
            {(selectedBooking?.status === 'ConfirmationFailed' || selectedBooking?.status === 'confirmationfailed') && (
              <Popconfirm
                title="Retry SunHotels Booking"
                description="This will attempt to send the booking to SunHotels again."
                onConfirm={() => selectedBooking && handleRetrySunHotels(selectedBooking.id)}
                okText="Retry Now"
                cancelText="Cancel"
              >
                <Button 
                  type="primary"
                  icon={<ReloadOutlined />} 
                  loading={actionLoading === selectedBooking?.id}
                >
                  Retry
                </Button>
              </Popconfirm>
            )}
            {/* Refund button */}
            {(selectedBooking as any)?.payment?.stripePaymentIntentId && (
              <Button 
                icon={<UndoOutlined />} 
                onClick={() => setRefundModalOpen(true)}
              >
                Refund
              </Button>
            )}
            {/* Cancel SunHotels for confirmed bookings */}
            {(selectedBooking?.status === 'Confirmed' || selectedBooking?.status === 'confirmed') && (
              <Popconfirm
                title="Cancel SunHotels Booking"
                description="This will cancel the SunHotels reservation and process a refund. Cancellation fees may apply."
                onConfirm={() => selectedBooking && handleCancelSunHotels(selectedBooking.id, true)}
                okText="Cancel & Refund"
                okType="danger"
                cancelText="Go Back"
              >
                <Button 
                  danger 
                  icon={<StopOutlined />}
                >
                  Cancel Booking
                </Button>
              </Popconfirm>
            )}
            {/* Legacy cancel for pending */}
            {(selectedBooking?.status === 'pending' || selectedBooking?.status === 'Pending') && (
              <Popconfirm
                title="Cancel Booking"
                description="Are you sure you want to cancel this booking?"
                onConfirm={() => selectedBooking && cancelBooking(selectedBooking)}
                okText="Yes, Cancel"
                okType="danger"
                cancelText="No"
              >
                <Button danger icon={<CloseOutlined />}>
                  Cancel
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {selectedBooking && (
          <>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Tag 
                color={statusConfig[selectedBooking.status]?.color || 'default'} 
                icon={statusConfig[selectedBooking.status]?.icon}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {statusConfig[selectedBooking.status]?.label || selectedBooking.status}
              </Tag>
            </div>
            
            {/* Show warning for ConfirmationFailed */}
            {(selectedBooking.status === 'ConfirmationFailed' || selectedBooking.status === 'confirmationfailed') && (
              <Alert
                title="Payment Received - Confirmation Failed"
                description="The payment was successful but the SunHotels booking failed. You can retry the booking or process a refund."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Tabs items={tabItems} />
          </>
        )}
      </Drawer>

      {/* Refund Modal */}
      <Modal
        title="Process Refund"
        open={refundModalOpen}
        onCancel={() => {
          setRefundModalOpen(false);
          refundForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={(values) => selectedBooking && handleRefund(selectedBooking.id, values)}
        >
          <Alert
            title={`Original Amount: €${getBookingAmount(selectedBooking || {} as Booking).toLocaleString()}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          {/* Non-Refundable Warning */}
          {selectedBooking?.hotelBooking?.isRefundable === false && (
            <Alert
              title="⚠️ NON-REFUNDABLE BOOKING"
              description={
                <div>
                  <p>This booking is non-refundable. If you process a refund, the company will absorb 100% of the cost.</p>
                  <p style={{ marginTop: 8 }}>
                    <strong>Policy:</strong> {selectedBooking.hotelBooking.cancellationPolicyText || 'Non-refundable: 100% cancellation fee applies'}
                  </p>
                  <p><strong>Recommended Refund:</strong> €{selectedBooking.hotelBooking.maxRefundableAmount ?? 0}</p>
                </div>
              }
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Free Cancellation Deadline Warning */}
          {selectedBooking?.hotelBooking?.isRefundable !== false && 
           selectedBooking?.hotelBooking?.freeCancellationDeadline && 
           new Date(selectedBooking.hotelBooking.freeCancellationDeadline) < new Date() && (
            <Alert
              title="⚠️ Free Cancellation Period Ended"
              description={
                <div>
                  <p>
                    Free cancellation deadline was {dayjs(selectedBooking.hotelBooking.freeCancellationDeadline).format('DD MMM YYYY HH:mm')}.
                  </p>
                  <p style={{ marginTop: 8 }}>
                    <strong>Cancellation Fee:</strong> {selectedBooking.hotelBooking.cancellationPercentage}% = 
                    €{((getBookingAmount(selectedBooking) * (selectedBooking.hotelBooking.cancellationPercentage || 0)) / 100).toLocaleString()}
                  </p>
                  <p>
                    <strong>Recommended Refund:</strong> €{(selectedBooking.hotelBooking.maxRefundableAmount ?? 0).toLocaleString()}
                  </p>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Free Cancellation Still Available */}
          {selectedBooking?.hotelBooking?.isRefundable !== false && 
           selectedBooking?.hotelBooking?.freeCancellationDeadline && 
           new Date(selectedBooking.hotelBooking.freeCancellationDeadline) > new Date() && (
            <Alert
              title="✅ Free Cancellation Available"
              description={`Full refund available until ${dayjs(selectedBooking.hotelBooking.freeCancellationDeadline).format('DD MMM YYYY HH:mm')}`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form.Item
            name="amount"
            label={
              <Space>
                <span>Refund Amount</span>
                {selectedBooking?.hotelBooking?.maxRefundableAmount !== undefined && (
                  <Tooltip title="Recommended amount based on cancellation policy">
                    <Tag color="blue">Recommended: €{selectedBooking.hotelBooking.maxRefundableAmount}</Tag>
                  </Tooltip>
                )}
              </Space>
            }
            extra="Leave empty for full refund"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={`Full refund (€${getBookingAmount(selectedBooking || {} as Booking).toLocaleString()})`}
              min={0}
              max={getBookingAmount(selectedBooking || {} as Booking)}
              prefix="€"
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            initialValue="requested_by_customer"
          >
            <Radio.Group>
              <Radio value="requested_by_customer">Customer Request</Radio>
              <Radio value="duplicate">Duplicate</Radio>
              <Radio value="fraudulent">Fraudulent</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="adminNote"
            label="Admin Note (optional)"
          >
            <Input.TextArea rows={3} placeholder="Internal note about this refund..." />
          </Form.Item>

          <Form.Item
            name="sendRefundEmail"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox defaultChecked>
              Send refund confirmation email to customer
            </Checkbox>
          </Form.Item>

          {/* Force Refund for Non-Refundable */}
          {selectedBooking?.hotelBooking?.isRefundable === false && (
            <Form.Item
              name="forceRefund"
              valuePropName="checked"
              initialValue={false}
            >
              <div style={{ backgroundColor: '#fff2f0', padding: '12px', borderRadius: 8, border: '1px solid #ffccc7' }}>
                <Checkbox>
                  <Text type="danger" strong>
                    I understand this is a non-refundable booking and the company will absorb the loss
                  </Text>
                </Checkbox>
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRefundModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                danger 
                htmlType="submit"
                loading={actionLoading === selectedBooking?.id}
                disabled={selectedBooking?.hotelBooking?.isRefundable === false && !refundForm.getFieldValue('forceRefund')}
              >
                {selectedBooking?.hotelBooking?.isRefundable === false ? '⚠️ Force Refund' : 'Process Refund'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
