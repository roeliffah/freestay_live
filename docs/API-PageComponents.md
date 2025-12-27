# Page Components API Documentation

## Admin Endpoints

### 1. Get Page Components

**Endpoint:** `GET /api/v1/admin/page-components/{pageId}`

**Description:** Belirli bir sayfanın tüm component'lerini getirir (admin panel için).

**Parameters:**
- `pageId` (path, integer, required): Sayfa ID (1 = HomePage)
- `includeInactive` (query, boolean, optional): Pasif component'leri de getir (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "pageId": 1,
    "pageName": "HomePage",
    "components": [
      {
        "id": 1,
        "componentType": "hotels",
        "title": "Popular Hotels",
        "position": 1,
        "isActive": true,
        "configuration": {
          "layout": "grid-5",
          "fetchMode": "auto",
          "autoQuery": {
            "stars": 5,
            "count": 10
          },
          "showPrice": false,
          "showRating": true
        },
        "cacheEnabled": true,
        "cacheDuration": 3600,
        "cacheExpiry": "2025-12-27T15:00:00Z",
        "hasCachedData": true,
        "cssClasses": "",
        "createdAt": "2025-12-27T10:00:00Z",
        "updatedAt": "2025-12-27T10:00:00Z"
      }
    ],
    "totalComponents": 5,
    "activeComponents": 3
  }
}
```

---

### 2. Get Component by ID

**Endpoint:** `GET /api/v1/admin/page-components/component/{id}`

**Description:** Belirli bir component'i detaylarıyla getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "pageId": 1,
    "pageName": "HomePage",
    "componentType": "hotels",
    "title": "Popular Hotels",
    "position": 1,
    "isActive": true,
    "configuration": {...},
    "cachedData": {...},  // Actual cached data
    "cacheExpiry": "2025-12-27T15:00:00Z",
    "cssClasses": "",
    "createdAt": "2025-12-27T10:00:00Z",
    "updatedAt": "2025-12-27T10:00:00Z",
    "createdBy": 1,
    "updatedBy": 1
  }
}
```

---

### 3. Create Component

**Endpoint:** `POST /api/v1/admin/page-components`

**Request Body:**
```json
{
  "pageId": 1,
  "pageName": "HomePage",
  "componentType": "hotels",
  "title": "Romantic Hotels",
  "position": 3,
  "isActive": true,
  "configuration": {
    "layout": "grid-3",
    "fetchMode": "auto",
    "autoQuery": {
      "stars": 5,
      "theme": "romantic",
      "count": 6
    },
    "showPrice": false,
    "showRating": true
  },
  "cacheEnabled": true,
  "cacheDuration": 3600,
  "cssClasses": "py-16 bg-white"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Component created successfully",
  "data": {
    "id": 10,
    "componentType": "hotels",
    "title": "Romantic Hotels",
    ...
  }
}
```

---

### 4. Update Component

**Endpoint:** `PUT /api/v1/admin/page-components/{id}`

**Request Body:**
```json
{
  "title": "Updated Romantic Hotels",
  "isActive": true,
  "configuration": {
    "layout": "grid-4",
    "fetchMode": "manual",
    "hotelIds": [1340, 262130, 123456],
    "showPrice": true,
    "showRating": true
  },
  "cssClasses": "py-20 bg-gradient-to-r from-rose-100 to-pink-100"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Component updated successfully",
  "data": {
    "id": 10,
    "updatedAt": "2025-12-27T14:30:00Z"
  }
}
```

---

### 5. Reorder Components

**Endpoint:** `PATCH /api/v1/admin/page-components/reorder`

**Description:** Component'lerin sırasını günceller (drag & drop için).

**Request Body:**
```json
{
  "pageId": 1,
  "components": [
    {"id": 3, "position": 1},
    {"id": 1, "position": 2},
    {"id": 2, "position": 3},
    {"id": 5, "position": 4}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Component positions updated successfully",
  "data": {
    "updatedCount": 4
  }
}
```

---

### 6. Toggle Component Status

**Endpoint:** `PATCH /api/v1/admin/page-components/{id}/toggle`

**Description:** Component'i aktif/pasif yapar.

**Response:**
```json
{
  "success": true,
  "message": "Component status updated",
  "data": {
    "id": 1,
    "isActive": false
  }
}
```

---

### 7. Refresh Component Cache

**Endpoint:** `POST /api/v1/admin/page-components/{id}/refresh-cache`

**Description:** Component'in cache'ini temizler ve yeniden API'den data çeker.

**Request Body (optional):**
```json
{
  "forceRefresh": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache refreshed successfully",
  "data": {
    "id": 1,
    "cachedData": {...},
    "cacheExpiry": "2025-12-27T16:00:00Z",
    "dataSource": "API"  // or "Cache"
  }
}
```

---

### 8. Delete Component

**Endpoint:** `DELETE /api/v1/admin/page-components/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Component deleted successfully"
}
```

---

### 9. Get Available Component Types

**Endpoint:** `GET /api/v1/admin/page-components/types`

**Description:** Kullanılabilir component tiplerini ve layoutlarını getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "componentTypes": [
      {
        "type": "hotels",
        "label": "Hotel Component",
        "description": "Display hotels by ID or query",
        "icon": "hotel",
        "availableLayouts": [
          {
            "code": "grid-2",
            "name": "Grid 2 Columns",
            "isDefault": false
          },
          {
            "code": "grid-3",
            "name": "Grid 3 Columns",
            "isDefault": true
          },
          {
            "code": "carousel",
            "name": "Carousel",
            "isDefault": false
          }
        ],
        "configurationSchema": {
          "layout": "string",
          "fetchMode": "string (manual|auto)",
          "hotelIds": "array of integers",
          "autoQuery": "object",
          "showPrice": "boolean",
          "showRating": "boolean"
        }
      },
      {
        "type": "destinations",
        "label": "Destination Component",
        "description": "Show popular destinations",
        "icon": "map-pin",
        "availableLayouts": [...]
      },
      {
        "type": "image-banner",
        "label": "Image Banner",
        "description": "Add promotional banners",
        "icon": "image"
      },
      {
        "type": "html",
        "label": "HTML Component",
        "description": "Custom HTML content",
        "icon": "code"
      },
      {
        "type": "affiliate-widget",
        "label": "Affiliate Widget",
        "description": "Embed affiliate codes",
        "icon": "external-link"
      }
    ]
  }
}
```

---

### 10. Get Component Templates

**Endpoint:** `GET /api/v1/admin/page-components/templates`

**Description:** Hazır component şablonlarını getirir.

**Query Parameters:**
- `componentType` (optional): Belirli bir component tipinin şablonları

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "templateName": "Romantic Hotels - Grid 3",
        "componentType": "hotels",
        "description": "3 column grid of romantic themed hotels",
        "defaultConfiguration": {...},
        "previewImage": "/templates/romantic-hotels-grid3.jpg"
      }
    ]
  }
}
```

---

## Public Endpoints

### 1. Get Page Components (Frontend)

**Endpoint:** `GET /api/v1/public/page-components/{pageId}`

**Description:** Frontend için sayfa component'lerini getirir (sadece aktif, cached data ile).

**Query Parameters:**
- `locale` (optional): Dil kodu (tr, en, vb.)

**Response:**
```json
{
  "success": true,
  "data": {
    "pageId": 1,
    "pageName": "HomePage",
    "components": [
      {
        "id": 1,
        "type": "hotels",
        "title": "Popular Hotels",
        "layout": "grid-5",
        "cssClasses": "",
        "data": {
          "hotels": [
            {
              "id": 1340,
              "name": "Adams Beach Hotel",
              "stars": 5,
              "city": "Ayia Napa",
              "country": "Cyprus",
              "images": ["url1", "url2"],
              "reviewScore": 9.2
            }
          ]
        },
        "position": 1
      },
      {
        "id": 2,
        "type": "destinations",
        "title": "Popular Destinations",
        "layout": "featured-grid",
        "cssClasses": "bg-muted/20",
        "data": {
          "destinations": [...]
        },
        "position": 2
      }
    ],
    "cacheStatus": {
      "freshComponents": 3,
      "cachedComponents": 2,
      "totalComponents": 5
    }
  }
}
```

---

## Component Configuration Schemas

### Hotels Component
```json
{
  "layout": "grid-3",           // grid-2, grid-3, grid-4, grid-5, carousel
  "fetchMode": "auto",          // manual, auto
  "hotelIds": [1340, 262130],   // For manual mode
  "autoQuery": {                // For auto mode
    "stars": 5,
    "theme": "romantic",
    "country": "TR",
    "count": 10
  },
  "showPrice": false,
  "showRating": true,
  "showLocation": true,
  "showDescription": false
}
```

### Destinations Component
```json
{
  "layout": "featured-grid",     // grid-3, grid-4, featured-grid
  "fetchMode": "auto",
  "destinationIds": [247, 2973],
  "autoQuery": {
    "country": "TR",
    "count": 5
  },
  "showHotelCount": true,
  "showCountry": true
}
```

### Image Banner Component
```json
{
  "imageUrl": "/uploads/summer-banner.jpg",
  "link": "/search?season=summer",
  "height": "400px",
  "overlay": true,
  "overlayOpacity": 0.4,
  "overlayText": "Summer Sale",
  "overlaySubtext": "Up to 50% OFF",
  "buttonText": "Browse Deals",
  "buttonLink": "/search",
  "textPosition": "center"  // left, center, right
}
```

### HTML Component
```json
{
  "htmlContent": "<div>...</div>",
  "allowScripts": false,
  "sanitize": true
}
```

### Affiliate Widget Component
```json
{
  "affiliateType": "carRental",    // excursions, flightBooking
  "displayMode": "embed",          // embed, button, banner
  "widgetCode": "<script>...</script>",
  "buttonText": "Rent a Car",
  "buttonStyle": "primary"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "componentType": ["Component type is required"],
    "configuration": ["Invalid configuration format"]
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Component not found",
  "errorCode": "COMPONENT_NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred while processing your request",
  "errorCode": "INTERNAL_ERROR"
}
```
