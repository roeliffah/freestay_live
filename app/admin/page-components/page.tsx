'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Layout, Button, Card, message, Spin } from 'antd';
import { PlusOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import ComponentPalette from './ComponentPalette';
import ComponentCanvas from './ComponentCanvas';
import ComponentSettings from './ComponentSettings';

const { Content, Sider } = Layout;

interface PageComponent {
  id: number;
  componentType: string;
  title: string;
  position: number;
  isActive: boolean;
  configuration: any;
  cacheEnabled?: boolean;
  cacheDuration?: number;
  cssClasses?: string;
}

export default function PageComponentManager() {
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pageId = 1; // HomePage

  // Load components
  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/${pageId}?includeInactive=true`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        setComponents(result.data.components || []);
        message.success('Components loaded successfully');
      } else {
        message.error('Failed to load components');
      }
    } catch (error) {
      console.error('Error loading components:', error);
      message.error('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = components.findIndex((c) => c.id === active.id);
    const newIndex = components.findIndex((c) => c.id === over.id);

    const newComponents = arrayMove(components, oldIndex, newIndex).map((c, idx) => ({
      ...c,
      position: idx + 1
    }));

    setComponents(newComponents);

    // Update positions in backend
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify({
            pageId,
            components: newComponents.map(c => ({ id: c.id, position: c.position }))
          })
        }
      );

      if (response.ok) {
        message.success('Component order updated');
      } else {
        message.error('Failed to update order');
        // Revert on error
        loadComponents();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      message.error('Failed to update order');
      loadComponents();
    }
  };

  // Add new component from palette
  const handleAddComponent = async (componentType: string) => {
    try {
      const newComponent = {
        pageId,
        pageName: 'HomePage',
        componentType,
        title: `New ${componentType} Component`,
        position: components.length + 1,
        isActive: true,
        configuration: getDefaultConfiguration(componentType),
        cacheEnabled: true,
        cacheDuration: 3600,
        cssClasses: ''
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(newComponent)
        }
      );

      if (response.ok) {
        const result = await response.json();
        message.success('Component added successfully');
        loadComponents();
        setSelectedComponent(result.data);
      } else {
        message.error('Failed to add component');
      }
    } catch (error) {
      console.error('Error adding component:', error);
      message.error('Failed to add component');
    }
  };

  // Update component
  const handleUpdateComponent = async (componentId: number, updates: Partial<PageComponent>) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/${componentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (response.ok) {
        message.success('Component updated successfully');
        loadComponents();
      } else {
        message.error('Failed to update component');
      }
    } catch (error) {
      console.error('Error updating component:', error);
      message.error('Failed to update component');
    }
  };

  // Delete component
  const handleDeleteComponent = async (componentId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/${componentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );

      if (response.ok) {
        message.success('Component deleted successfully');
        loadComponents();
        if (selectedComponent?.id === componentId) {
          setSelectedComponent(null);
        }
      } else {
        message.error('Failed to delete component');
      }
    } catch (error) {
      console.error('Error deleting component:', error);
      message.error('Failed to delete component');
    }
  };

  // Toggle component active status
  const handleToggleComponent = async (componentId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/${componentId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );

      if (response.ok) {
        message.success('Component status updated');
        loadComponents();
      } else {
        message.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling component:', error);
      message.error('Failed to update status');
    }
  };

  // Refresh cache
  const handleRefreshCache = async (componentId: number) => {
    try {
      message.loading({ content: 'Refreshing cache...', key: 'cache' });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/page-components/${componentId}/refresh-cache`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: JSON.stringify({ forceRefresh: true })
        }
      );

      if (response.ok) {
        message.success({ content: 'Cache refreshed successfully', key: 'cache' });
        loadComponents();
      } else {
        message.error({ content: 'Failed to refresh cache', key: 'cache' });
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      message.error({ content: 'Failed to refresh cache', key: 'cache' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homepage Component Manager</h1>
          <p className="text-gray-500 text-sm">Drag and drop components to customize your homepage</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<EyeOutlined />} onClick={() => window.open('/', '_blank')}>
            Preview
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => message.info('Auto-saved')}>
            All Saved
          </Button>
        </div>
      </div>

      <Layout>
        {/* Left Sidebar - Component Palette */}
        <Sider width={280} className="bg-white border-r" theme="light">
          <ComponentPalette onAddComponent={handleAddComponent} />
        </Sider>

        {/* Center - Canvas */}
        <Content className="p-6">
          <Card className="shadow-sm">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ComponentCanvas
                  components={components}
                  selectedComponent={selectedComponent}
                  onSelectComponent={setSelectedComponent}
                  onToggleComponent={handleToggleComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onRefreshCache={handleRefreshCache}
                />
              </SortableContext>
            </DndContext>
          </Card>
        </Content>

        {/* Right Sidebar - Settings */}
        <Sider width={350} className="bg-white border-l" theme="light">
          <ComponentSettings
            component={selectedComponent}
            onUpdate={(updates) => {
              if (selectedComponent) {
                handleUpdateComponent(selectedComponent.id, updates);
              }
            }}
            onRefreshCache={() => {
              if (selectedComponent) {
                handleRefreshCache(selectedComponent.id);
              }
            }}
          />
        </Sider>
      </Layout>
    </Layout>
  );
}

// Default configurations for component types
function getDefaultConfiguration(componentType: string): any {
  const defaults: Record<string, any> = {
    hotels: {
      layout: 'grid-3',
      fetchMode: 'auto',
      autoQuery: {
        stars: 5,
        count: 6
      },
      showPrice: false,
      showRating: true
    },
    destinations: {
      layout: 'featured-grid',
      fetchMode: 'auto',
      autoQuery: {
        count: 5
      },
      showHotelCount: true
    },
    'image-banner': {
      imageUrl: '',
      link: '',
      height: '400px',
      overlay: true,
      overlayOpacity: 0.4,
      buttonText: 'Learn More'
    },
    html: {
      htmlContent: '<div class="text-center py-16"><h2>Custom HTML Content</h2></div>',
      allowScripts: false,
      sanitize: true
    },
    'affiliate-widget': {
      affiliateType: 'carRental',
      displayMode: 'embed',
      widgetCode: ''
    }
  };

  return defaults[componentType] || {};
}
