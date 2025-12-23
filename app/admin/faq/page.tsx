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
  message as antdMessage,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'general', label: 'General' },
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Payment' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
];

export default function FAQPage() {
  return (
    <App>
      <FAQContent />
    </App>
  );
}

function FAQContent() {
  const { message: messageApi } = App.useApp();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    fetchFaqs();
  }, [currentPage, pageSize]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getFaqs({ page: currentPage, pageSize });
      const faqsArray = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);
      setFaqs(faqsArray);
      setTotalCount((data as any)?.totalCount || faqsArray.length);
    } catch (error: any) {
      console.error('Failed to load FAQs:', error);
      messageApi.error(error.message || 'Failed to load FAQs');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      form.setFieldsValue(faq);
    } else {
      setEditingFaq(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();

      if (editingFaq) {
        await adminAPI.updateFaq(editingFaq.id, values);
        messageApi.success('FAQ updated successfully');
      } else {
        await adminAPI.createFaq(values);
        messageApi.success('FAQ created successfully');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchFaqs();
    } catch (error: any) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error('Failed to save FAQ:', error);
      messageApi.error(error.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteFaq(id);
      messageApi.success('FAQ deleted successfully');
      fetchFaqs();
    } catch (error: any) {
      console.error('Failed to delete FAQ:', error);
      messageApi.error(error.message || 'Failed to delete FAQ');
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      await adminAPI.updateFaq(faq.id, { isActive: !faq.isActive });
      messageApi.success(faq.isActive ? 'FAQ deactivated successfully' : 'FAQ activated successfully');
      fetchFaqs();
    } catch (error: any) {
      console.error('Failed to toggle FAQ:', error);
      messageApi.error(error.message || 'Failed to toggle FAQ status');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((item) => item.id === active.id);
      const newIndex = faqs.findIndex((item) => item.id === over.id);

      const newFaqs = arrayMove(faqs, oldIndex, newIndex);
      setFaqs(newFaqs);

      // Update order in backend
      try {
        const items = newFaqs.map((faq, index) => ({
          id: faq.id,
          order: index + 1,
        }));
        await adminAPI.updateFaqOrder({ items });
        messageApi.success('Order updated successfully');
      } catch (error: any) {
        console.error('Failed to update order:', error);
        messageApi.error(error.message || 'Failed to update order');
        // Revert on error
        fetchFaqs();
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
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      render: (question: string) => (
        <Text strong ellipsis style={{ maxWidth: 400, display: 'block' }}>
          {question}
        </Text>
      ),
    },
    {
      title: 'Answer',
      dataIndex: 'answer',
      key: 'answer',
      render: (answer: string) => (
        <Text ellipsis style={{ maxWidth: 300, display: 'block' }}>
          {answer}
        </Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{categories.find(c => c.value === category)?.label || category}</Tag>
      ),
      filters: categories.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value: any, record: FAQ) => record.category === value,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: FAQ) => (
        <Switch
          checked={isActive}
          onChange={() => toggleActive(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: FAQ) => record.isActive === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: FAQ) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete FAQ"
            description="Are you sure you want to delete this FAQ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredFaqs = categoryFilter === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === categoryFilter);

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
          <QuestionCircleOutlined style={{ marginRight: 12 }} />
          FAQ Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchFaqs}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            New FAQ
          </Button>
        </Space>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Text>Filter by category:</Text>
          <Select
            style={{ width: 200 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories,
            ]}
          />
        </Space>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredFaqs.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <Table
              columns={columns}
              dataSource={filteredFaqs}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} FAQs`,
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
        title={editingFaq ? 'Edit FAQ' : 'New FAQ'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingFaq ? 'Update' : 'Create'}
        cancelText="Cancel"
        confirmLoading={saving}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: 'general',
            isActive: true,
          }}
        >
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: 'Question is required' }]}
          >
            <Input placeholder="Enter question" />
          </Form.Item>

          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: true, message: 'Answer is required' }]}
          >
            <TextArea rows={6} placeholder="Enter answer" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Category is required' }]}
          >
            <Select options={categories} />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

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
