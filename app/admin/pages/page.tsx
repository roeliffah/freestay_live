'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Typography,
  Dropdown,
  Select,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface PageTranslation {
  locale: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

interface StaticPage {
  id: string;
  slug: string;
  isActive: boolean;
  translations: PageTranslation[];
  createdAt: string;
  updatedAt: string;
}

const locales = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function PagesPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [selectedLocale, setSelectedLocale] = useState('tr');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response: any = await adminAPI.getPages({ isActive: undefined });
      // Backend paginated response dönüyor, items array'ini al
      const pagesData = Array.isArray(response) ? response : (response.items || []);
      setPages(pagesData);
    } catch (error: any) {
      message.error(error.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const showModal = (page?: StaticPage) => {
    if (page) {
      setEditingPage(page);
      const translation = page.translations.find(t => t.locale === selectedLocale) || page.translations[0];
      form.setFieldsValue({
        slug: page.slug,
        isActive: page.isActive,
        title: translation?.title || '',
        content: translation?.content || '',
        metaTitle: translation?.metaTitle || '',
        metaDescription: translation?.metaDescription || '',
      });
    } else {
      setEditingPage(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const translationData = {
        locale: selectedLocale,
        title: values.title,
        content: values.content,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
      };
      
      if (editingPage) {
        // Mevcut translations'ı güncelle
        const existingTranslations = editingPage.translations.filter(t => t.locale !== selectedLocale);
        const updatedTranslations = [...existingTranslations, translationData];

        const updateData = {
          slug: values.slug,
          isActive: values.isActive,
          translations: updatedTranslations,
        };

        await adminAPI.updatePage(editingPage.id, updateData);
        message.success('Page updated');
      } else {
        const createData = {
          slug: values.slug,
          isActive: values.isActive,
          translations: [translationData],
        };

        await adminAPI.createPage(createData);
        message.success('Page created');
      }
      
      setIsModalOpen(false);
      fetchPages();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deletePage(id);
      message.success('Page deleted');
      fetchPages();
    } catch (error: any) {
      message.error(error.message || 'Delete operation failed');
    }
  };

  const onLocaleChange = (locale: string) => {
    setSelectedLocale(locale);
    if (editingPage) {
      const translation = editingPage.translations.find(t => t.locale === locale);
      form.setFieldsValue({
        title: translation?.title || '',
        content: translation?.content || '',
        metaTitle: translation?.metaTitle || '',
        metaDescription: translation?.metaDescription || '',
      });
    }
  };

  const getActionItems = (record: StaticPage): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => showModal(record),
    },
    {
      key: 'preview',
      icon: <EyeOutlined />,
      label: 'Preview',
      onClick: () => window.open(`/tr/${record.slug}`, '_blank'),
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
      title: 'Page',
      key: 'page',
      render: (_: any, record: StaticPage) => (
        <Space>
          <FileTextOutlined style={{ fontSize: 20 }} />
          <div>
            <Text strong>{record.translations[0]?.title || 'Untitled'}</Text>
            <br />
            <Text type="secondary" code style={{ fontSize: 12 }}>/{record.slug}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Translations',
      key: 'translations',
      render: (_: any, record: StaticPage) => (
        <Space>
          {locales.map(locale => {
            const hasTranslation = record.translations.some(t => t.locale === locale.code);
            return (
              <Tag 
                key={locale.code} 
                color={hasTranslation ? 'green' : 'default'}
                style={{ opacity: hasTranslation ? 1 : 0.5 }}
              >
                {locale.flag}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString('en-US'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: StaticPage) => (
        <Dropdown
          menu={{
            items: getActionItems(record),
            onClick: ({ key }) => {
              if (key === 'delete') {
                Modal.confirm({
                  title: 'Delete Page',
                  content: `Are you sure you want to delete "${record.translations[0]?.title}" page?`,
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 12 }} />
          Static Pages
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          New Page
        </Button>
      </div>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={pages}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pages`,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={
          <Space>
            {editingPage ? 'Edit Page' : 'New Page'}
            <Select
              value={selectedLocale}
              onChange={onLocaleChange}
              style={{ width: 150 }}
              options={locales.map(l => ({
                label: <Space>{l.flag} {l.name}</Space>,
                value: l.code,
              }))}
            />
          </Space>
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width={800}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item
            name="slug"
            label="URL Slug"
            rules={[
              { required: true, message: 'Slug is required' },
              { pattern: /^[a-z0-9-]+$/, message: 'Use only lowercase letters, numbers and hyphens' },
            ]}
          >
            <Input prefix="freestays.com/" placeholder="privacy-policy" />
          </Form.Item>

          <Form.Item
            name="title"
            label={`Title (${selectedLocale.toUpperCase()})`}
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="Page title" />
          </Form.Item>

          <Form.Item
            name="content"
            label={`Content (${selectedLocale.toUpperCase()})`}
            rules={[{ required: true, message: 'Content is required' }]}
          >
            <TextArea rows={10} placeholder="Page content (Markdown supported)" />
          </Form.Item>

          <Form.Item name="metaTitle" label="Meta Title">
            <Input placeholder="SEO title" />
          </Form.Item>

          <Form.Item name="metaDescription" label="Meta Description">
            <TextArea rows={2} placeholder="SEO description" />
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Draft" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
