'use client';

import { Card } from 'antd';
import { 
  HomeOutlined, 
  GlobalOutlined, 
  PictureOutlined, 
  CodeOutlined, 
  LinkOutlined,
  PlusOutlined 
} from '@ant-design/icons';

interface ComponentType {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}

const availableComponents: ComponentType[] = [
  {
    type: 'hotels',
    icon: <HomeOutlined className="text-2xl" />,
    label: 'Hotel Component',
    description: 'Display hotels by ID or auto-query',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    type: 'destinations',
    icon: <GlobalOutlined className="text-2xl" />,
    label: 'Destination Component',
    description: 'Show popular destinations',
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    type: 'image-banner',
    icon: <PictureOutlined className="text-2xl" />,
    label: 'Image Banner',
    description: 'Promotional banner with image',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  },
  {
    type: 'html',
    icon: <CodeOutlined className="text-2xl" />,
    label: 'HTML Component',
    description: 'Custom HTML/CSS content',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
  },
  {
    type: 'affiliate-widget',
    icon: <LinkOutlined className="text-2xl" />,
    label: 'Affiliate Widget',
    description: 'Embed affiliate program codes',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
  }
];

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Components</h3>
        <p className="text-xs text-gray-500 mt-1">
          Click to add components to your page
        </p>
      </div>

      <div className="space-y-3">
        {availableComponents.map((component) => (
          <Card
            key={component.type}
            className={`cursor-pointer transition-all ${component.color} border-2`}
            hoverable
            onClick={() => onAddComponent(component.type)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {component.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">
                    {component.label}
                  </h4>
                  <PlusOutlined className="text-xs text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {component.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Quick Tips</h4>
        <ul className="text-xs text-gray-600 space-y-2">
          <li>• Click a component to add it to the canvas</li>
          <li>• Drag components to reorder them</li>
          <li>• Click a component in canvas to edit settings</li>
          <li>• Toggle visibility with the eye icon</li>
          <li>• Refresh cache to update content</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Templates</h4>
        <p className="text-xs text-blue-600 mb-3">
          Start with pre-configured templates
        </p>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors text-xs">
            🌹 Romantic Hotels Layout
          </button>
          <button className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors text-xs">
            🗺️ Popular Destinations
          </button>
          <button className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors text-xs">
            🏖️ Summer Sale Banner
          </button>
        </div>
      </div>
    </div>
  );
}
