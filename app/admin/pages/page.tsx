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
  Typography,
  Dropdown,
  Select,
  Spin,
  Collapse,
  Divider,
  Badge,
  App,
  Popconfirm,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  EyeOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';
import { SUPPORTED_LOCALES } from '@/lib/constants/locales';

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

export default function PagesPage() {
  return (
    <App>
      <PagesContent />
    </App>
  );
}

function PagesContent() {
  const { message } = App.useApp();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
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
      // Tüm diller için değerleri ayarla
      const formValues: any = {
        slug: page.slug,
        isActive: page.isActive,
      };
      
      SUPPORTED_LOCALES.forEach(locale => {
        const translation = page.translations.find(t => t.locale === locale.code);
        if (translation) {
          formValues[`title_${locale.code}`] = translation.title;
          formValues[`content_${locale.code}`] = translation.content;
          formValues[`metaTitle_${locale.code}`] = translation.metaTitle;
          formValues[`metaDescription_${locale.code}`] = translation.metaDescription;
        }
      });
      
      form.setFieldsValue(formValues);
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

      // Tüm diller için çevirileri topla
      const translations: PageTranslation[] = SUPPORTED_LOCALES.map(locale => ({
        locale: locale.code,
        title: values[`title_${locale.code}`] || '',
        content: values[`content_${locale.code}`] || '',
        metaTitle: values[`metaTitle_${locale.code}`] || '',
        metaDescription: values[`metaDescription_${locale.code}`] || '',
      })).filter(t => t.title); // Sadece başlık doldurulmuş olanları al
      
      if (editingPage) {
        const updateData = {
          slug: values.slug,
          isActive: values.isActive,
          translations,
        };

        await adminAPI.updatePage(editingPage.id, updateData);
        message.success('Page updated');
      } else {
        const createData = {
          slug: values.slug,
          isActive: values.isActive,
          translations,
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
          {SUPPORTED_LOCALES.map(locale => {
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
      width: 150,
      render: (_: any, record: StaticPage) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/tr/pages/${record.slug}`, '_blank')}
          />
          <Popconfirm
            title="Delete Page"
            description={`Are you sure you want to delete "${record.translations[0]?.title}" page?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
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
            dataSource={pages || []}
            rowKey={(record) => record.id || `page-${Math.random()}`}
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pages`,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingPage ? 'Edit Page' : 'New Page'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width="90%"
        style={{ maxWidth: 900 }}
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

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Draft" />
          </Form.Item>

          <Divider><Space><TranslationOutlined />Translations</Space></Divider>

          <Collapse
            items={SUPPORTED_LOCALES?.map(locale => {
              const translation = editingPage?.translations?.find(t => t.locale === locale.code);
              const hasContent = translation && (translation.title || translation.content);
              
              return {
                key: locale.code,
                label: (
                  <Space>
                    <span>{locale.flag}</span>
                    <Text strong>{locale.name}</Text>
                    {hasContent && <Badge status="success" />}
                  </Space>
                ),
                children: (
                  <>
                    <Form.Item
                      name={`title_${locale.code}`}
                      label="Title"
                      rules={locale.code === 'tr' ? [{ required: true, message: 'Title is required for default language' }] : []}
                    >
                      <Input placeholder={`Page title in ${locale.name}`} />
                    </Form.Item>

                    <Form.Item
                      name={`content_${locale.code}`}
                      label="Content"
                    >
                      <TextArea rows={6} placeholder={`Page content in ${locale.name} (Markdown supported)`} />
                    </Form.Item>

                    <Form.Item name={`metaTitle_${locale.code}`} label="Meta Title">
                      <Input placeholder={`SEO title in ${locale.name}`} />
                    </Form.Item>

                    <Form.Item name={`metaDescription_${locale.code}`} label="Meta Description">
                      <TextArea rows={2} placeholder={`SEO description in ${locale.name}`} />
                    </Form.Item>
                  </>
                ),
              };
            }) || []}
            defaultActiveKey={['tr']}
          />
        </Form>
      </Modal>
    </div>
  );
}
