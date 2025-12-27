'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button, Tag, Tooltip, Popconfirm } from 'antd';
import { 
  HolderOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  HomeOutlined,
  GlobalOutlined,
  PictureOutlined,
  CodeOutlined,
  LinkOutlined
} from '@ant-design/icons';

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

interface ComponentCanvasProps {
  components: PageComponent[];
  selectedComponent: PageComponent | null;
  onSelectComponent: (component: PageComponent) => void;
  onToggleComponent: (id: number) => void;
  onDeleteComponent: (id: number) => void;
  onRefreshCache: (id: number) => void;
}

export default function ComponentCanvas({
  components,
  selectedComponent,
  onSelectComponent,
  onToggleComponent,
  onDeleteComponent,
  onRefreshCache
}: ComponentCanvasProps) {
  if (components.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No components yet</h3>
        <p className="text-gray-500">
          Click on a component from the left panel to add it to your page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 pb-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Page Components</h3>
        <p className="text-sm text-gray-500">
          {components.length} component{components.length !== 1 ? 's' : ''} • 
          Drag to reorder
        </p>
      </div>

      {components.map((component) => (
        <SortableComponentCard
          key={component.id}
          component={component}
          isSelected={selectedComponent?.id === component.id}
          onSelect={() => onSelectComponent(component)}
          onToggle={() => onToggleComponent(component.id)}
          onDelete={() => onDeleteComponent(component.id)}
          onRefreshCache={() => onRefreshCache(component.id)}
        />
      ))}
    </div>
  );
}

interface SortableComponentCardProps {
  component: PageComponent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRefreshCache: () => void;
}

function SortableComponentCard({
  component,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
  onRefreshCache
}: SortableComponentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getComponentIcon = () => {
    const icons: Record<string, React.ReactNode> = {
      hotels: <HomeOutlined />,
      destinations: <GlobalOutlined />,
      'image-banner': <PictureOutlined />,
      html: <CodeOutlined />,
      'affiliate-widget': <LinkOutlined />
    };
    return icons[component.componentType] || <HomeOutlined />;
  };

  const getComponentColor = () => {
    const colors: Record<string, string> = {
      hotels: 'blue',
      destinations: 'green',
      'image-banner': 'purple',
      html: 'orange',
      'affiliate-widget': 'pink'
    };
    return colors[component.componentType] || 'default';
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        } ${!component.isActive ? 'opacity-50' : ''}`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <HolderOutlined className="text-xl" />
          </div>

          {/* Component Icon */}
          <div className={`text-xl text-${getComponentColor()}-500`}>
            {getComponentIcon()}
          </div>

          {/* Component Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-800 truncate">
                {component.title}
              </h4>
              <Tag color={getComponentColor()}>
                {component.componentType}
              </Tag>
              {!component.isActive && (
                <Tag color="red">Inactive</Tag>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                Position: {component.position}
              </span>
              {component.configuration?.layout && (
                <span className="text-xs text-gray-500">
                  Layout: {component.configuration.layout}
                </span>
              )}
              {component.cacheEnabled && (
                <Tag color="green" className="text-xs">
                  Cached
                </Tag>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Tooltip title={component.isActive ? 'Hide' : 'Show'}>
              <Button
                size="small"
                icon={component.isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={onToggle}
              />
            </Tooltip>

            {component.cacheEnabled && (
              <Tooltip title="Refresh Cache">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={onRefreshCache}
                />
              </Tooltip>
            )}

            <Tooltip title="Edit Settings">
              <Button
                size="small"
                type={isSelected ? 'primary' : 'default'}
                icon={<EditOutlined />}
                onClick={onSelect}
              />
            </Tooltip>

            <Popconfirm
              title="Delete component?"
              description="This action cannot be undone."
              onConfirm={onDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </div>
        </div>

        {/* Preview/Details */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              {component.configuration?.fetchMode && (
                <div>
                  <strong>Fetch Mode:</strong> {component.configuration.fetchMode}
                </div>
              )}
              {component.configuration?.hotelIds && (
                <div>
                  <strong>Hotels:</strong> {component.configuration.hotelIds.length} selected
                </div>
              )}
              {component.cssClasses && (
                <div className="col-span-2">
                  <strong>CSS Classes:</strong> {component.cssClasses}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
