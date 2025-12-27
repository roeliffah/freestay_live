-- =============================================
-- Homepage Component Management System - Database Schema
-- =============================================

-- 1. PageComponents Tablosu
-- Component'lerin saklandığı ana tablo
CREATE TABLE PageComponents (
    Id INT PRIMARY KEY IDENTITY(1,1),
    
    -- Sayfa bilgisi
    PageId INT NOT NULL,  -- 1 = HomePage, 2 = AboutPage, vb.
    PageName NVARCHAR(100) NOT NULL,  -- 'HomePage', 'AboutPage', vb.
    
    -- Component bilgisi
    ComponentType VARCHAR(50) NOT NULL,  -- 'hotels', 'destinations', 'image-banner', 'html', 'affiliate-widget'
    Title NVARCHAR(200),
    Position INT NOT NULL DEFAULT 0,  -- Sıralama için
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- Configuration (JSON format)
    -- Her component tipinin kendi config'i var
    Configuration NVARCHAR(MAX),  -- JSON: layout, hotelIds, autoQuery, vb.
    
    -- Cache için
    CachedData NVARCHAR(MAX),  -- API'den çekilen data (JSON)
    CacheExpiry DATETIME,
    CacheEnabled BIT NOT NULL DEFAULT 1,
    CacheDuration INT DEFAULT 3600,  -- Saniye cinsinden
    
    -- Metadata
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy INT,
    UpdatedBy INT,
    
    -- CSS classes (opsiyonel)
    CssClasses NVARCHAR(500),
    
    CONSTRAINT FK_PageComponents_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(Id),
    CONSTRAINT FK_PageComponents_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES Users(Id)
);

-- Index'ler
CREATE INDEX IX_PageComponents_PageId ON PageComponents(PageId);
CREATE INDEX IX_PageComponents_Position ON PageComponents(Position);
CREATE INDEX IX_PageComponents_IsActive ON PageComponents(IsActive);
CREATE INDEX IX_PageComponents_ComponentType ON PageComponents(ComponentType);

-- =============================================

-- 2. ComponentLayouts Tablosu
-- Component layout şablonları
CREATE TABLE ComponentLayouts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    
    ComponentType VARCHAR(50) NOT NULL,  -- 'hotels', 'destinations'
    LayoutName NVARCHAR(100) NOT NULL,  -- 'Grid 3 Columns', 'Carousel', 'Featured Grid'
    LayoutCode VARCHAR(50) NOT NULL,  -- 'grid-3', 'carousel', 'featured-grid'
    
    Description NVARCHAR(500),
    PreviewImage VARCHAR(500),  -- Layout önizleme resmi
    
    IsDefault BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- Layout config (responsive breakpoints vb.)
    LayoutConfig NVARCHAR(MAX),  -- JSON
    
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT UQ_ComponentLayouts_Code UNIQUE (ComponentType, LayoutCode)
);

-- Default layout'ları ekle
INSERT INTO ComponentLayouts (ComponentType, LayoutName, LayoutCode, Description, IsDefault, IsActive) VALUES
('hotels', 'Grid 2 Columns', 'grid-2', '2 column responsive grid layout', 0, 1),
('hotels', 'Grid 3 Columns', 'grid-3', '3 column responsive grid layout', 1, 1),
('hotels', 'Grid 4 Columns', 'grid-4', '4 column responsive grid layout', 0, 1),
('hotels', 'Grid 5 Columns', 'grid-5', '5 column responsive grid layout', 0, 1),
('hotels', 'Carousel', 'carousel', 'Horizontal scrolling carousel', 0, 1),

('destinations', 'Grid 3 Columns', 'grid-3', '3 column grid layout', 0, 1),
('destinations', 'Grid 4 Columns', 'grid-4', '4 column grid layout', 0, 1),
('destinations', 'Featured Grid', 'featured-grid', '1 large + 4 small cards layout', 1, 1),

('image-banner', 'Full Width', 'full-width', 'Full width banner', 1, 1),
('image-banner', 'Contained', 'contained', 'Container width banner', 0, 1),

('affiliate-widget', 'Embed', 'embed', 'Embedded widget', 1, 1),
('affiliate-widget', 'Button', 'button', 'Call-to-action button', 0, 1),
('affiliate-widget', 'Banner', 'banner', 'Banner style', 0, 1);

-- =============================================

-- 3. ComponentTemplates Tablosu (Opsiyonel)
-- Hazır component şablonları
CREATE TABLE ComponentTemplates (
    Id INT PRIMARY KEY IDENTITY(1,1),
    
    TemplateName NVARCHAR(100) NOT NULL,
    ComponentType VARCHAR(50) NOT NULL,
    Description NVARCHAR(500),
    
    -- Hazır configuration
    DefaultConfiguration NVARCHAR(MAX),  -- JSON
    
    PreviewImage VARCHAR(500),
    IsActive BIT NOT NULL DEFAULT 1,
    
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Hazır template'ler
INSERT INTO ComponentTemplates (TemplateName, ComponentType, Description, DefaultConfiguration) VALUES
('Romantic Hotels - Grid 3', 'hotels', '3 column grid of romantic themed hotels', 
'{
  "layout": "grid-3",
  "fetchMode": "auto",
  "autoQuery": {
    "stars": 5,
    "theme": "romantic",
    "count": 6
  },
  "showPrice": false,
  "showRating": true
}'),

('Popular Destinations - Featured', 'destinations', '1 large + 4 small destination cards',
'{
  "layout": "featured-grid",
  "fetchMode": "auto",
  "autoQuery": {
    "count": 5
  },
  "showHotelCount": true
}'),

('Summer Sale Banner', 'image-banner', 'Promotional banner for summer sale',
'{
  "height": "400px",
  "overlay": true,
  "buttonText": "Book Now"
}'),

('Car Rental Widget', 'affiliate-widget', 'Car rental affiliate widget',
'{
  "affiliateType": "carRental",
  "displayMode": "embed"
}');

-- =============================================

-- 4. Sample Data - HomePage Components
-- Örnek homepage component'leri

-- Hero bölümünden sonra ilk component: Popular Hotels
INSERT INTO PageComponents (PageId, PageName, ComponentType, Title, Position, IsActive, Configuration, CacheEnabled, CacheDuration) VALUES
(1, 'HomePage', 'hotels', 'Popular Hotels', 1, 1, 
'{
  "layout": "grid-5",
  "fetchMode": "auto",
  "autoQuery": {
    "stars": 5,
    "count": 10
  },
  "showPrice": false,
  "showRating": true,
  "cacheEnabled": true
}', 1, 3600);

-- Popular Destinations
INSERT INTO PageComponents (PageId, PageName, ComponentType, Title, Position, IsActive, Configuration, CacheEnabled, CacheDuration) VALUES
(1, 'HomePage', 'destinations', 'Popular Destinations', 2, 1,
'{
  "layout": "featured-grid",
  "fetchMode": "auto",
  "autoQuery": {
    "count": 5
  },
  "showHotelCount": true,
  "cacheEnabled": true
}', 1, 3600);

-- Romantic Tours
INSERT INTO PageComponents (PageId, PageName, ComponentType, Title, Position, IsActive, Configuration, CacheEnabled, CacheDuration) VALUES
(1, 'HomePage', 'hotels', 'Romantic Tours', 3, 1,
'{
  "layout": "grid-3",
  "fetchMode": "auto",
  "autoQuery": {
    "stars": 5,
    "theme": "romantic",
    "count": 6
  },
  "showPrice": false,
  "showRating": true,
  "cacheEnabled": true
}', 1, 3600);

-- Image Banner Example
INSERT INTO PageComponents (PageId, PageName, ComponentType, Title, Position, IsActive, Configuration, CacheEnabled) VALUES
(1, 'HomePage', 'image-banner', 'Summer Sale 2025', 4, 0,
'{
  "imageUrl": "/uploads/banners/summer-sale.jpg",
  "link": "/search?season=summer",
  "height": "400px",
  "overlay": true,
  "overlayText": "Up to 50% OFF Summer Hotels",
  "buttonText": "Browse Deals",
  "buttonLink": "/search?promo=summer"
}', 0);

-- HTML Component Example
INSERT INTO PageComponents (PageId, PageName, ComponentType, Title, Position, IsActive, Configuration, CacheEnabled, CssClasses) VALUES
(1, 'HomePage', 'html', 'Special Offers Section', 5, 0,
'{
  "htmlContent": "<div class=\"custom-promo\"><h3>Limited Time Offers</h3><p>Book now and save big!</p></div>"
}', 0, 'py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white');

-- =============================================

-- 5. Indexes ve Constraints

-- Component sıralama için
CREATE INDEX IX_PageComponents_PageId_Position ON PageComponents(PageId, Position);

-- Active component'leri hızlı çekmek için
CREATE INDEX IX_PageComponents_PageId_Active_Position ON PageComponents(PageId, IsActive, Position)
WHERE IsActive = 1;

-- Cache expiry kontrolü için
CREATE INDEX IX_PageComponents_CacheExpiry ON PageComponents(CacheExpiry)
WHERE CacheEnabled = 1 AND CacheExpiry IS NOT NULL;

-- =============================================

-- 6. Views

-- Active homepage components view
CREATE VIEW vw_ActiveHomePageComponents AS
SELECT 
    Id,
    ComponentType,
    Title,
    Position,
    Configuration,
    CachedData,
    CacheExpiry,
    CssClasses,
    UpdatedAt
FROM PageComponents
WHERE PageId = 1 
  AND IsActive = 1
  AND (CacheExpiry IS NULL OR CacheExpiry > GETDATE() OR CacheEnabled = 0);

GO

-- =============================================

-- 7. Stored Procedures

-- Component sırasını güncelle
CREATE PROCEDURE sp_UpdateComponentPositions
    @Components NVARCHAR(MAX)  -- JSON array: [{"id": 1, "position": 1}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Temp table oluştur
    CREATE TABLE #TempPositions (
        ComponentId INT,
        NewPosition INT
    );
    
    -- JSON'dan temp table'a parse et
    INSERT INTO #TempPositions (ComponentId, NewPosition)
    SELECT 
        JSON_VALUE(value, '$.id'),
        JSON_VALUE(value, '$.position')
    FROM OPENJSON(@Components);
    
    -- Position'ları güncelle
    UPDATE pc
    SET Position = tp.NewPosition,
        UpdatedAt = GETDATE()
    FROM PageComponents pc
    INNER JOIN #TempPositions tp ON pc.Id = tp.ComponentId;
    
    DROP TABLE #TempPositions;
END;

GO

-- Cache'i yenile
CREATE PROCEDURE sp_RefreshComponentCache
    @ComponentId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cache'i temizle - API'den yeniden çekilecek
    UPDATE PageComponents
    SET CachedData = NULL,
        CacheExpiry = NULL,
        UpdatedAt = GETDATE()
    WHERE Id = @ComponentId;
END;

GO

-- Tüm expire olmuş cache'leri temizle
CREATE PROCEDURE sp_CleanExpiredCaches
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE PageComponents
    SET CachedData = NULL,
        CacheExpiry = NULL
    WHERE CacheEnabled = 1
      AND CacheExpiry IS NOT NULL
      AND CacheExpiry < GETDATE();
      
    SELECT @@ROWCOUNT AS CleanedCount;
END;

GO

-- =============================================
-- Migration tamamlandı
-- =============================================
