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
  Table,
  Badge,
  Image as AntImage,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  StarFilled,
  TagsOutlined,
} from '@ant-design/icons';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Multi-language support
const LOCALES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
];

interface Translation {
  locale: string;
  title: string;
  subtitle?: string;
}

interface HomePageSection {
  id: string;
  sectionType: string;
  isActive: boolean;
  displayOrder: number;
  configuration: any;
  translations: { [locale: string]: Translation };
  hotelCount?: number;
  destinationCount?: number;
}

interface Hotel {
  id: string;
  name: string;
  destination: string;
  stars: number;
  rating: number;
  image: string;
  priceFrom: number;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  hotelCount: number;
  image: string;
}

const SECTION_TYPES = [
  { 
    value: 'hero', 
    label: 'Hero Section', 
    icon: '🎯', 
    description: 'Main banner with search',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'room-types', 
    label: 'Room Types', 
    icon: '🏨', 
    description: 'Hotel, Resort, Apart, Villa',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'features', 
    label: 'Features', 
    icon: '✨', 
    description: 'Best price, Secure, Support',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'featured-hotels', 
    label: 'Featured Hotels', 
    icon: '⭐', 
    description: 'Featured hotels grid',
    hasTranslations: true,
    hasHotels: true,
    hasDestinations: false,
  },
  { 
    value: 'popular-destinations', 
    label: 'Popular Destinations', 
    icon: '🌍', 
    description: 'Top destinations',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: true,
  },
  { 
    value: 'popular-countries', 
    label: 'Popular Countries', 
    icon: '🌏', 
    description: 'Featured countries',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
    hasCountries: true,
  },
  { 
    value: 'romantic-tours', 
    label: 'Romantic Tours', 
    icon: '💑', 
    description: 'Romantic themed hotels',
    hasTranslations: true,
    hasHotels: true,
    hasDestinations: false,
  },
  { 
    value: 'themed-hotels', 
    label: 'Themed Hotels', 
    icon: '🎨', 
    description: 'Hotels by theme (spa, luxury, family, etc)',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
    hasThemes: true,
  },
  { 
    value: 'campaign-banner', 
    label: 'Campaign Banner', 
    icon: '🎉', 
    description: 'Special offers banner',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'travel-cta', 
    label: 'Travel CTA Cards', 
    icon: '✈️', 
    description: 'Excursions, Car, Flight',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'final-cta', 
    label: 'Final CTA', 
    icon: '🚀', 
    description: 'Call to action buttons',
    hasTranslations: true,
    hasHotels: false,
    hasDestinations: false,
  },
  { 
    value: 'custom-html', 
    label: 'Custom HTML', 
    icon: '📝', 
    description: 'Custom HTML content',
    hasTranslations: false,
    hasHotels: false,
    hasDestinations: false,
  },
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
  const [translationsModalOpen, setTranslationsModalOpen] = useState(false);
  const [hotelsModalOpen, setHotelsModalOpen] = useState(false);
  const [destinationsModalOpen, setDestinationsModalOpen] = useState(false);
  const [countriesModalOpen, setCountriesModalOpen] = useState(false);
  const [themesModalOpen, setThemesModalOpen] = useState(false);
  const [configBuilderModalOpen, setConfigBuilderModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomePageSection | null>(null);
  const [selectedSection, setSelectedSection] = useState<HomePageSection | null>(null);
  const [selectedSectionType, setSelectedSectionType] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [form] = Form.useForm();
  const [translationsForm] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px hareket ettikten sonra drag başlar
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch sections');

      const data = await response.json();
      const sectionsData = data.data || data;
      // Sort by displayOrder
      const sortedSections = Array.isArray(sectionsData) 
        ? sectionsData.sort((a, b) => a.displayOrder - b.displayOrder)
        : sectionsData;
      setSections(sortedSections);
    } catch (error) {
      message.error('Failed to load sections');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      console.log('🔄 Drag ended - moving from', active.id, 'to', over.id);
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);
      console.log('📊 Old index:', oldIndex, 'New index:', newIndex);

      const newSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        displayOrder: index + 1,
      }));
      console.log('📋 New order:', newSections.map(s => `${s.sectionType}(${s.displayOrder})`));

      setSections(newSections);

      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          message.error('Session expired. Please login again.');
          window.location.href = '/admin/login';
          return;
        }

        console.log('📤 Sending reorder request:', newSections.map(s => ({ id: s.id, displayOrder: s.displayOrder })));
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/reorder`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sections: newSections.map(s => ({ id: s.id, displayOrder: s.displayOrder })),
          }),
        });
        console.log('📥 Reorder response status:', response.status);

        if (response.status === 401) {
          message.error('Session expired. Please login again.');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }

        if (!response.ok) throw new Error('Failed to reorder');
        message.success('Order updated successfully');
      } catch (error) {
        message.error('Failed to update order');
        loadSections();
      }
    }
  };

  const handleOpenModal = (section?: HomePageSection) => {
    setEditingSection(section || null);
    
    if (section) {
      form.setFieldsValue({
        sectionType: section.sectionType,
        isActive: section.isActive,
        configuration: JSON.stringify(section.configuration, null, 2),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    
    setModalOpen(true);
  };

  const handleSaveSection = async (values: any) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const payload = {
        sectionType: values.sectionType,
        isActive: values.isActive,
        displayOrder: editingSection ? editingSection.displayOrder : sections.length + 1,
        configuration: values.configuration || '{}',
      };

      const url = editingSection
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${editingSection.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections`;

      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to save section');

      message.success(editingSection ? 'Section updated successfully' : 'Section created successfully');
      setModalOpen(false);
      loadSections();
    } catch (error) {
      message.error('Operation failed');
      console.error(error);
    }
  };

  const handleDeleteSection = async (id: string) => {
    try {
      console.log('🗑️ Deleting section:', id);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('🗑️ Delete response status:', response.status);

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to delete');

      message.success('Section deleted successfully');
      loadSections();
    } catch (error) {
      message.error('Failed to delete section');
      console.error(error);
    }
  };

  const handleToggleActive = async (section: HomePageSection) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to toggle');

      message.success(section.isActive ? 'Section deactivated' : 'Section activated');
      loadSections();
    } catch (error) {
      message.error('Operation failed');
      console.error(error);
    }
  };

  const handleOpenTranslations = async (section: HomePageSection) => {
    console.log('📝 handleOpenTranslations called', section.id);
    setSelectedSection(section);
    
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/translations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to load translations');

      const data = await response.json();
      const translations = data.data || data;

      // Set form values for each locale
      const formValues: any = {};
      LOCALES.forEach(locale => {
        const translation = translations[locale.code];
        formValues[`${locale.code}_title`] = translation?.title || '';
        formValues[`${locale.code}_subtitle`] = translation?.subtitle || '';
      });

      translationsForm.setFieldsValue(formValues);
      console.log('✅ Opening translations modal');
      setTranslationsModalOpen(true);
    } catch (error) {
      message.error('Failed to load translations');
      console.error(error);
    }
  };

  const handleSaveTranslations = async (values: any) => {
    if (!selectedSection) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const translations: { [locale: string]: { title: string; subtitle: string } } = {};
      LOCALES.forEach(locale => {
        translations[locale.code] = {
          title: values[`${locale.code}_title`] || '',
          subtitle: values[`${locale.code}_subtitle`] || '',
        };
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${selectedSection.id}/translations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ translations }),
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to save translations');

      message.success('Translations saved successfully');
      setTranslationsModalOpen(false);
      setSelectedSection(null);
      loadSections();
    } catch (error) {
      message.error('Failed to save translations');
      console.error(error);
    }
  };

  const handleOpenHotels = (section: HomePageSection) => {
    console.log('🏨 handleOpenHotels called', section.id);
    setSelectedSection(section);
    console.log('✅ Opening hotels modal');
    setHotelsModalOpen(true);
  };

  const handleOpenDestinations = (section: HomePageSection) => {
    console.log('🗺️ handleOpenDestinations called', section.id);
    setSelectedSection(section);
    console.log('✅ Opening destinations modal');
    setDestinationsModalOpen(true);
  };

  const handleOpenConfigBuilder = () => {
    const sectionType = form.getFieldValue('sectionType');
    if (!sectionType) {
      message.warning('Please select section type first');
      return;
    }
    setSelectedSectionType(sectionType);
    const typeInfo = getSectionTypeInfo(sectionType);
    if (typeInfo.hasHotels) {
      setConfigBuilderModalOpen(true);
    } else if (typeInfo.hasDestinations) {
      setConfigBuilderModalOpen(true);
    } else if (typeInfo.hasCountries) {
      setCountriesModalOpen(true);
    } else if (typeInfo.hasThemes) {
      setThemesModalOpen(true);
    } else {
      message.info('This section type does not require data selection');
    }
  };

  const handleConfigBuilderSuccess = (selectedIds: string[], type: 'hotels' | 'destinations') => {
    const configData = type === 'hotels' 
      ? { hotelIds: selectedIds }
      : { destinationIds: selectedIds };
    
    form.setFieldsValue({
      configuration: JSON.stringify(configData, null, 2)
    });
    setConfigBuilderModalOpen(false);
    setSelectedSectionType('');
    message.success('Configuration updated successfully');
  };

  const handleCountriesSuccess = (selectedIds: string[]) => {
    const configData = { countryIds: selectedIds };
    form.setFieldsValue({
      configuration: JSON.stringify(configData, null, 2)
    });
    setCountriesModalOpen(false);
    setSelectedSection(null);
    message.success('Countries selected successfully');
  };

  const handleThemesSuccess = (selectedIds: string[]) => {
    const configData = { themeIds: selectedIds };
    form.setFieldsValue({
      configuration: JSON.stringify(configData, null, 2)
    });
    setThemesModalOpen(false);
    setSelectedSection(null);
    message.success('Themes selected successfully');
  };

  const getSectionTypeInfo = (type: string) => {
    return SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[0];
  };

  const renderSectionCard = (section: HomePageSection) => {
    const sectionType = getSectionTypeInfo(section.sectionType);
    const trTranslation = section.translations?.['tr'];

    return {
      key: section.id,
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '8px' : '0',
          width: '100%'
        }}>
          <Space>
            <span style={{ fontSize: isMobile ? '16px' : '20px' }}>{sectionType.icon}</span>
            <div>
              <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>{sectionType.label}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                {trTranslation?.title || 'No translation added'}
              </Text>
            </div>
          </Space>
          <Space wrap>
            <Tag color={section.isActive ? 'green' : 'red'}>
              {section.isActive ? 'Active' : 'Inactive'}
            </Tag>
            <Tag>Order: {section.displayOrder}</Tag>
          </Space>
        </div>
      ),
      extra: (
        <Space wrap style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {sectionType.hasTranslations && (
            <Button
              icon={<GlobalOutlined />}
              size="small"
              onClick={(e) => {
                console.log('🌐 Translations button clicked', section.id);
                e.stopPropagation();
                handleOpenTranslations(section);
              }}
              title="Edit Translations"
            >
              {!isMobile && (section.translations ? Object.keys(section.translations).length : 0)}
            </Button>
          )}
          {sectionType.hasHotels && (
            <Button
              icon={<HomeOutlined />}
              size="small"
              onClick={(e) => {
                console.log('🏠 Hotels button clicked', section.id);
                e.stopPropagation();
                handleOpenHotels(section);
              }}
              title="Select Hotels"
            >
              {!isMobile && <Badge count={section.hotelCount || 0} showZero />}
            </Button>
          )}
          {sectionType.hasDestinations && (
            <Button
              icon={<EnvironmentOutlined />}
              size="small"
              onClick={(e) => {
                console.log('📍 Destinations button clicked', section.id);
                e.stopPropagation();
                handleOpenDestinations(section);
              }}
              title="Select Destinations"
            >
              {!isMobile && <Badge count={section.destinationCount || 0} showZero />}
            </Button>
          )}
          {sectionType.hasCountries && (
            <Button
              icon={<GlobalOutlined />}
              size="small"
              onClick={(e) => {
                console.log('🌍 Countries button clicked', section.id);
                e.stopPropagation();
                setSelectedSection(section);
                setCountriesModalOpen(true);
              }}
              title="Select Countries"
            >
              {!isMobile && <Badge count={section.configuration?.countryIds?.length || 0} showZero />}
            </Button>
          )}
          {sectionType.hasThemes && (
            <Button
              icon={<TagsOutlined />}
              size="small"
              onClick={(e) => {
                console.log('🏷️ Themes button clicked', section.id);
                e.stopPropagation();
                setSelectedSection(section);
                setThemesModalOpen(true);
              }}
              title="Select Themes"
            >
              {!isMobile && <Badge count={section.configuration?.themeIds?.length || 0} showZero />}
            </Button>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={section.isActive}
              onChange={(checked) => {
                console.log('🔄 Switch toggled', section.id, checked);
                handleToggleActive(section);
              }}
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
            />
          </div>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              console.log('✏️ Edit button clicked', section.id);
              e.stopPropagation();
              handleOpenModal(section);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this section?"
            onConfirm={() => {
              console.log('🗑️ Delete confirmed', section.id);
              handleDeleteSection(section.id);
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger 
              onClick={(e) => {
                console.log('🗑️ Delete button clicked', section.id);
                e.stopPropagation();
              }}
            />
          </Popconfirm>
          {!isMobile && <DragOutlined style={{ cursor: 'grab', fontSize: '16px' }} />}
        </Space>
      ),
      children: (
        <div style={{ padding: isMobile ? '8px' : '0' }}>
          <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>{sectionType.description}</Text>
          <br />
          <br />
          <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Configuration:</Text>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: isMobile ? '8px' : '10px', 
            borderRadius: '4px', 
            fontSize: isMobile ? '10px' : '12px',
            overflow: 'auto',
            maxWidth: '100%'
          }}>
            {JSON.stringify(section.configuration, null, 2)}
          </pre>
        </div>
      ),
    };
  };

  const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card>
        <div style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: '16px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0, fontSize: isMobile ? '20px' : '30px' }}>
              Homepage Sections
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>Manage homepage components</Text>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleOpenModal()}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Add New Section
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section) => {
                const sectionCard = renderSectionCard(section);
                const isExpanded = expandedSections.includes(section.id);
                
                return (
                  <SortableItem key={section.id} id={section.id}>
                    <Card className="overflow-hidden">
                      <div 
                        className="p-4"
                        style={{ 
                          display: 'flex', 
                          alignItems: isMobile ? 'flex-start' : 'center', 
                          justifyContent: 'space-between',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? '8px' : '0'
                        }}
                      >
                        <div 
                          className="cursor-pointer hover:opacity-70 flex-1"
                          onClick={() => {
                            setExpandedSections(prev => 
                              prev.includes(section.id) 
                                ? prev.filter(id => id !== section.id)
                                : [...prev, section.id]
                            );
                          }}
                        >
                          {sectionCard.label}
                        </div>
                        <div>
                          {sectionCard.extra}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t p-4 bg-gray-50">
                          {sectionCard.children}
                        </div>
                      )}
                    </Card>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {sections.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">No sections added yet</Text>
          </div>
        )}
      </Card>

      {/* Section Create/Edit Modal */}
      <Modal
        title={editingSection ? 'Edit Section' : 'Add New Section'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={isMobile ? '100%' : 700}
        style={{ top: isMobile ? 0 : undefined }}
        okText={editingSection ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSection}>
          <Form.Item
            name="sectionType"
            label="Section Type"
            rules={[{ required: true, message: 'Please select section type' }]}
          >
            <Select 
              disabled={!!editingSection} 
              placeholder="Select section type"
              onChange={(value) => setSelectedSectionType(value)}
            >
              {SECTION_TYPES.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  <Space>
                    <span>{type.icon}</span>
                    <div>
                      <div>{type.label}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {type.description}
                      </Text>
                    </div>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {selectedSectionType && (getSectionTypeInfo(selectedSectionType).hasHotels || getSectionTypeInfo(selectedSectionType).hasDestinations) && (
            <Button 
              icon={<SearchOutlined />} 
              onClick={handleOpenConfigBuilder}
              style={{ marginBottom: 8, width: '100%' }}
              type="dashed"
            >
              {getSectionTypeInfo(selectedSectionType).hasHotels ? '🏨 Search Hotels & Build JSON' : '🌍 Search Destinations & Build JSON'}
            </Button>
          )}

          <Form.Item
            name="configuration"
            label={selectedSectionType === 'custom-html' ? 'HTML Content' : 'Configuration (JSON)'}
            help={selectedSectionType === 'custom-html' ? 'Enter your custom HTML code' : 'Enter configuration in JSON format or use the builder'}
          >
            <TextArea 
              rows={selectedSectionType === 'custom-html' ? 15 : 10} 
              placeholder={selectedSectionType === 'custom-html' ? '<div>Your HTML content here...</div>' : '{"key": "value"}'}
              style={{ fontFamily: selectedSectionType === 'custom-html' ? 'monospace' : 'inherit' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Translations Modal */}
      <Modal
        title={
          <Space>
            <GlobalOutlined />
            <span>Edit Translations</span>
          </Space>
        }
        open={translationsModalOpen}
        onCancel={() => {
          setTranslationsModalOpen(false);
          setSelectedSection(null);
        }}
        onOk={() => translationsForm.submit()}
        width={isMobile ? '100%' : 900}
        style={{ top: isMobile ? 0 : undefined }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={translationsForm} layout="vertical" onFinish={handleSaveTranslations}>
          <Tabs
            items={LOCALES.map(locale => ({
              key: locale.code,
              label: (
                <Space>
                  <span>{locale.flag}</span>
                  <span>{locale.name}</span>
                </Space>
              ),
              children: (
                <div>
                  <Form.Item
                    name={`${locale.code}_title`}
                    label="Title"
                    rules={[{ required: true, message: 'Title is required' }]}
                  >
                    <Input placeholder="Section title" />
                  </Form.Item>
                  <Form.Item
                    name={`${locale.code}_subtitle`}
                    label="Subtitle"
                  >
                    <TextArea rows={3} placeholder="Section subtitle" />
                  </Form.Item>
                </div>
              ),
            }))}
          />
        </Form>
      </Modal>

      {/* Hotels Selection Modal */}
      <HotelsSelectionModal
        open={hotelsModalOpen}
        section={selectedSection}
        onClose={() => {
          setHotelsModalOpen(false);
          setSelectedSection(null);
        }}
        onSuccess={() => {
          setHotelsModalOpen(false);
          setSelectedSection(null);
          loadSections();
        }}
        isMobile={isMobile}
      />

      {/* Destinations Selection Modal */}
      <DestinationsSelectionModal
        open={destinationsModalOpen}
        section={selectedSection}
        onClose={() => {
          setDestinationsModalOpen(false);
          setSelectedSection(null);
        }}
        onSuccess={() => {
          setDestinationsModalOpen(false);
          setSelectedSection(null);
          loadSections();
        }}
        isMobile={isMobile}
      />

      {/* Countries Selection Modal */}
      <CountriesSelectionModal
        open={countriesModalOpen}
        section={selectedSection}
        onClose={() => {
          setCountriesModalOpen(false);
          setSelectedSection(null);
        }}
        onSuccess={handleCountriesSuccess}
        isMobile={isMobile}
      />

      {/* Themes Selection Modal */}
      <ThemesSelectionModal
        open={themesModalOpen}
        section={selectedSection}
        onClose={() => {
          setThemesModalOpen(false);
          setSelectedSection(null);
        }}
        onSuccess={handleThemesSuccess}
        isMobile={isMobile}
      />

      {/* Configuration Builder Modal */}
      <ConfigurationBuilderModal
        open={configBuilderModalOpen}
        sectionType={selectedSectionType}
        onClose={() => {
          setConfigBuilderModalOpen(false);
          setSelectedSectionType('');
        }}
        onSuccess={handleConfigBuilderSuccess}
        isMobile={isMobile}
      />
    </div>
  );
}

// Hotels Selection Modal Component
function HotelsSelectionModal({
  open,
  section,
  onClose,
  onSuccess,
  isMobile,
}: {
  open: boolean;
  section: HomePageSection | null;
  onClose: () => void;
  onSuccess: () => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (open && section) {
      loadSelectedHotels();
      if (!searchText) {
        loadHotels();
      }
    }
  }, [open, section]);

  useEffect(() => {
    if (open && searchText) {
      const timer = setTimeout(() => {
        loadHotels();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, open]);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const url = searchText 
        ? `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/hotels/search?q=${encodeURIComponent(searchText)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/hotels?pageSize=50`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load hotels');

      const data = await response.json();
      const hotelsData = data.data || data.items || data;

      const formattedHotels: Hotel[] = hotelsData.map((h: any) => {
        let imageUrl = 'https://via.placeholder.com/60x40?text=No+Image';
        
        // imageUrls is a STRING containing JSON array - parse it!
        if (h.imageUrls) {
          try {
            const parsedImages = typeof h.imageUrls === 'string' ? JSON.parse(h.imageUrls) : h.imageUrls;
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              imageUrl = parsedImages[0];
            }
          } catch (e) {
            console.warn('Failed to parse imageUrls:', h.imageUrls);
          }
        }
        // Fallback: Images array check
        else if (h.images && Array.isArray(h.images) && h.images.length > 0) {
          const firstImage = h.images[0];
          imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.path || firstImage);
        }
        // Fallback to single image fields
        else if (h.mainImage) imageUrl = h.mainImage;
        else if (h.image) imageUrl = h.image;
        else if (h.thumbnailUrl) imageUrl = h.thumbnailUrl;
        else if (h.imageUrl) imageUrl = h.imageUrl;
        
        return {
          id: h.id?.toString() || h.hotelId?.toString(),
          name: h.name || h.hotelName || 'Unknown',
          destination: h.city || h.destination?.name || h.destinationName || h.resort?.name || 'Unknown',
          stars: h.stars || h.category || 0,
          rating: h.rating || 0,
          image: imageUrl,
          priceFrom: h.priceFrom || 0,
        };
      });
      console.log('HotelsModal Hotels:', formattedHotels.slice(0, 2));
      setHotels(formattedHotels);
    } catch (error) {
      message.error('Failed to load hotels');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedHotels = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/hotels`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to load selected hotels');

      const data = await response.json();
      const hotelIds = (data.data || data).map((h: any) => h.hotelId || h.id);
      setSelectedHotelIds(hotelIds);
    } catch (error) {
      console.error('Error loading selected hotels:', error);
    }
  };

  const handleSaveHotels = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/hotels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            hotels: selectedHotelIds.map((hotelId, index) => ({
              hotelId,
              displayOrder: index + 1
            }))
          }),
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to save hotels');

      message.success('Hotels saved successfully');
      onSuccess();
    } catch (error) {
      message.error('Failed to save hotels');
      console.error(error);
    }
  };

  const toggleHotel = (hotelId: string) => {
    if (selectedHotelIds.includes(hotelId)) {
      setSelectedHotelIds(selectedHotelIds.filter(id => id !== hotelId));
    } else {
      setSelectedHotelIds([...selectedHotelIds, hotelId]);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Hotel',
      key: 'hotel',
      render: (_: any, hotel: Hotel) => (
        <Space>
          <img 
            src={hotel.image} 
            width={60} 
            height={40} 
            alt={hotel.name}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x40?text=No+Image';
            }}
          />
          <div>
            <div>{hotel.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {hotel.destination}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Stars',
      dataIndex: 'stars',
      key: 'stars',
      render: (stars: number) => (
        <Space>
          {Array.from({ length: stars }).map((_, i) => (
            <StarFilled key={i} style={{ color: '#faad14' }} />
          ))}
        </Space>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Tag color="blue">{rating}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'priceFrom',
      key: 'priceFrom',
      render: (price: number) => `€${price}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, hotel: Hotel) => (
        <Button
          type={selectedHotelIds.includes(hotel.id) ? 'primary' : 'default'}
          onClick={() => toggleHotel(hotel.id)}
        >
          {selectedHotelIds.includes(hotel.id) ? 'Remove' : 'Add'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <HomeOutlined />
          <span>Select Hotels</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSaveHotels}
      width={isMobile ? '100%' : 1000}
      style={{ top: isMobile ? 0 : undefined }}
      okText="Kaydet"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search hotels by name... (auto-search after typing)"
          prefix={<SearchOutlined />}
          suffix={loading && <span style={{ color: '#1890ff' }}>Searching...</span>}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {selectedHotelIds.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Selected Hotels ({selectedHotelIds.length}):</Text>
            <div style={{ marginTop: 8 }}>
              {selectedHotelIds.map(id => {
                const hotel = hotels.find(h => h.id === id);
                return hotel ? (
                  <Tag
                    key={id}
                    closable
                    onClose={() => toggleHotel(id)}
                    style={{ marginBottom: 4 }}
                  >
                    {hotel.name}
                  </Tag>
                ) : null;
              })}
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>JSON Payload:</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px', 
              fontSize: '11px',
              maxHeight: '120px',
              overflow: 'auto'
            }}>
              {JSON.stringify({
                hotels: selectedHotelIds.map((hotelId, index) => ({
                  hotelId,
                  displayOrder: index + 1
                }))
              }, null, 2)}
            </pre>
          </div>
        </>
      )}

      <Table
        columns={columns}
        dataSource={filteredHotels || []}
        rowKey={(record) => record.id || `hotel-${Math.random()}`}
        loading={loading}
        pagination={{
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (current, size) => setPageSize(size),
          onChange: (page, size) => setPageSize(size),
          showTotal: (total) => `Total ${total} hotels`,
        }}
        scroll={{ x: 800 }}
      />
    </Modal>
  );
}

// Configuration Builder Modal Component
function ConfigurationBuilderModal({
  open,
  sectionType,
  onClose,
  onSuccess,
  isMobile,
}: {
  open: boolean;
  sectionType: string;
  onClose: () => void;
  onSuccess: (selectedIds: string[], type: 'hotels' | 'destinations') => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const sectionTypeInfo = SECTION_TYPES.find(t => t.value === sectionType);
  const isHotelType = sectionTypeInfo?.hasHotels || false;
  const isDestinationType = sectionTypeInfo?.hasDestinations || false;

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearchText('');
      if (!searchText) {
        loadItems();
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && searchText) {
      const timer = setTimeout(() => {
        loadItems();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, open]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let url = '';
      if (isHotelType) {
        url = searchText 
          ? `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/hotels/search?q=${encodeURIComponent(searchText)}&pageSize=50`
          : `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/hotels?pageSize=50`;
      } else if (isDestinationType) {
        url = searchText 
          ? `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/destinations/search?q=${encodeURIComponent(searchText)}`
          : `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/destinations?pageSize=50`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load items');

      const data = await response.json();
      const itemsData = data.data || data.items || data;

      console.log('🔍 Raw API Response:', {
        total: itemsData.length,
        firstItem: itemsData[0],
        imageFields: itemsData[0] ? Object.keys(itemsData[0]).filter((k: string) => k.toLowerCase().includes('image')) : [],
        imageUrls: itemsData[0]?.imageUrls,
        imageUrlsType: typeof itemsData[0]?.imageUrls,
      });

      if (isHotelType) {
        const formattedItems = itemsData.map((h: any, index: number) => {
          let imageUrl = 'https://via.placeholder.com/60x40?text=No+Image';
          
          // imageUrls is a STRING containing JSON array - parse it!
          if (h.imageUrls) {
            try {
              const parsedImages = typeof h.imageUrls === 'string' ? JSON.parse(h.imageUrls) : h.imageUrls;
              if (index === 0) console.log('🎨 Parsed imageUrls:', parsedImages);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                imageUrl = parsedImages[0];
                if (index === 0) console.log('🖼️ First image URL:', imageUrl);
              }
            } catch (e) {
              console.warn('❌ Failed to parse imageUrls for', h.name, ':', e);
            }
          }
          // Fallback: Images array check
          else if (h.images && Array.isArray(h.images) && h.images.length > 0) {
            const firstImage = h.images[0];
            imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.path || firstImage);
            if (index === 0) console.log('🖼️ From images array:', imageUrl);
          }
          // Fallback to single image fields
          else if (h.mainImage) imageUrl = h.mainImage;
          else if (h.image) imageUrl = h.image;
          else if (h.thumbnailUrl) imageUrl = h.thumbnailUrl;
          else if (h.imageUrl) imageUrl = h.imageUrl;
          
          return {
            id: h.id?.toString() || h.hotelId?.toString(),
            name: h.name || h.hotelName || 'Unknown',
            destination: h.city || h.destination?.name || h.destinationName || h.resort?.name || h.resortName || 'Unknown',
            stars: h.stars || h.category || 0,
            rating: h.rating || 0,
            image: imageUrl,
            priceFrom: h.priceFrom || 0,
          };
        });
        console.log('✅ Formatted Hotels (first 2):', formattedItems.slice(0, 2));
        setItems(formattedItems);
      } else if (isDestinationType) {
        const formattedItems = itemsData.map((d: any) => ({
          id: d.id?.toString() || d.destinationId?.toString(),
          name: d.name || d.destinationName || 'Unknown',
          country: d.country?.name || d.countryName || 'Unknown',
          hotelCount: d.hotelCount || d.totalHotels || 0,
          image: d.image || 'https://via.placeholder.com/60x40',
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      message.error('Failed to load items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      message.warning('Please select at least one item');
      return;
    }
    onSuccess(selectedIds, isHotelType ? 'hotels' : 'destinations');
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = isHotelType ? [
    {
      title: 'Hotel',
      key: 'hotel',
      render: (_: any, item: any) => (
        <Space>
          <img 
            src={item.image} 
            width={60} 
            height={40} 
            alt={item.name}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x40?text=No+Image';
            }}
          />
          <div>
            <div>{item.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {item.destination}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Stars',
      dataIndex: 'stars',
      key: 'stars',
      render: (stars: number) => (
        <Space>
          {Array.from({ length: stars }).map((_, i) => (
            <StarFilled key={i} style={{ color: '#faad14' }} />
          ))}
        </Space>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => <Tag color="blue">{rating}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, item: any) => (
        <Button
          type={selectedIds.includes(item.id) ? 'primary' : 'default'}
          onClick={() => toggleItem(item.id)}
        >
          {selectedIds.includes(item.id) ? 'Remove' : 'Add'}
        </Button>
      ),
    },
  ] : [
    {
      title: 'Destination',
      key: 'destination',
      render: (_: any, item: any) => (
        <Space>
          <img 
            src={item.image} 
            width={60} 
            height={40} 
            alt={item.name}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x40?text=No+Image';
            }}
          />
          <div>
            <div>{item.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {item.country}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Hotel Count',
      dataIndex: 'hotelCount',
      key: 'hotelCount',
      render: (count: number) => <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, item: any) => (
        <Button
          type={selectedIds.includes(item.id) ? 'primary' : 'default'}
          onClick={() => toggleItem(item.id)}
        >
          {selectedIds.includes(item.id) ? 'Remove' : 'Add'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          {isHotelType ? <HomeOutlined /> : <EnvironmentOutlined />}
          <span>{isHotelType ? 'Search Hotels' : 'Search Destinations'}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={isMobile ? '100%' : 1000}
      style={{ top: isMobile ? 0 : undefined }}
      okText="Build JSON"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder={`Search ${isHotelType ? 'hotels' : 'destinations'}...`}
          prefix={<SearchOutlined />}
          suffix={loading && <span style={{ color: '#1890ff' }}>Searching...</span>}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {selectedIds.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Selected ({selectedIds.length}):</Text>
          <div style={{ marginTop: 8 }}>
            {selectedIds.map(id => {
              const item = items.find(i => i.id === id);
              return item ? (
                <Tag
                  key={id}
                  closable
                  onClose={() => toggleItem(id)}
                  style={{ marginBottom: 4 }}
                >
                  {item.name}
                </Tag>
              ) : null;
            })}
          </div>
          
          <div style={{ marginTop: 16 }}>
            <Text strong>JSON Preview:</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px', 
              fontSize: '11px',
              maxHeight: '120px',
              overflow: 'auto'
            }}>
              {JSON.stringify(
                isHotelType 
                  ? { hotelIds: selectedIds }
                  : { destinationIds: selectedIds },
                null, 
                2
              )}
            </pre>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={items || []}
        rowKey={(record) => record.id || `item-${Math.random()}`}
        loading={loading}
        pagination={{
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (current, size) => setPageSize(size),
          onChange: (page, size) => setPageSize(size),
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 800 }}
      />
    </Modal>
  );
}

// Destinations Selection Modal Component
function DestinationsSelectionModal({
  open,
  section,
  onClose,
  onSuccess,
  isMobile,
}: {
  open: boolean;
  section: HomePageSection | null;
  onClose: () => void;
  onSuccess: () => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (open && section) {
      loadSelectedDestinations();
      if (!searchText) {
        loadDestinations();
      }
    }
  }, [open, section]);

  useEffect(() => {
    if (open && searchText) {
      const timer = setTimeout(() => {
        loadDestinations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchText, open]);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const url = searchText 
        ? `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/destinations/search?q=${encodeURIComponent(searchText)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/sunhotels/destinations?pageSize=50`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load destinations');

      const data = await response.json();
      const destinationsData = data.data || data.items || data;

      const formattedDestinations: Destination[] = destinationsData.map((d: any) => ({
        id: d.id?.toString() || d.destinationId?.toString(),
        name: d.name || d.destinationName || 'Unknown',
        country: d.country?.name || d.countryName || 'Unknown',
        hotelCount: d.hotelCount || d.totalHotels || 0,
        image: d.image || 'https://via.placeholder.com/60x40',
      }));

      setDestinations(formattedDestinations);
    } catch (error) {
      message.error('Failed to load destinations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDestinations = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/destinations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to load selected destinations');

      const data = await response.json();
      const destinationIds = (data.data || data).map((d: any) => d.destinationId || d.id);
      setSelectedDestinationIds(destinationIds);
    } catch (error) {
      console.error('Error loading selected destinations:', error);
    }
  };

  const handleSaveDestinations = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        message.error('Session expired. Please login again.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}/destinations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            destinations: selectedDestinationIds.map((destinationId, index) => ({
              destinationId,
              displayOrder: index + 1
            }))
          }),
        }
      );

      if (response.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to save destinations');

      message.success('Destinations saved successfully');
      onSuccess();
    } catch (error) {
      message.error('Failed to save destinations');
      console.error(error);
    }
  };

  const toggleDestination = (destinationId: string) => {
    if (selectedDestinationIds.includes(destinationId)) {
      setSelectedDestinationIds(selectedDestinationIds.filter(id => id !== destinationId));
    } else {
      setSelectedDestinationIds([...selectedDestinationIds, destinationId]);
    }
  };

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Destination',
      key: 'destination',
      render: (_: any, destination: Destination) => (
        <Space>
          <img 
            src={destination.image} 
            width={60} 
            height={40} 
            alt={destination.name}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x40?text=No+Image';
            }}
          />
          <div>
            <div>{destination.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {destination.country}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Hotel Count',
      dataIndex: 'hotelCount',
      key: 'hotelCount',
      render: (count: number) => <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, destination: Destination) => (
        <Button
          type={selectedDestinationIds.includes(destination.id) ? 'primary' : 'default'}
          onClick={() => toggleDestination(destination.id)}
        >
          {selectedDestinationIds.includes(destination.id) ? 'Remove' : 'Add'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined />
          <span>Select Destinations</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSaveDestinations}
      width={isMobile ? '100%' : 900}
      style={{ top: isMobile ? 0 : undefined }}
      okText="Kaydet"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search destinations..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {selectedDestinationIds.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>Selected Destinations ({selectedDestinationIds.length}):</Text>
          <div style={{ marginTop: 8 }}>
            {selectedDestinationIds.map(id => {
              const destination = destinations.find(d => d.id === id);
              return destination ? (
                <Tag
                  key={id}
                  closable
                  onClose={() => toggleDestination(id)}
                  style={{ marginBottom: 4 }}
                >
                  {destination.name}
                </Tag>
              ) : null;
            })}
          </div>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredDestinations || []}
        rowKey={(record) => record.id || `dest-${Math.random()}`}
        loading={loading}
        pagination={{
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (current, size) => setPageSize(size),
          onChange: (page, size) => setPageSize(size),
          showTotal: (total) => `Total ${total} destinations`,
        }}
        scroll={{ x: 600 }}
      />
    </Modal>
  );
}

// Countries Selection Modal Component
function CountriesSelectionModal({
  open,
  section,
  onClose,
  onSuccess,
  isMobile,
}: {
  open: boolean;
  section: HomePageSection | null;
  onClose: () => void;
  onSuccess: (selectedIds: string[]) => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && section) {
      const config = section.configuration as any;
      setSelectedCountryIds(config?.countryIds || []);
      loadCountries();
    }
  }, [open, section]);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sunhotels/countries`);
      
      if (!response.ok) throw new Error('Failed to load countries');

      const data = await response.json();
      const countriesData = data.data || data;
      setCountries(countriesData);
    } catch (error) {
      message.error('Failed to load countries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      const config = {
        ...section.configuration,
        countryIds: selectedCountryIds,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...section,
          configuration: config,
        }),
      });

      if (!response.ok) throw new Error('Failed to update section');

      message.success('Countries updated successfully');
      onSuccess(selectedCountryIds);
      onClose();
    } catch (error) {
      message.error('Failed to save countries');
      console.error(error);
    }
  };

  const toggleCountry = (id: string) => {
    if (selectedCountryIds.includes(id)) {
      setSelectedCountryIds(selectedCountryIds.filter(i => i !== id));
    } else {
      setSelectedCountryIds([...selectedCountryIds, id]);
    }
  };

  const columns = [
    {
      title: 'Country',
      key: 'country',
      render: (_: any, item: any) => (
        <Space>
          <span style={{ fontSize: '24px' }}>
            {String.fromCodePoint(...[...item.code.toUpperCase()].map((char: string) => 127397 + char.charCodeAt(0)))}
          </span>
          <div>
            <div>{item.name}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{item.destinationCount} destinations</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Select',
      key: 'select',
      render: (_: any, item: any) => (
        <Button
          type={selectedCountryIds.includes(item.countryId) ? 'primary' : 'default'}
          size="small"
          onClick={() => toggleCountry(item.countryId)}
        >
          {selectedCountryIds.includes(item.countryId) ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Select Countries"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={isMobile ? '100%' : 800}
      okText="Save"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Selected Countries ({selectedCountryIds.length}):</Text>
        <div style={{ marginTop: 8 }}>
          {selectedCountryIds.map(id => {
            const country = countries.find(c => c.countryId === id);
            return country ? (
              <Tag
                key={id}
                closable
                onClose={() => toggleCountry(id)}
                style={{ marginBottom: 4 }}
              >
                {country.name}
              </Tag>
            ) : null;
          })}
        </div>
      </div>

      <Table
        loading={loading}
        dataSource={countries || []}
        columns={columns}
        rowKey={(record) => record.countryId || `country-${Math.random()}`}
        size="small"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} countries`,
        }}
        scroll={{ x: 400 }}
      />
    </Modal>
  );
}

// Themes Selection Modal Component
function ThemesSelectionModal({
  open,
  section,
  onClose,
  onSuccess,
  isMobile,
}: {
  open: boolean;
  section: HomePageSection | null;
  onClose: () => void;
  onSuccess: (selectedIds: string[]) => void;
  isMobile: boolean;
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && section) {
      const config = section.configuration as any;
      setSelectedThemeIds(config?.themeIds?.map((id: number) => id.toString()) || []);
      loadThemes();
    }
  }, [open, section]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sunhotels/themes`);
      
      if (!response.ok) throw new Error('Failed to load themes');

      const data = await response.json();
      const themesData = data.data || data;
      setThemes(themesData);
    } catch (error) {
      message.error('Failed to load themes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;

    try {
      const token = localStorage.getItem('admin_token');
      const config = {
        ...section.configuration,
        themeIds: selectedThemeIds.map(id => parseInt(id)),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/homepage/sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...section,
          configuration: config,
        }),
      });

      if (!response.ok) throw new Error('Failed to update section');

      message.success('Themes updated successfully');
      onSuccess(selectedThemeIds);
      onClose();
    } catch (error) {
      message.error('Failed to save themes');
      console.error(error);
    }
  };

  const toggleTheme = (id: string) => {
    if (selectedThemeIds.includes(id)) {
      setSelectedThemeIds(selectedThemeIds.filter(i => i !== id));
    } else {
      setSelectedThemeIds([...selectedThemeIds, id]);
    }
  };

  const columns = [
    {
      title: 'Theme',
      key: 'theme',
      render: (_: any, item: any) => (
        <div>
          <div>{item.name}</div>
          {item.englishName && item.englishName !== item.name && (
            <div style={{ fontSize: '12px', color: '#888' }}>{item.englishName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Select',
      key: 'select',
      render: (_: any, item: any) => (
        <Button
          type={selectedThemeIds.includes(item.themeId.toString()) ? 'primary' : 'default'}
          size="small"
          onClick={() => toggleTheme(item.themeId.toString())}
        >
          {selectedThemeIds.includes(item.themeId.toString()) ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title="Select Themes"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={isMobile ? '100%' : 800}
      okText="Save"
      cancelText="Cancel"
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Selected Themes ({selectedThemeIds.length}):</Text>
        <div style={{ marginTop: 8 }}>
          {selectedThemeIds.map(id => {
            const theme = themes.find(t => t.themeId.toString() === id);
            return theme ? (
              <Tag
                key={id}
                closable
                onClose={() => toggleTheme(id)}
                style={{ marginBottom: 4 }}
              >
                {theme.name}
              </Tag>
            ) : null;
          })}
        </div>
      </div>

      <Table
        loading={loading}
        dataSource={themes || []}
        columns={columns}
        rowKey={(record) => record.themeId || `theme-${Math.random()}`}
        size="small"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} themes`,
        }}
        scroll={{ x: 400 }}
      />
    </Modal>
  );
}
