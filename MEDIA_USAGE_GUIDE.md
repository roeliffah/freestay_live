# Media Yönetim Sistemi - Kullanım Kılavuzu

## 📁 Dosya Depolama

### Fiziksel Konum
Media dosyaları şu dizinde saklanır:
```
/app/wwwroot/media/{folder}/{filename}
```

**Örnek:**
- Orijinal: `/app/wwwroot/media/hotels/abc123-xyz789.jpg`
- Thumbnail: `/app/wwwroot/media/hotels/abc123-xyz789_thumb.jpg`

### Klasör Yapısı
```
wwwroot/
└── media/
    ├── hotels/          # Otel görselleri
    ├── destinations/    # Destinasyon görselleri  
    ├── general/         # Genel içerik
    └── {custom}/        # Özel klasörler
```

## 🌐 Frontend Erişimi

### URL Formatı

**Production (Dokploy):**
```
https://api.freestays.com/media/{folder}/{filename}
```

**Local Development:**
```
http://localhost:5240/media/{folder}/{filename}
```

### Örnekler

#### 1. Orijinal Görsel
```javascript
const imageUrl = `${API_BASE_URL}/media/hotels/abc123-xyz789.jpg`;

// React örneği
<img src={imageUrl} alt="Hotel" />
```

#### 2. Thumbnail (Küçük görsel)
```javascript
const thumbnailUrl = `${API_BASE_URL}/media/hotels/abc123-xyz789_thumb.jpg`;

// React örneği
<img src={thumbnailUrl} alt="Hotel thumbnail" />
```

#### 3. API Response'tan Kullanım
```javascript
// Upload response
{
  "id": "abc123-...",
  "url": "/media/hotels/abc123-xyz789.jpg",
  "thumbnailUrl": "/media/hotels/abc123-xyz789_thumb.jpg",
  "filename": "abc123-xyz789.jpg",
  "mimeType": "image/jpeg",
  "size": 1048576
}

// Frontend'de kullanım
const fullUrl = `${API_BASE_URL}${response.url}`;
const fullThumbnailUrl = `${API_BASE_URL}${response.thumbnailUrl}`;
```

## 📤 Upload İşlemleri

### 1. Tek Dosya Upload

**Endpoint:** `POST /api/v1/Media/upload`

**Request (multipart/form-data):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'hotels');  // optional
formData.append('altText', 'Luxury Hotel View');  // optional

const response = await fetch(`${API_BASE_URL}/api/v1/Media/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data.url); // /media/hotels/abc123-xyz789.jpg
```

### 2. Çoklu Dosya Upload

**Endpoint:** `POST /api/v1/Media/upload-multiple`

```javascript
const formData = new FormData();
formData.append('folder', 'hotels');

// Birden fazla dosya ekle
fileInput.files.forEach(file => {
  formData.append('files', file);
});

const response = await fetch(`${API_BASE_URL}/api/v1/Media/upload-multiple`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const files = await response.json();
// [{ url: '/media/hotels/...', ... }, { url: '/media/hotels/...', ... }]
```

## 📋 Listeleme ve Yönetim

### 1. Media Listesi

**Endpoint:** `GET /api/v1/Media?page=1&pageSize=20&folder=hotels`

```javascript
const response = await fetch(
  `${API_BASE_URL}/api/v1/Media?page=1&pageSize=20&folder=hotels&search=luxury`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
// {
//   items: [...],
//   totalCount: 100,
//   page: 1,
//   pageSize: 20
// }
```

### 2. Klasör Listesi

**Endpoint:** `GET /api/v1/Media/folders`

```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/Media/folders`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const folders = await response.json();
// ["hotels", "destinations", "general"]
```

### 3. Storage İstatistikleri

**Endpoint:** `GET /api/v1/Media/stats/storage`

```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/Media/stats/storage`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
// {
//   totalFiles: 500,
//   totalSize: 104857600,
//   totalSizeMB: 100.0,
//   byFolder: [
//     { folder: "hotels", count: 300, totalSize: 62914560 },
//     ...
//   ]
// }
```

## 🎨 React Component Örneği

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const MediaUploader = ({ folder = 'general' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('altText', file.name);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/Media/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const fullUrl = `${process.env.REACT_APP_API_URL}${response.data.url}`;
      setUploadedUrl(fullUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleUpload} 
        accept="image/*,video/*"
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      
      {uploadedUrl && (
        <div>
          <p>Upload successful!</p>
          <img src={uploadedUrl} alt="Uploaded" style={{ maxWidth: '300px' }} />
          <p>URL: {uploadedUrl}</p>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
```

## 🔒 Authentication

**Tüm media endpoint'leri Admin/SuperAdmin rolü gerektirir.**

```javascript
// Token ile istek
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 🐳 Docker & Production

### Volume Mount (docker-compose.yml)
```yaml
volumes:
  - ./wwwroot/media:/app/wwwroot/media
```

Bu sayede:
- ✅ Dosyalar container restart'ta korunur
- ✅ Yeni deployment'larda eski dosyalar kaybolmaz
- ✅ Host sistemde `/wwwroot/media` dizininde fiziksel olarak saklanır

### Static File Serving
ASP.NET Core otomatik olarak `/wwwroot` dizinini serve eder:
- URL: `https://api.freestays.com/media/hotels/image.jpg`
- Fiziksel: `/app/wwwroot/media/hotels/image.jpg`

## 📝 Dosya Özellikleri

### Desteklenen Formatlar
- **Resim:** .jpg, .jpeg, .png, .gif, .webp
- **Video:** .mp4, .webm, .mov

### Limitler
- **Maksimum dosya boyutu:** 50 MB
- **Thumbnail boyutu:** 400x300 px (max, aspect ratio korunur)

### Otomatik İşlemler
- ✅ Benzersiz dosya adı (GUID)
- ✅ Klasör organizasyonu
- ✅ Resimler için otomatik thumbnail
- ✅ Görsel boyut bilgisi (width/height)
- ✅ Database kaydı

## 🔗 Next.js Image Component Örneği

```javascript
import Image from 'next/image';

const HotelImage = ({ media }) => {
  const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${media.url}`;
  
  return (
    <Image
      src={imageUrl}
      alt={media.altText || 'Hotel'}
      width={media.width || 800}
      height={media.height || 600}
      priority
    />
  );
};
```

## 📊 Database Schema

```sql
MediaFile:
- Id (Guid)
- Filename (string) - Benzersiz dosya adı
- OriginalFilename (string) - Kullanıcının yüklediği orijinal ad
- Url (string) - /media/folder/filename.jpg
- ThumbnailUrl (string?) - /media/folder/filename_thumb.jpg
- MimeType (string) - image/jpeg, video/mp4, vb.
- SizeBytes (long) - Byte cinsinden boyut
- Width (int?) - Resimler için genişlik
- Height (int?) - Resimler için yükseklik
- Folder (string) - Klasör adı
- AltText (string?) - SEO ve accessibility
- Tags (string) - JSON array
- UploadedBy (Guid) - Yükleyen kullanıcı
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```
