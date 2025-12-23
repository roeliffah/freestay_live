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
  Select,
  Switch,
  Typography,
  Popconfirm,
  Spin,
  App,
  Tabs,
  DatePicker,
  InputNumber,
  Image,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DragOutlined,
  StarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FeaturedHotel {
  id: string;
  hotelId: string;
  hotel: {
    hotelId: string;
    hotelName: string;
    destinationName: string;
    country: string;
    category: number;
    rating: number;
    images: string[];
    priceFrom: number;
    currency: string;
  };
  priority: number;
  status: string;
  season: string;
  category: string;
  validFrom?: string;
  validUntil?: string;
  campaignName?: string;
  discountPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

interface FeaturedDestination {
  id: string;
  destinationId: string;
  destinationName: string;
  countryCode: string;
  country: string;
  priority: number;
  status: string;
  season: string;
  image?: string;
  hotelCount: number;
  averagePrice: number;
  description?: string;
  validFrom?: string;
  validUntil?: string;
}

const statusOptions = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'red' },
  { value: 'scheduled', label: 'Scheduled', color: 'blue' },
];

const seasonOptions = [
  { value: 'all-season', label: 'All Season' },
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'autumn', label: 'Autumn' },
];

const categoryOptions = [
  { value: 'beach', label: 'Beach' },
  { value: 'ski', label: 'Ski' },
  { value: 'city', label: 'City' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'budget', label: 'Budget' },
];

export default function FeaturedContentPage() {
  return (
    <App>
      <FeaturedContentContent />
    </App>
  );
}

function FeaturedContentContent() {
  const { message: messageApi } = App.useApp();
  const [activeTab, setActiveTab] = useState('hotels');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <StarOutlined style={{ marginRight: 12 }} />
          Featured Content Management
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'hotels',
            label: 'Featured Hotels',
            children: <FeaturedHotelsTab messageApi={messageApi} />,
          },
          {
            key: 'destinations',
            label: 'Featured Destinations',
            children: <FeaturedDestinationsTab messageApi={messageApi} />,
          },
        ]}
      />
    </div>
  );
}

// Featured Hotels Tab Component
function FeaturedHotelsTab({ messageApi }: any) {
  const [hotels, setHotels] = useState<FeaturedHotel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<FeaturedHotel | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchHotels();
  }, [currentPage, pageSize]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (seasonFilter !== 'all') params.season = seasonFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const data = await adminAPI.getFeaturedHotels(params);
      const hotelsArray = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setHotels(hotelsArray);
      setTotalCount(data?.totalCount || hotelsArray.length);
    } catch (error: any) {
      console.error('Failed to load featured hotels:', error);
      messageApi.error(error.message || 'Failed to load featured hotels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (hotel?: FeaturedHotel) => {
    if (hotel) {
      setEditingHotel(hotel);
      form.setFieldsValue({
        ...hotel,
        validDates: hotel.validFrom && hotel.validUntil 
          ? [dayjs(hotel.validFrom), dayjs(hotel.validUntil)] 
          : undefined,
      });
    } else {
      setEditingHotel(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      const payload = {
        ...values,
        validFrom: values.validDates?.[0]?.toISOString(),
        validUntil: values.validDates?.[1]?.toISOString(),
      };
      delete payload.validDates;

      if (editingHotel) {
        await adminAPI.updateFeaturedHotel(editingHotel.id, payload);
        messageApi.success('Featured hotel updated successfully');
      } else {
        await adminAPI.createFeaturedHotel(payload);
        messageApi.success('Featured hotel added successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchHotels();
    } catch (error: any) {
      if (error.errorFields) return;
      console.error('Failed to save featured hotel:', error);
      messageApi.error(error.message || 'Failed to save featured hotel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteFeaturedHotel(id);
      messageApi.success('Featured hotel removed successfully');
      fetchHotels();
    } catch (error: any) {
      console.error('Failed to delete featured hotel:', error);
      messageApi.error(error.message || 'Failed to delete featured hotel');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = hotels.findIndex((item) => item.id === active.id);
      const newIndex = hotels.findIndex((item) => item.id === over.id);

      const newHotels = arrayMove(hotels, oldIndex, newIndex);
      setHotels(newHotels);

      try {
        const items = newHotels.map((hotel, index) => ({
          id: hotel.id,
          priority: index + 1,
        }));
        await adminAPI.bulkUpdateFeaturedHotelPriority({ items });
        messageApi.success('Priority updated successfully');
      } catch (error: any) {
        console.error('Failed to update priority:', error);
        messageApi.error(error.message || 'Failed to update priority');
        fetchHotels();
      }
    }
  };

  const columns = [
    {
      title: '',
      key: 'drag',
      width: 50,
      render: () => <DragOutlined style={{ cursor: 'move' }} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => <Badge count={priority} showZero style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Hotel',
      key: 'hotel',
      render: (_: any, record: FeaturedHotel) => (
        <Space>
          {record.hotel?.images?.[0] && (
            <Image
              src={record.hotel.images[0]}
              alt={record.hotel.hotelName}
              width={60}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{record.hotel?.hotelName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EnvironmentOutlined /> {record.hotel?.destinationName}, {record.hotel?.country}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      render: (season: string) => <Tag color="cyan">{season}</Tag>,
    },
    {
      title: 'Campaign',
      key: 'campaign',
      render: (_: any, record: FeaturedHotel) => (
        record.campaignName ? (
          <div>
            <Text>{record.campaignName}</Text>
            {record.discountPercentage && (
              <Tag color="red" style={{ marginLeft: 8 }}>-{record.discountPercentage}%</Tag>
            )}
          </div>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Valid Period',
      key: 'validPeriod',
      render: (_: any, record: FeaturedHotel) => (
        record.validFrom && record.validUntil ? (
          <Text style={{ fontSize: 12 }}>
            {dayjs(record.validFrom).format('DD MMM YYYY')} - {dayjs(record.validUntil).format('DD MMM YYYY')}
          </Text>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusOption = statusOptions.find(s => s.value === status);
        return <Tag color={statusOption?.color}>{statusOption?.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: FeaturedHotel) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove Featured Hotel"
            description="Are you sure you want to remove this hotel from featured list?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        </Space>
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
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); fetchHotels(); }}
            options={[{ value: 'all', label: 'All Status' }, ...statusOptions]}
          />
          <Select
            style={{ width: 150 }}
            value={seasonFilter}
            onChange={(value) => { setSeasonFilter(value); fetchHotels(); }}
            options={[{ value: 'all', label: 'All Seasons' }, ...seasonOptions]}
          />
          <Select
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={(value) => { setCategoryFilter(value); fetchHotels(); }}
            options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchHotels}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Featured Hotel
          </Button>
        </Space>
      </div>

      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={hotels.map(h => h.id)} strategy={verticalListSortingStrategy}>
            <Table
              columns={columns}
              dataSource={hotels}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} featured hotels`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
              }}
              components={{
                body: {
                  row: DraggableRow,
                },
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title={editingHotel ? 'Edit Featured Hotel' : 'Add Featured Hotel'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingHotel ? 'Update' : 'Add'}
        cancelText="Cancel"
        confirmLoading={saving}
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'active', season: 'all-season' }}>
          <Form.Item
            name="hotelId"
            label="Hotel ID"
            rules={[{ required: true, message: 'Hotel ID is required' }]}
          >
            <Input placeholder="Enter hotel ID (e.g., 228001)" disabled={!!editingHotel} />
          </Form.Item>

          <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Priority is required' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Lower number = higher priority" />
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item name="season" label="Season" rules={[{ required: true }]}>
            <Select options={seasonOptions} />
          </Form.Item>

          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={categoryOptions} />
          </Form.Item>

          <Form.Item name="validDates" label="Valid Period">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="campaignName" label="Campaign Name">
            <Input placeholder="e.g., Summer Sale 2025" />
          </Form.Item>

          <Form.Item name="discountPercentage" label="Discount Percentage">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Featured Destinations Tab Component
function FeaturedDestinationsTab({ messageApi }: any) {
  const [destinations, setDestinations] = useState<FeaturedDestination[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<FeaturedDestination | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchDestinations();
  }, [currentPage, pageSize]);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (seasonFilter !== 'all') params.season = seasonFilter;

      const data = await adminAPI.getFeaturedDestinations(params);
      const destinationsArray = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setDestinations(destinationsArray);
      setTotalCount(data?.totalCount || destinationsArray.length);
    } catch (error: any) {
      console.error('Failed to load featured destinations:', error);
      messageApi.error(error.message || 'Failed to load featured destinations');
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (destination?: FeaturedDestination) => {
    if (destination) {
      setEditingDestination(destination);
      form.setFieldsValue({
        ...destination,
        validDates: destination.validFrom && destination.validUntil 
          ? [dayjs(destination.validFrom), dayjs(destination.validUntil)] 
          : undefined,
      });
    } else {
      setEditingDestination(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      const payload = {
        ...values,
        validFrom: values.validDates?.[0]?.toISOString(),
        validUntil: values.validDates?.[1]?.toISOString(),
      };
      delete payload.validDates;

      if (editingDestination) {
        await adminAPI.updateFeaturedDestination(editingDestination.id, payload);
        messageApi.success('Featured destination updated successfully');
      } else {
        await adminAPI.createFeaturedDestination(payload);
        messageApi.success('Featured destination added successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchDestinations();
    } catch (error: any) {
      if (error.errorFields) return;
      console.error('Failed to save featured destination:', error);
      messageApi.error(error.message || 'Failed to save featured destination');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteFeaturedDestination(id);
      messageApi.success('Featured destination removed successfully');
      fetchDestinations();
    } catch (error: any) {
      console.error('Failed to delete featured destination:', error);
      messageApi.error(error.message || 'Failed to delete featured destination');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = destinations.findIndex((item) => item.id === active.id);
      const newIndex = destinations.findIndex((item) => item.id === over.id);

      const newDestinations = arrayMove(destinations, oldIndex, newIndex);
      setDestinations(newDestinations);

      try {
        const items = newDestinations.map((dest, index) => ({
          id: dest.id,
          priority: index + 1,
        }));
        await adminAPI.bulkUpdateFeaturedDestinationPriority({ items });
        messageApi.success('Priority updated successfully');
      } catch (error: any) {
        console.error('Failed to update priority:', error);
        messageApi.error(error.message || 'Failed to update priority');
        fetchDestinations();
      }
    }
  };

  const columns = [
    {
      title: '',
      key: 'drag',
      width: 50,
      render: () => <DragOutlined style={{ cursor: 'move' }} />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: number) => <Badge count={priority} showZero style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Destination',
      key: 'destination',
      render: (_: any, record: FeaturedDestination) => (
        <Space>
          {record.image && (
            <Image
              src={record.image}
              alt={record.destinationName}
              width={60}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <Text strong>{record.destinationName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.country} ({record.countryCode})
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Hotels',
      dataIndex: 'hotelCount',
      key: 'hotelCount',
      render: (count: number) => <Text>{count} hotels</Text>,
    },
    {
      title: 'Avg Price',
      dataIndex: 'averagePrice',
      key: 'averagePrice',
      render: (price: number) => <Text>€{price}</Text>,
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      render: (season: string) => <Tag color="cyan">{season}</Tag>,
    },
    {
      title: 'Valid Period',
      key: 'validPeriod',
      render: (_: any, record: FeaturedDestination) => (
        record.validFrom && record.validUntil ? (
          <Text style={{ fontSize: 12 }}>
            {dayjs(record.validFrom).format('DD MMM YYYY')} - {dayjs(record.validUntil).format('DD MMM YYYY')}
          </Text>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusOption = statusOptions.find(s => s.value === status);
        return <Tag color={statusOption?.color}>{statusOption?.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: FeaturedDestination) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove Featured Destination"
            description="Are you sure you want to remove this destination from featured list?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        </Space>
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
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Select
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); fetchDestinations(); }}
            options={[{ value: 'all', label: 'All Status' }, ...statusOptions]}
          />
          <Select
            style={{ width: 150 }}
            value={seasonFilter}
            onChange={(value) => { setSeasonFilter(value); fetchDestinations(); }}
            options={[{ value: 'all', label: 'All Seasons' }, ...seasonOptions]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchDestinations}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Featured Destination
          </Button>
        </Space>
      </div>

      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={destinations.map(d => d.id)} strategy={verticalListSortingStrategy}>
            <Table
              columns={columns}
              dataSource={destinations}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} featured destinations`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
              }}
              components={{
                body: {
                  row: DraggableRow,
                },
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title={editingDestination ? 'Edit Featured Destination' : 'Add Featured Destination'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingDestination ? 'Update' : 'Add'}
        cancelText="Cancel"
        confirmLoading={saving}
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'active', season: 'all-season' }}>
          <Form.Item
            name="destinationId"
            label="Destination ID"
            rules={[{ required: true, message: 'Destination ID is required' }]}
          >
            <Input placeholder="Enter destination ID (e.g., 228)" disabled={!!editingDestination} />
          </Form.Item>

          <Form.Item
            name="destinationName"
            label="Destination Name"
            rules={[{ required: true, message: 'Destination name is required' }]}
          >
            <Input placeholder="e.g., Antalya" />
          </Form.Item>

          <Form.Item name="countryCode" label="Country Code" rules={[{ required: true }]}>
            <Input placeholder="e.g., TR" maxLength={2} />
          </Form.Item>

          <Form.Item name="country" label="Country" rules={[{ required: true }]}>
            <Input placeholder="e.g., Turkey" />
          </Form.Item>

          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Lower number = higher priority" />
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item name="season" label="Season" rules={[{ required: true }]}>
            <Select options={seasonOptions} />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Short description about the destination" />
          </Form.Item>

          <Form.Item name="validDates" label="Valid Period">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Draggable Row Component
interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

function DraggableRow({ children, ...props }: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}
