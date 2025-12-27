'use client';

import { useState, useEffect } from 'react';
import { 
  Input, 
  Select, 
  Switch, 
  Button, 
  Tabs, 
  InputNumber, 
  Radio, 
  Upload, 
  message,
  Divider,
  Tag
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  UploadOutlined,
  CloseOutlined 
} from '@ant-design/icons';
import HotelSelector from './settings/HotelSelector';
import DestinationSelector from './settings/DestinationSelector';
import HTMLEditor from './settings/HTMLEditor';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface PageComponent {
  id: number;
  componentType: string;
  title: string;
  isActive: boolean;
  configuration: any;
  cacheEnabled?: boolean;
  cacheDuration?: number;
  cssClasses?: string;
}

interface ComponentSettingsProps {
  component: PageComponent | null;
  onUpdate: (updates: Partial<PageComponent>) => void;
  onRefreshCache: () => void;
}

export default function ComponentSettings({
  component,
  onUpdate,
  onRefreshCache
}: ComponentSettingsProps) {
  const [localConfig, setLocalConfig] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (component) {
      setLocalConfig(component.configuration || {});
      setHasChanges(false);
    }
  }, [component]);

  if (!component) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-4">⚙️</div>
        <h3 className="font-semibold mb-2">No Component Selected</h3>
        <p className="text-sm">
          Select a component from the canvas to edit its settings
        </p>
      </div>
    );
  }

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({
      configuration: localConfig
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalConfig(component.configuration || {});
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Component Settings</h3>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => window.location.reload()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Tag color="blue">{component.componentType}</Tag>
          {hasChanges && <Tag color="warning">Unsaved Changes</Tag>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultActiveKey="general">
          <TabPane tab="General" key="general">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={component.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Component title"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active</label>
                <Switch
                  checked={component.isActive}
                  onChange={(checked) => onUpdate({ isActive: checked })}
                />
              </div>

              <Divider />

              {/* Component-specific settings */}
              {component.componentType === 'hotels' && (
                <HotelComponentSettings
                  config={localConfig}
                  onUpdate={updateConfig}
                />
              )}

              {component.componentType === 'destinations' && (
                <DestinationComponentSettings
                  config={localConfig}
                  onUpdate={updateConfig}
                />
              )}

              {component.componentType === 'image-banner' && (
                <ImageBannerSettings
                  config={localConfig}
                  onUpdate={updateConfig}
                />
              )}

              {component.componentType === 'html' && (
                <HTMLComponentSettings
                  config={localConfig}
                  onUpdate={updateConfig}
                />
              )}

              {component.componentType === 'affiliate-widget' && (
                <AffiliateWidgetSettings
                  config={localConfig}
                  onUpdate={updateConfig}
                />
              )}
            </div>
          </TabPane>

          <TabPane tab="Advanced" key="advanced">
            <div className="space-y-4">
              {/* Cache Settings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Enable Cache</label>
                  <Switch
                    checked={component.cacheEnabled}
                    onChange={(checked) => onUpdate({ cacheEnabled: checked })}
                  />
                </div>
                {component.cacheEnabled && (
                  <div className="ml-4">
                    <label className="block text-xs text-gray-500 mb-1">
                      Cache Duration (seconds)
                    </label>
                    <InputNumber
                      min={60}
                      max={86400}
                      value={component.cacheDuration || 3600}
                      onChange={(value) => onUpdate({ cacheDuration: value || undefined })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* CSS Classes */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  CSS Classes
                </label>
                <TextArea
                  value={component.cssClasses}
                  onChange={(e) => onUpdate({ cssClasses: e.target.value })}
                  placeholder="py-16 bg-gray-100"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tailwind CSS classes for custom styling
                </p>
              </div>

              {/* Refresh Cache Button */}
              {component.cacheEnabled && (
                <Button
                  block
                  icon={<ReloadOutlined />}
                  onClick={onRefreshCache}
                >
                  Refresh Cache Now
                </Button>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <Button
          block
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
        <Button
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

// Hotel Component Settings
function HotelComponentSettings({ config, onUpdate }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Layout</label>
        <Select
          value={config.layout || 'grid-3'}
          onChange={(value) => onUpdate('layout', value)}
          className="w-full"
        >
          <Select.Option value="grid-2">Grid 2 Columns</Select.Option>
          <Select.Option value="grid-3">Grid 3 Columns</Select.Option>
          <Select.Option value="grid-4">Grid 4 Columns</Select.Option>
          <Select.Option value="grid-5">Grid 5 Columns</Select.Option>
          <Select.Option value="carousel">Carousel</Select.Option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Fetch Mode</label>
        <Radio.Group
          value={config.fetchMode || 'auto'}
          onChange={(e) => onUpdate('fetchMode', e.target.value)}
        >
          <Radio value="manual">Manual (Select Hotels)</Radio>
          <Radio value="auto">Auto (Query)</Radio>
        </Radio.Group>
      </div>

      {config.fetchMode === 'manual' ? (
        <HotelSelector
          value={config.hotelIds || []}
          onChange={(ids) => onUpdate('hotelIds', ids)}
        />
      ) : (
        <div className="space-y-3 ml-4 p-3 bg-gray-50 rounded">
          <div>
            <label className="block text-xs font-medium mb-1">Stars</label>
            <Select
              value={config.autoQuery?.stars || 5}
              onChange={(value) => onUpdate('autoQuery', { ...config.autoQuery, stars: value })}
              className="w-full"
            >
              <Select.Option value={3}>3 Stars</Select.Option>
              <Select.Option value={4}>4 Stars</Select.Option>
              <Select.Option value={5}>5 Stars</Select.Option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Count</label>
            <InputNumber
              min={1}
              max={20}
              value={config.autoQuery?.count || 6}
              onChange={(value) => onUpdate('autoQuery', { ...config.autoQuery, count: value })}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm">Show Price</label>
        <Switch
          checked={config.showPrice || false}
          onChange={(checked) => onUpdate('showPrice', checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm">Show Rating</label>
        <Switch
          checked={config.showRating !== false}
          onChange={(checked) => onUpdate('showRating', checked)}
        />
      </div>
    </>
  );
}

// Destination Component Settings
function DestinationComponentSettings({ config, onUpdate }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Layout</label>
        <Select
          value={config.layout || 'featured-grid'}
          onChange={(value) => onUpdate('layout', value)}
          className="w-full"
        >
          <Select.Option value="grid-3">Grid 3 Columns</Select.Option>
          <Select.Option value="grid-4">Grid 4 Columns</Select.Option>
          <Select.Option value="featured-grid">Featured Grid (1+4)</Select.Option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Fetch Mode</label>
        <Radio.Group
          value={config.fetchMode || 'auto'}
          onChange={(e) => onUpdate('fetchMode', e.target.value)}
        >
          <Radio value="manual">Manual (Select Destinations)</Radio>
          <Radio value="auto">Auto (Query)</Radio>
        </Radio.Group>
      </div>

      {config.fetchMode === 'manual' ? (
        <DestinationSelector
          value={config.destinationIds || []}
          onChange={(ids) => onUpdate('destinationIds', ids)}
        />
      ) : (
        <div className="ml-4 p-3 bg-gray-50 rounded">
          <label className="block text-xs font-medium mb-1">Count</label>
          <InputNumber
            min={1}
            max={10}
            value={config.autoQuery?.count || 5}
            onChange={(value) => onUpdate('autoQuery', { ...config.autoQuery, count: value })}
            className="w-full"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm">Show Hotel Count</label>
        <Switch
          checked={config.showHotelCount !== false}
          onChange={(checked) => onUpdate('showHotelCount', checked)}
        />
      </div>
    </>
  );
}

// Image Banner Settings
function ImageBannerSettings({ config, onUpdate }: any) {
  const handleImageUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/upload/image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        onUpdate('imageUrl', result.data.url);
        message.success('Image uploaded successfully');
      } else {
        message.error('Upload failed');
      }
    } catch (error) {
      message.error('Upload failed');
    }

    return false; // Prevent default upload
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Banner Image</label>
        <Upload
          accept="image/*"
          beforeUpload={handleImageUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} block>
            Upload Image
          </Button>
        </Upload>
        {config.imageUrl && (
          <div className="mt-2">
            <img
              src={config.imageUrl}
              alt="Banner preview"
              className="w-full h-32 object-cover rounded"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link URL</label>
        <Input
          value={config.link || ''}
          onChange={(e) => onUpdate('link', e.target.value)}
          placeholder="/search?promo=summer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Button Text</label>
        <Input
          value={config.buttonText || ''}
          onChange={(e) => onUpdate('buttonText', e.target.value)}
          placeholder="Learn More"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Overlay Text</label>
        <Input
          value={config.overlayText || ''}
          onChange={(e) => onUpdate('overlayText', e.target.value)}
          placeholder="Summer Sale 2025"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm">Enable Overlay</label>
        <Switch
          checked={config.overlay !== false}
          onChange={(checked) => onUpdate('overlay', checked)}
        />
      </div>
    </>
  );
}

// HTML Component Settings
function HTMLComponentSettings({ config, onUpdate }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">HTML Content</label>
        <HTMLEditor
          value={config.htmlContent || ''}
          onChange={(value) => onUpdate('htmlContent', value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm">Sanitize HTML</label>
        <Switch
          checked={config.sanitize !== false}
          onChange={(checked) => onUpdate('sanitize', checked)}
        />
      </div>
    </>
  );
}

// Affiliate Widget Settings
function AffiliateWidgetSettings({ config, onUpdate }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Affiliate Type</label>
        <Select
          value={config.affiliateType || 'carRental'}
          onChange={(value) => onUpdate('affiliateType', value)}
          className="w-full"
        >
          <Select.Option value="carRental">Car Rental</Select.Option>
          <Select.Option value="excursions">Excursions</Select.Option>
          <Select.Option value="flightBooking">Flight Booking</Select.Option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Display Mode</label>
        <Select
          value={config.displayMode || 'embed'}
          onChange={(value) => onUpdate('displayMode', value)}
          className="w-full"
        >
          <Select.Option value="embed">Embed Widget</Select.Option>
          <Select.Option value="button">Button</Select.Option>
          <Select.Option value="banner">Banner</Select.Option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Widget Code</label>
        <TextArea
          value={config.widgetCode || ''}
          onChange={(e) => onUpdate('widgetCode', e.target.value)}
          placeholder="<script src='...'></script>"
          rows={4}
        />
      </div>

      {config.displayMode === 'button' && (
        <div>
          <label className="block text-sm font-medium mb-1">Button Text</label>
          <Input
            value={config.buttonText || ''}
            onChange={(e) => onUpdate('buttonText', e.target.value)}
            placeholder="Rent a Car"
          />
        </div>
      )}
    </>
  );
}
