# Homepage Component Management System

## Genel Bakış

OpenCart/Elementor tarzı sürükle-bırak component management sistemi.

## Özellikler

### 1. Component Türleri

#### A. Hotel Component
```json
{
  "type": "hotels",
  "title": "Romantic Hotels",
  "layout": "grid-3",  // grid-2, grid-3, grid-4, grid-5, carousel
  "hotelIds": [1340, 262130, 123456],
  "fetchMode": "manual",  // manual (IDs) veya auto (query)
  "autoQuery": {
    "stars": 5,
    "theme": "romantic",
    "count": 6
  },
  "showPrice": false,
  "showRating": true,
  "cacheEnabled": true,
  "cacheDuration": 3600  // seconds
}
```

#### B. Destination Component
```json
{
  "type": "destinations",
  "title": "Popular Destinations",
  "layout": "featured-grid",  // 1+4 layout veya grid-3, grid-4
  "destinationIds": [247, 2973],
  "fetchMode": "auto",
  "autoQuery": {
    "country": "TR",
    "count": 5
  },
  "showHotelCount": true,
  "cacheEnabled": true
}
```

#### C. Image Banner Component
```json
{
  "type": "image-banner",
  "title": "Summer Sale",
  "imageUrl": "/uploads/banner-summer.jpg",
  "link": "/search?season=summer",
  "height": "400px",
  "overlay": true,
  "overlayText": "Up to 50% OFF",
  "buttonText": "Book Now",
  "buttonLink": "/search"
}
```

#### D. HTML Component
```json
{
  "type": "html",
  "title": "Custom Section",
  "htmlContent": "<div class=\"custom-promo\">...</div>",
  "cssClasses": "py-16 bg-gray-100"
}
```

#### E. Affiliate Widget Component
```json
{
  "type": "affiliate-widget",
  "title": "Rent a Car",
  "affiliateType": "carRental",  // excursions, flightBooking
  "widgetCode": "<script src=\"...\"></script>",
  "displayMode": "embed"  // embed, button, banner
}
```

### 2. Database Schema

#### PageComponents Tablosu
```sql
CREATE TABLE PageComponents (
    Id INT PRIMARY KEY IDENTITY,
    PageId INT,  -- HomePage = 1
    ComponentType VARCHAR(50),  -- hotels, destinations, image-banner, html, affiliate
    Title NVARCHAR(200),
    Position INT,  -- Sıralama için
    IsActive BIT DEFAULT 1,
    
    -- Component Configuration (JSON)
    Configuration NVARCHAR(MAX),
    
    -- Cache
    CachedData NVARCHAR(MAX),  -- API'den çekilen data
    CacheExpiry DATETIME,
    
    -- Metadata
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,
    
    FOREIGN KEY (PageId) REFERENCES Pages(Id)
)
```

#### ComponentLayouts Tablosu
```sql
CREATE TABLE ComponentLayouts (
    Id INT PRIMARY KEY IDENTITY,
    ComponentType VARCHAR(50),
    LayoutName VARCHAR(50),
    LayoutCode VARCHAR(50),  -- grid-3, carousel, featured-grid
    PreviewImage VARCHAR(500),
    IsDefault BIT DEFAULT 0
)
```

### 3. API Endpoints

#### Admin Endpoints

**GET** `/api/v1/admin/page-components/{pageId}`
```json
{
  "pageId": 1,
  "pageName": "HomePage",
  "components": [
    {
      "id": 1,
      "type": "hotels",
      "title": "Romantic Hotels",
      "position": 1,
      "isActive": true,
      "configuration": {...},
      "cachedData": {...},
      "cacheExpiry": "2025-12-27T15:00:00Z"
    }
  ]
}
```

**POST** `/api/v1/admin/page-components`
```json
{
  "pageId": 1,
  "componentType": "hotels",
  "title": "Romantic Hotels",
  "position": 1,
  "configuration": {
    "layout": "grid-3",
    "hotelIds": [1340, 262130],
    "showPrice": false
  }
}
```

**PUT** `/api/v1/admin/page-components/{id}`
```json
{
  "title": "Updated Title",
  "configuration": {...}
}
```

**PATCH** `/api/v1/admin/page-components/reorder`
```json
{
  "pageId": 1,
  "components": [
    {"id": 3, "position": 1},
    {"id": 1, "position": 2},
    {"id": 2, "position": 3}
  ]
}
```

**POST** `/api/v1/admin/page-components/{id}/refresh-cache`
- Component'in cache'ini yenile (API'den tekrar data çek)

**DELETE** `/api/v1/admin/page-components/{id}`

#### Public Endpoints

**GET** `/api/v1/public/page-components/{pageId}`
```json
{
  "pageId": 1,
  "components": [
    {
      "id": 1,
      "type": "hotels",
      "title": "Romantic Hotels",
      "layout": "grid-3",
      "data": {
        "hotels": [...]  // Cached veya fresh data
      }
    }
  ]
}
```

### 4. Frontend Implementation

#### Admin Panel - Component Manager

```tsx
// app/admin/page-components/page.tsx

interface Component {
  id: number;
  type: string;
  title: string;
  position: number;
  isActive: boolean;
  configuration: any;
}

export default function PageComponentManager() {
  const [components, setComponents] = useState<Component[]>([]);
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-12 gap-6">
        {/* Sol Panel - Available Components */}
        <div className="col-span-3">
          <ComponentPalette />
        </div>
        
        {/* Orta Panel - Canvas (Drag & Drop Area) */}
        <div className="col-span-6">
          <ComponentCanvas components={components} />
        </div>
        
        {/* Sağ Panel - Component Settings */}
        <div className="col-span-3">
          <ComponentSettings />
        </div>
      </div>
    </DndContext>
  );
}
```

#### Component Palette
```tsx
const availableComponents = [
  {
    type: 'hotels',
    icon: Hotel,
    label: 'Hotel Component',
    description: 'Display hotels by ID or query'
  },
  {
    type: 'destinations',
    icon: MapPin,
    label: 'Destination Component',
    description: 'Show popular destinations'
  },
  {
    type: 'image-banner',
    icon: Image,
    label: 'Image Banner',
    description: 'Add promotional banners'
  },
  {
    type: 'html',
    icon: Code,
    label: 'HTML Component',
    description: 'Custom HTML content'
  },
  {
    type: 'affiliate-widget',
    icon: ExternalLink,
    label: 'Affiliate Widget',
    description: 'Embed affiliate codes'
  }
];
```

#### Component Settings Panel

```tsx
function HotelComponentSettings({ component, onChange }) {
  return (
    <div className="space-y-4">
      <Input 
        label="Title"
        value={component.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      
      <Select
        label="Layout"
        value={component.configuration.layout}
        onChange={(value) => onChange({ 
          configuration: { ...component.configuration, layout: value }
        })}
      >
        <option value="grid-2">Grid 2 Columns</option>
        <option value="grid-3">Grid 3 Columns</option>
        <option value="grid-4">Grid 4 Columns</option>
        <option value="carousel">Carousel</option>
      </Select>
      
      <div>
        <label>Fetch Mode</label>
        <Radio.Group 
          value={component.configuration.fetchMode}
          onChange={(e) => onChange({
            configuration: { ...component.configuration, fetchMode: e.target.value }
          })}
        >
          <Radio value="manual">Manual (Hotel IDs)</Radio>
          <Radio value="auto">Auto (Query)</Radio>
        </Radio.Group>
      </div>
      
      {component.configuration.fetchMode === 'manual' ? (
        <HotelIdSelector 
          value={component.configuration.hotelIds}
          onChange={(ids) => onChange({
            configuration: { ...component.configuration, hotelIds: ids }
          })}
        />
      ) : (
        <AutoQueryBuilder 
          value={component.configuration.autoQuery}
          onChange={(query) => onChange({
            configuration: { ...component.configuration, autoQuery: query }
          })}
        />
      )}
      
      <Switch
        label="Show Price"
        checked={component.configuration.showPrice}
        onChange={(checked) => onChange({
          configuration: { ...component.configuration, showPrice: checked }
        })}
      />
      
      <Button onClick={handleRefreshCache}>
        Refresh Cache
      </Button>
    </div>
  );
}
```

#### Frontend Display

```tsx
// app/[locale]/page.tsx

export default async function HomePage() {
  const components = await fetchPageComponents(1); // HomePage ID
  
  return (
    <main>
      <HeroSection />
      
      {components.map((component) => (
        <DynamicComponent 
          key={component.id}
          component={component}
        />
      ))}
      
      <Footer />
    </main>
  );
}

function DynamicComponent({ component }) {
  switch (component.type) {
    case 'hotels':
      return <HotelComponent {...component} />;
    case 'destinations':
      return <DestinationComponent {...component} />;
    case 'image-banner':
      return <ImageBanner {...component} />;
    case 'html':
      return <HTMLComponent {...component} />;
    case 'affiliate-widget':
      return <AffiliateWidget {...component} />;
    default:
      return null;
  }
}
```

### 5. Cache Stratejisi

1. **Admin'de Save**:
   - Configuration kaydedilir
   - Eğer `fetchMode === 'auto'` ise API'den data çekilip cache'lenir
   - `cacheExpiry` ayarlanır

2. **Frontend'de Display**:
   - Önce cache kontrol edilir
   - Cache expire olduysa API'den fresh data çekilir
   - Client-side cache kullanılır (SWR/React Query)

3. **Manual Refresh**:
   - Admin panelde "Refresh Cache" butonu
   - Background job ile otomatik refresh (örn: her 1 saatte)

### 6. Sürükle-Bırak (Drag & Drop)

**Library**: `@dnd-kit/core`

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function handleDragEnd(event) {
  const { active, over } = event;
  
  if (active.id !== over.id) {
    const oldIndex = components.findIndex(c => c.id === active.id);
    const newIndex = components.findIndex(c => c.id === over.id);
    
    const newComponents = arrayMove(components, oldIndex, newIndex);
    
    // API'ye yeni sıralamayı gönder
    await updateComponentPositions(newComponents);
  }
}
```

### 7. Image Upload

```tsx
function ImageUploadField({ value, onChange }) {
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/v1/admin/upload/image', {
      method: 'POST',
      body: formData
    });
    
    const { url } = await response.json();
    onChange(url);
  };
  
  return (
    <Upload
      accept="image/*"
      customRequest={({ file }) => handleUpload(file)}
    >
      <Button icon={<UploadOutlined />}>Upload Image</Button>
    </Upload>
  );
}
```

### 8. HTML Editor

```tsx
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

function HTMLEditor({ value, onChange }) {
  return (
    <div>
      <Tabs>
        <TabPane tab="Visual" key="visual">
          <ReactQuill 
            value={value}
            onChange={onChange}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                ['link', 'image'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
              ]
            }}
          />
        </TabPane>
        <TabPane tab="HTML" key="html">
          <CodeEditor
            value={value}
            onChange={onChange}
            language="html"
          />
        </TabPane>
      </Tabs>
    </div>
  );
}
```

## Implementation Steps

### Phase 1: Backend
1. ✅ Database tables oluştur
2. ✅ Admin CRUD endpoints
3. ✅ Public display endpoint
4. ✅ Cache mechanism
5. ✅ Image upload endpoint

### Phase 2: Admin Panel
1. ✅ Component Manager sayfası
2. ✅ Drag & Drop interface
3. ✅ Component Settings panels
4. ✅ Preview functionality
5. ✅ Cache refresh

### Phase 3: Frontend
1. ✅ Dynamic component renderer
2. ✅ Component library (HotelComponent, DestinationComponent, vb.)
3. ✅ Client-side caching (SWR)
4. ✅ Responsive layouts

### Phase 4: Testing & Optimization
1. ✅ Performance testing
2. ✅ Cache invalidation
3. ✅ SEO optimization
4. ✅ Mobile responsiveness

## Avantajlar

1. **Esneklik**: Admin her bileşeni istediği gibi düzenleyebilir
2. **Performance**: Cache sayesinde hızlı yükleme
3. **SEO**: Server-side rendering ile SEO uyumlu
4. **Kullanıcı Dostu**: Sürükle-bırak interface
5. **Kolay Bakım**: Component bazlı yapı
6. **Ölçeklenebilir**: Yeni component tipleri kolayca eklenebilir
