'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Popconfirm,
  App,
  Tag,
  Collapse,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

interface HomePageSection {
  id: string;
  sectionType: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
  displayOrder: number;
  configuration: any;
  createdAt?: string;
  updatedAt?: string;
}

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Section', icon: '🎯', description: 'Main banner with search' },
  { value: 'room-types', label: 'Room Types', icon: '🏨', description: 'Hotel, Resort, Apart, Villa' },
  { value: 'features', label: 'Features', icon: '✨', description: 'Best price, Secure, Support' },
  { value: 'popular-hotels', label: 'Popular Hotels', icon: '⭐', description: 'Featured hotels grid' },
  { value: 'popular-destinations', label: 'Popular Destinations', icon: '🌍', description: 'Top destinations' },
  { value: 'romantic-tours', label: 'Romantic Tours', icon: '💑', description: 'Romantic themed hotels' },
  { value: 'campaign-banner', label: 'Campaign Banner', icon: '🎉', description: 'Special offers banner' },
  { value: 'travel-cta', label: 'Travel CTA Cards', icon: '✈️', description: 'Excursions, Car, Flight' },
  { value: 'final-cta', label: 'Final CTA', icon: '🚀', description: 'Call to action buttons' },
  { value: 'custom-html', label: 'Custom HTML', icon: '📝', description: 'Custom HTML content' },
];

export default function HomePageManagementPage() {
  return (
    <App>
      <HomePageContent />
    </App>
  );
}

function HomePageContent() {
  const { message } = App.useApp();
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomePageSection | null>(null);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch sections');

      const data = await response.json();
      setSections(data.data || []);
    } catch (error: any) {
      message.error(error.message || 'Failed to load sections');
      // Fallback to empty array on error
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex).map((s, index) => ({
      ...s,
      displayOrder: index + 1,
    }));

    setSections(newSections);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          sectionOrders: newSections.map((s) => ({ id: s.id, displayOrder: s.displayOrder })),
        }),
      });

      if (!response.ok) throw new Error('Failed to reorder');
      message.success('Sections reordered successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to reorder sections');
      loadSections(); // Reload on error
    }
  };

  const handleToggleActive = async (section: HomePageSection) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to toggle');

      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, isActive: !s.isActive } : s))
      );
      message.success('Section status updated');
    } catch (error: any) {
      message.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSections((prev) => prev.filter((s) => s.id !== id));
      message.success('Section deleted successfully');
    } catch (error: any) {
      message.error(error.message || 'Failed to delete section');
    }
  };

  const handleOpenModal = (section?: HomePageSection) => {
    if (section) {
      setEditingSection(section);
      form.setFieldsValue({
        sectionType: section.sectionType,
        title: section.title,
        subtitle: section.subtitle,
        isActive: section.isActive,
        configuration: JSON.stringify(section.configuration, null, 2),
      });
    } else {
      setEditingSection(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        sectionType: values.sectionType,
        title: values.title || null,
        subtitle: values.subtitle || null,
        isActive: values.isActive,
        displayOrder: editingSection ? editingSection.displayOrder : sections.length + 1,
        configuration: JSON.parse(values.configuration),
      };

      const url = editingSection
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${editingSection.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections`;

      const response = await fetch(url, {
        method: editingSection ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save section');

      message.success(`Section ${editingSection ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
      form.resetFields();
      loadSections();
    } catch (error: any) {
      message.error(error.message || 'Failed to save section');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <LayoutOutlined style={{ marginRight: 12 }} />
          Homepage Section Management
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Section
        </Button>
      </div>

      <Card loading={loading}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <Collapse accordion>
              {sections.map((section) => (
                <Panel
                  key={section.id}
                  header={<SectionHeader section={section} />}
                  extra={
                    <Space onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={section.isActive}
                        onChange={() => handleToggleActive(section)}
                        checkedChildren={<EyeOutlined />}
                        unCheckedChildren={<EyeInvisibleOutlined />}
                      />
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(section)}
                      />
                      <Popconfirm
                        title="Delete section?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(section.id)}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                      <DragOutlined style={{ cursor: 'grab' }} />
                    </Space>
                  }
                >
                  <SectionContent section={section} />
                </Panel>
              ))}
            </Collapse>
          </SortableContext>
        </DndContext>

        {sections.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <LayoutOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>No sections added yet. Click "Add Section" to get started.</p>
          </div>
        )}
      </Card>

      {/* Modal for Add/Edit */}
      <Modal
        title={editingSection ? 'Edit Section' : 'Add New Section'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={700}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="sectionType"
            label="Section Type"
            rules={[{ required: true, message: 'Please select section type' }]}
          >
            <Select
              placeholder="Select section type"
              disabled={!!editingSection}
              options={SECTION_TYPES.map((t) => ({
                value: t.value,
                label: (
                  <Space>
                    <span>{t.icon}</span>
                    <div>
                      <div>{t.label}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.description}
                      </Text>
                    </div>
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item name="title" label="Title (Optional)">
            <Input placeholder="Override default title" />
          </Form.Item>

          <Form.Item name="subtitle" label="Subtitle (Optional)">
            <Input placeholder="Override default subtitle" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            name="configuration"
            label="Configuration (JSON)"
            rules={[
              { required: true, message: 'Configuration is required' },
              {
                validator: (_, value) => {
                  try {
                    if (value) JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error('Invalid JSON'));
                  }
                },
              },
            ]}
          >
            <TextArea rows={12} placeholder='{"key": "value"}' />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function SectionHeader({ section }: { section: HomePageSection }) {
  const sectionTypeInfo = SECTION_TYPES.find((t) => t.value === section.sectionType);

  return (
    <Space>
      <span style={{ fontSize: 20 }}>{sectionTypeInfo?.icon}</span>
      <div>
        <Text strong>{sectionTypeInfo?.label || section.sectionType}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {section.title || sectionTypeInfo?.description}
        </Text>
      </div>
      {!section.isActive && <Tag color="red">Inactive</Tag>}
    </Space>
  );
}

function SectionContent({ section }: { section: HomePageSection }) {
  return (
    <div>
      {section.subtitle && (
        <p>
          <Text type="secondary">{section.subtitle}</Text>
        </p>
      )}
      <div style={{ marginTop: 16 }}>
        <Text strong>Configuration:</Text>
        <pre
          style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 4,
            marginTop: 8,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(section.configuration, null, 2)}
        </pre>
      </div>
    </div>
  );
}
