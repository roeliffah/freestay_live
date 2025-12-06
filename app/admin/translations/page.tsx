'use client';

import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Modal,
  Form,
  Select,
  Badge,
  Tooltip,
  Empty,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Translation {
  key: string;
  namespace: string;
  values: Record<string, string>;
}

// Desteklenen diller
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

// Namespace'ler
const namespaces = [
  { key: 'header', label: 'Header' },
  { key: 'home', label: 'Home Page' },
  { key: 'search', label: 'Search' },
  { key: 'hotel', label: 'Hotel Detail' },
  { key: 'booking', label: 'Booking' },
  { key: 'about', label: 'About Us' },
  { key: 'contact', label: 'Contact' },
  { key: 'common', label: 'General' },
];

// Mock translations
const mockTranslations: Translation[] = [
  {
    key: 'header.hotels',
    namespace: 'header',
    values: { tr: 'Oteller', en: 'Hotels', de: 'Hotels', nl: 'Hotels', it: 'Hotel', el: 'Ξενοδοχεία', ru: 'Отели', es: 'Hoteles', fr: 'Hôtels' },
  },
  {
    key: 'header.about',
    namespace: 'header',
    values: { tr: 'Hakkımızda', en: 'About', de: 'Über uns', nl: 'Over ons', it: 'Chi siamo', el: 'Σχετικά', ru: 'О нас', es: 'Sobre nosotros', fr: 'À propos' },
  },
  {
    key: 'header.contact',
    namespace: 'header',
    values: { tr: 'İletişim', en: 'Contact', de: 'Kontakt', nl: 'Contact', it: 'Contatto', el: 'Επικοινωνία', ru: 'Контакт', es: 'Contacto', fr: 'Contact' },
  },
  {
    key: 'home.hero.title',
    namespace: 'home',
    values: { tr: 'Rüya Tatilinizi Bulun', en: 'Find Your Dream Vacation', de: 'Finden Sie Ihren Traumurlaub', nl: 'Vind uw droomvakantie', it: '', el: '', ru: 'Найдите отпуск своей мечты', es: '', fr: '' },
  },
  {
    key: 'home.hero.subtitle',
    namespace: 'home',
    values: { tr: 'Dünya genelinde binlerce otel arasından seçin', en: 'Choose from thousands of hotels worldwide', de: 'Wählen Sie aus tausenden Hotels weltweit', nl: '', it: '', el: '', ru: '', es: '', fr: '' },
  },
  {
    key: 'search.title',
    namespace: 'search',
    values: { tr: 'Arama Sonuçları', en: 'Search Results', de: 'Suchergebnisse', nl: 'Zoekresultaten', it: 'Risultati', el: 'Αποτελέσματα', ru: 'Результаты', es: 'Resultados', fr: 'Résultats' },
  },
  {
    key: 'hotel.book',
    namespace: 'hotel',
    values: { tr: 'Rezervasyon Yap', en: 'Book Now', de: 'Jetzt buchen', nl: 'Boek nu', it: 'Prenota ora', el: 'Κράτηση', ru: 'Забронировать', es: 'Reservar', fr: 'Réserver' },
  },
];

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>(mockTranslations);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingLocale, setEditingLocale] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const startEditing = (key: string, locale: string, value: string) => {
    setEditingKey(key);
    setEditingLocale(locale);
    setEditingValue(value);
  };

  const saveEditing = () => {
    if (editingKey && editingLocale) {
      setTranslations(translations.map(t => {
        if (t.key === editingKey) {
          return {
            ...t,
            values: { ...t.values, [editingLocale]: editingValue },
          };
        }
        return t;
      }));
      message.success('Translation saved');
    }
    setEditingKey(null);
    setEditingLocale(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditingLocale(null);
    setEditingValue('');
  };

  const addTranslation = async () => {
    try {
      const values = await form.validateFields();
      const newTranslation: Translation = {
        key: `${values.namespace}.${values.key}`,
        namespace: values.namespace,
        values: locales.reduce((acc, locale) => {
          acc[locale.code] = values[locale.code] || '';
          return acc;
        }, {} as Record<string, string>),
      };
      setTranslations([...translations, newTranslation]);
      message.success('Translation added');
      setIsAddModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getCompletionStatus = (values: Record<string, string>) => {
    const total = locales.length;
    const filled = Object.values(values).filter(v => v && v.trim() !== '').length;
    return { filled, total, percent: Math.round((filled / total) * 100) };
  };

  const filteredTranslations = translations.filter(t => {
    const matchesNamespace = selectedNamespace === 'all' || t.namespace === selectedNamespace;
    const matchesSearch = t.key.toLowerCase().includes(searchText.toLowerCase()) ||
      Object.values(t.values).some(v => v.toLowerCase().includes(searchText.toLowerCase()));
    return matchesNamespace && matchesSearch;
  });

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      fixed: 'left' as const,
      render: (key: string, record: Translation) => {
        const status = getCompletionStatus(record.values);
        return (
          <Space direction="vertical" size={0}>
            <Text code copyable={{ text: key }}>{key}</Text>
            <Space size={4}>
              <Badge 
                status={status.percent === 100 ? 'success' : status.percent >= 50 ? 'warning' : 'error'} 
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {status.filled}/{status.total} translations
              </Text>
            </Space>
          </Space>
        );
      },
    },
    ...locales.map(locale => ({
      title: (
        <Space>
          <span>{locale.flag}</span>
          <span>{locale.code.toUpperCase()}</span>
        </Space>
      ),
      dataIndex: ['values', locale.code],
      key: locale.code,
      width: 200,
      render: (value: string, record: Translation) => {
        const isEditing = editingKey === record.key && editingLocale === locale.code;
        
        if (isEditing) {
          return (
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ width: 'calc(100% - 32px)' }}
                autoFocus
              />
              <Button type="primary" icon={<SaveOutlined />} onClick={saveEditing} />
            </Space.Compact>
          );
        }

        const isEmpty = !value || value.trim() === '';
        
        return (
          <div
            onClick={() => startEditing(record.key, locale.code, value || '')}
            style={{
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              minHeight: 32,
              backgroundColor: isEmpty ? '#fff2f0' : 'transparent',
              border: isEmpty ? '1px dashed #ff7875' : '1px solid transparent',
            }}
          >
            {isEmpty ? (
              <Text type="secondary" italic>
                <ExclamationCircleOutlined style={{ color: '#ff7875', marginRight: 4 }} />
                Missing translation
              </Text>
            ) : (
              <Text>{value}</Text>
            )}
          </div>
        );
      },
    })),
  ];

  // Stats
  const totalKeys = translations.length;
  const completeKeys = translations.filter(t => 
    getCompletionStatus(t.values).percent === 100
  ).length;
  const incompleteKeys = totalKeys - completeKeys;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TranslationOutlined style={{ marginRight: 12 }} />
          Translations
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          New Translation
        </Button>
      </div>

      {/* Stats */}
      <Space style={{ marginBottom: 24 }}>
        <Tag color="blue">Total: {totalKeys} keys</Tag>
        <Tag color="green" icon={<CheckCircleOutlined />}>Complete: {completeKeys}</Tag>
        <Tag color="orange" icon={<ExclamationCircleOutlined />}>Missing: {incompleteKeys}</Tag>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search key or translation..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            value={selectedNamespace}
            onChange={setSelectedNamespace}
            style={{ width: 200 }}
            options={[
              { label: 'All Namespaces', value: 'all' },
              ...namespaces.map(ns => ({ label: ns.label, value: ns.key })),
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredTranslations}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} translations`,
          }}
        />
      </Card>

      {/* Add Translation Modal */}
      <Modal
        title="Add New Translation"
        open={isAddModalOpen}
        onOk={addTranslation}
        onCancel={() => {
          setIsAddModalOpen(false);
          form.resetFields();
        }}
        okText="Add"
        cancelText="Cancel"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item
              name="namespace"
              label="Namespace"
              rules={[{ required: true, message: 'Select a namespace' }]}
              style={{ flex: 1 }}
            >
              <Select options={namespaces.map(ns => ({ label: ns.label, value: ns.key }))} />
            </Form.Item>
            <Form.Item
              name="key"
              label="Key"
              rules={[
                { required: true, message: 'Enter a key' },
                { pattern: /^[a-zA-Z0-9._]+$/, message: 'Only letters, numbers, dots and underscores' },
              ]}
              style={{ flex: 2 }}
            >
              <Input placeholder="hero.title" />
            </Form.Item>
          </Space>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {locales.map(locale => (
              <Form.Item
                key={locale.code}
                name={locale.code}
                label={
                  <Space>
                    <span>{locale.flag}</span>
                    <span>{locale.name}</span>
                  </Space>
                }
              >
                <TextArea rows={2} placeholder={`${locale.name} translation`} />
              </Form.Item>
            ))}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
