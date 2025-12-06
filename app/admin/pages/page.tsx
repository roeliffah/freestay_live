'use client';

import React, { useState } from 'react';
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
  Tabs,
  Select,
} from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileTextOutlined,
  EyeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface StaticPage {
  id: string;
  slug: string;
  isActive: boolean;
  translations: {
    locale: string;
    title: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  }[];
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

// Mock data
const mockPages: StaticPage[] = [
  {
    id: '1',
    slug: 'privacy-policy',
    isActive: true,
    translations: [
      { locale: 'tr', title: 'Gizlilik Politikası', content: 'Gizlilik politikası içeriği...', metaTitle: 'Gizlilik Politikası | FreeStays', metaDescription: 'FreeStays gizlilik politikası' },
      { locale: 'en', title: 'Privacy Policy', content: 'Privacy policy content...', metaTitle: 'Privacy Policy | FreeStays', metaDescription: 'FreeStays privacy policy' },
    ],
    createdAt: '2025-01-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '2',
    slug: 'terms-and-conditions',
    isActive: true,
    translations: [
      { locale: 'tr', title: 'Kullanım Koşulları', content: 'Kullanım koşulları içeriği...', metaTitle: 'Kullanım Koşulları | FreeStays', metaDescription: 'FreeStays kullanım koşulları' },
      { locale: 'en', title: 'Terms and Conditions', content: 'Terms and conditions content...', metaTitle: 'Terms and Conditions | FreeStays', metaDescription: 'FreeStays terms and conditions' },
    ],
    createdAt: '2025-01-01',
    updatedAt: '2025-12-01',
  },
  {
    id: '3',
    slug: 'cookie-policy',
    isActive: true,
    translations: [
      { locale: 'tr', title: 'Çerez Politikası', content: 'Çerez politikası içeriği...', metaTitle: 'Çerez Politikası | FreeStays', metaDescription: 'FreeStays çerez politikası' },
    ],
    createdAt: '2025-01-01',
    updatedAt: '2025-11-15',
  },
  {
    id: '4',
    slug: 'faq',
    isActive: false,
    translations: [
      { locale: 'tr', title: 'Sıkça Sorulan Sorular', content: 'SSS içeriği...', metaTitle: 'SSS | FreeStays', metaDescription: 'Sıkça sorulan sorular' },
    ],
    createdAt: '2025-03-01',
    updatedAt: '2025-10-20',
  },
];

export default function PagesPage() {
  const [pages, setPages] = useState<StaticPage[]>(mockPages);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [selectedLocale, setSelectedLocale] = useState('tr');
  const [form] = Form.useForm();

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
      
      if (editingPage) {
        setPages(pages.map(p => {
          if (p.id === editingPage.id) {
            const existingTranslation = p.translations.find(t => t.locale === selectedLocale);
            const newTranslation = {
              locale: selectedLocale,
              title: values.title,
              content: values.content,
              metaTitle: values.metaTitle,
              metaDescription: values.metaDescription,
            };
            
            return {
              ...p,
              slug: values.slug,
              isActive: values.isActive,
              translations: existingTranslation
                ? p.translations.map(t => t.locale === selectedLocale ? newTranslation : t)
                : [...p.translations, newTranslation],
              updatedAt: new Date().toISOString().split('T')[0],
            };
          }
          return p;
        }));
        message.success('Page updated');
      } else {
        const newPage: StaticPage = {
          id: Date.now().toString(),
          slug: values.slug,
          isActive: values.isActive,
          translations: [{
            locale: selectedLocale,
            title: values.title,
            content: values.content,
            metaTitle: values.metaTitle,
            metaDescription: values.metaDescription,
          }],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setPages([...pages, newPage]);
        message.success('Page created');
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
    message.success('Page deleted');
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
            <Text strong>{record.translations[0]?.title}</Text>
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
      title: 'Last Update',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
                  content: `Are you sure you want to delete page "${record.translations[0]?.title}"?`,
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
        <Table
          columns={columns}
          dataSource={pages}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} pages`,
          }}
        />
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
            <Input addonBefore="freestays.com/" placeholder="privacy-policy" />
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
