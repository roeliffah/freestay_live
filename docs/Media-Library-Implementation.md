## Media Library Implementation - Complete

✅ **Backend API** - Hazır (Backend tarafında `/api/Media` endpoints'leri mevcut)

✅ **Frontend Components:**

### 1. MediaLibrarySelector Component
**Dosya:** `/components/admin/MediaLibrarySelector.tsx`

Kullanım örneği:
```tsx
import MediaLibrarySelector from '@/components/admin/MediaLibrarySelector';

const [imageUrl, setImageUrl] = useState('');
const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);

<Button onClick={() => setMediaLibraryVisible(true)}>
  Resim Seç
</Button>

<MediaLibrarySelector
  visible={mediaLibraryVisible}
  onClose={() => setMediaLibraryVisible(false)}
  onSelect={(url) => {
    setImageUrl(url);
    message.success('Resim seçildi');
  }}
  currentUrl={imageUrl}
  folder="countries" // İsteğe bağlı klasör filtresi
/>
```

**Özellikler:**
- ✅ Upload dosya (drag & drop)
- ✅ Grid view ile medya görüntüleme
- ✅ Folder filtreleme
- ✅ Arama (search)
- ✅ Pagination
- ✅ Dosya silme
- ✅ Thumbnail preview
- ✅ Dosya detayları (boyut, dimensions)

### 2. Media Management Page
**Dosya:** `/app/admin/media/page.tsx`

**URL:** `/admin/media`

**Özellikler:**
- ✅ Tüm medya dosyalarını listeleme
- ✅ Dosya yükleme (upload)
- ✅ Klasör bazlı filtreleme
- ✅ Arama fonksiyonu
- ✅ Dosya düzenleme (alt text, tags, folder)
- ✅ Dosya silme
- ✅ İstatistikler (toplam dosya, boyut, klasör sayısı)
- ✅ Pagination

### 3. Admin Menu Integration
✅ Media Library menüye eklendi: **Content > Media Library**

---

## Kullanım Örnekleri

### Example 1: Country Form'da Image Picker

```tsx
'use client';

import { useState } from 'react';
import { Form, Input, Button, Image } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import MediaLibrarySelector from '@/components/admin/MediaLibrarySelector';

export default function CountryForm() {
  const [imageUrl, setImageUrl] = useState('');
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    const data = {
      ...values,
      imageUrl: imageUrl, // Seçilen resim URL'i
    };
    
    // API'ye gönder
    console.log('Saving country:', data);
  };

  return (
    <>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Country Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Country Code" name="code" rules={[{ required: true }]}>
          <Input maxLength={2} />
        </Form.Item>

        <Form.Item label="Image">
          <div>
            {imageUrl && (
              <div style={{ marginBottom: 8 }}>
                <Image src={imageUrl} alt="Country" width={200} />
              </div>
            )}
            <Button 
              icon={<PictureOutlined />}
              onClick={() => setMediaLibraryOpen(true)}
            >
              {imageUrl ? 'Change Image' : 'Select Image'}
            </Button>
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Save Country
          </Button>
        </Form.Item>
      </Form>

      <MediaLibrarySelector
        visible={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={(url) => setImageUrl(url)}
        currentUrl={imageUrl}
        folder="countries"
      />
    </>
  );
}
```

### Example 2: Homepage Sections'da Multiple Image Selection

```tsx
const [selectedImages, setSelectedImages] = useState<string[]>([]);
const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);

// Image ekle
<Button onClick={() => {
  setCurrentImageIndex(-1); // Yeni resim
  setMediaLibraryOpen(true);
}}>
  Add Image
</Button>

// Image düzenle
{selectedImages.map((url, index) => (
  <div key={index}>
    <Image src={url} width={100} />
    <Button onClick={() => {
      setCurrentImageIndex(index);
      setMediaLibraryOpen(true);
    }}>
      Change
    </Button>
  </div>
))}

<MediaLibrarySelector
  visible={mediaLibraryOpen}
  onClose={() => setMediaLibraryOpen(false)}
  onSelect={(url) => {
    if (currentImageIndex === -1) {
      // Yeni resim ekle
      setSelectedImages([...selectedImages, url]);
    } else {
      // Mevcut resmi güncelle
      const updated = [...selectedImages];
      updated[currentImageIndex] = url;
      setSelectedImages(updated);
    }
  }}
  currentUrl={currentImageIndex >= 0 ? selectedImages[currentImageIndex] : undefined}
  folder="homepage"
/>
```

---

## Backend API Endpoints (Mevcut)

### Upload
- `POST /api/Media/upload` - Tek dosya
- `POST /api/Media/upload-multiple` - Çoklu dosya

**Request:**
```typescript
FormData: {
  file: File,
  folder?: string,
  altText?: string
}
```

**Response:**
```typescript
{
  id: string,
  url: string,
  filename: string,
  mimeType: string,
  size: number,
  width?: number,
  height?: number,
  thumbnailUrl?: string,
  createdAt: string
}
```

### List & Search
- `GET /api/Media?page=1&pageSize=20&folder=countries&search=turkey`

**Response:**
```typescript
{
  items: MediaFile[],
  totalCount: number,
  totalPages: number,
  currentPage: number,
  pageSize: number
}
```

### Update
- `PUT /api/Media/{id}`

**Request:**
```typescript
{
  altText?: string,
  tags?: string[],
  folder?: string
}
```

### Delete
- `DELETE /api/Media/{id}` - Tek dosya
- `POST /api/Media/bulk-delete` - Toplu silme

**Request (bulk):**
```typescript
{
  ids: string[]
}
```

### Folders
- `GET /api/Media/folders` - Tüm klasörleri listele

### Stats
- `GET /api/Media/stats/storage` - Depolama istatistikleri

---

## Folder Organization (Önerilen)

```
/uploads/
  ├── countries/        # Ülke görselleri
  ├── destinations/     # Destinasyon görselleri
  ├── hotels/          # Otel görselleri
  ├── homepage/        # Homepage section görselleri
  ├── pages/           # Statik sayfa görselleri
  ├── blog/            # Blog görselleri
  └── general/         # Genel kullanım
```

---

## Next Steps (Opsiyonel İyileştirmeler)

1. **Countries/Destinations Formlarına Entegrasyon**
   - Country ve destination edit formlarına MediaLibrarySelector ekle
   - Database'de image URL kolonları ekle

2. **Bulk Upload**
   - Multiple file selection ve upload
   - Progress indicator

3. **Image Optimization**
   - Automatic thumbnail generation
   - Image compression
   - WebP format conversion

4. **Advanced Filtering**
   - Date range filter
   - File type filter (image, video, document)
   - Size range filter

5. **CDN Integration**
   - CloudFront veya CloudFlare ile CDN integration
   - Otomatik URL transformation

---

## Kullanıma Hazır! 🎉

Artık admin panelinde:
1. `/admin/media` sayfasından tüm medya dosyalarını yönetebilirsiniz
2. Herhangi bir formda `MediaLibrarySelector` componentini kullanarak WordPress tarzı medya seçimi yapabilirsiniz
3. Upload, organize, search ve delete işlemlerini yapabilirsiniz

Backend API hazır, frontend componentler hazır, admin menu'ye eklenmiş durumda!
