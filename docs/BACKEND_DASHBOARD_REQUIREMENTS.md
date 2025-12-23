# Backend Dashboard Endpoint Gereksinimleri

## 🎯 Sorun

Frontend dashboard `/api/v1/admin/dashboard` endpoint'inden veri çekiyor ancak backend bu endpoint'i henüz doğru formatta implement etmemiş.

## 📍 Endpoint

```
GET /api/v1/admin/dashboard
Authorization: Bearer {token}
```

## ✅ Beklenen Response Format

```json
{
  "stats": {
    "totalBookings": 1247,
    "totalRevenue": 485920,
    "totalCustomers": 892,
    "commission": 48592,
    "bookingsGrowth": 12.5,
    "revenueGrowth": 8.3
  },
  "recentBookings": [
    {
      "id": "BK-001",
      "customer": "Ahmet Kaya",
      "type": "hotel",
      "hotel": "İstanbul Grand Hotel",
      "amount": 1200,
      "status": "confirmed",
      "date": "2025-12-16T10:30:00Z"
    },
    {
      "id": "BK-002",
      "customer": "Fatma Yılmaz",
      "type": "flight",
      "hotel": "Turkish Airlines",
      "amount": 850,
      "status": "pending",
      "date": "2025-12-15T14:20:00Z"
    }
  ],
  "topDestinations": [
    {
      "name": "İstanbul",
      "bookings": 450,
      "percent": 36
    },
    {
      "name": "Antalya",
      "bookings": 380,
      "percent": 30
    },
    {
      "name": "Cappadocia",
      "bookings": 280,
      "percent": 22
    }
  ]
}
```

## 🔧 Backend Implementation (C# .NET)

### 1. Response Model Oluştur

```csharp
// Models/Dashboard/DashboardResponse.cs
public class DashboardResponse
{
    public DashboardStats Stats { get; set; }
    public List<RecentBooking> RecentBookings { get; set; }
    public List<TopDestination> TopDestinations { get; set; }
}

public class DashboardStats
{
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalCustomers { get; set; }
    public decimal Commission { get; set; }
    public double BookingsGrowth { get; set; }  // Percentage
    public double RevenueGrowth { get; set; }   // Percentage
}

public class RecentBooking
{
    public string Id { get; set; }
    public string Customer { get; set; }
    public string Type { get; set; }  // "hotel", "flight", "car"
    public string Hotel { get; set; }  // veya Service olarak değiştirilebilir
    public decimal Amount { get; set; }
    public string Status { get; set; }  // "confirmed", "pending", "cancelled"
    public DateTime Date { get; set; }
}

public class TopDestination
{
    public string Name { get; set; }
    public int Bookings { get; set; }
    public int Percent { get; set; }
}
```

### 2. Controller Endpoint

```csharp
// Controllers/AdminController.cs
[Authorize(Roles = "Admin")]
[HttpGet("dashboard")]
public async Task<ActionResult<DashboardResponse>> GetDashboard()
{
    try
    {
        var response = new DashboardResponse
        {
            Stats = await GetDashboardStatsAsync(),
            RecentBookings = await GetRecentBookingsAsync(),
            TopDestinations = await GetTopDestinationsAsync()
        };

        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Dashboard verisi alınırken hata oluştu");
        return StatusCode(500, new { message = "Dashboard verisi yüklenemedi" });
    }
}

private async Task<DashboardStats> GetDashboardStatsAsync()
{
    var now = DateTime.UtcNow;
    var lastMonth = now.AddMonths(-1);

    var currentBookings = await _context.Bookings
        .Where(b => b.CreatedAt >= lastMonth && b.CreatedAt <= now)
        .ToListAsync();

    var previousMonth = now.AddMonths(-2);
    var previousBookings = await _context.Bookings
        .Where(b => b.CreatedAt >= previousMonth && b.CreatedAt < lastMonth)
        .ToListAsync();

    var totalBookings = currentBookings.Count;
    var totalRevenue = currentBookings.Sum(b => b.TotalPrice);
    var totalCustomers = await _context.Users.CountAsync();
    var commission = totalRevenue * 0.10m; // %10 komisyon

    var bookingsGrowth = previousBookings.Count > 0 
        ? ((double)(totalBookings - previousBookings.Count) / previousBookings.Count) * 100 
        : 0;

    var prevRevenue = previousBookings.Sum(b => b.TotalPrice);
    var revenueGrowth = prevRevenue > 0 
        ? ((double)(totalRevenue - prevRevenue) / (double)prevRevenue) * 100 
        : 0;

    return new DashboardStats
    {
        TotalBookings = totalBookings,
        TotalRevenue = totalRevenue,
        TotalCustomers = totalCustomers,
        Commission = commission,
        BookingsGrowth = Math.Round(bookingsGrowth, 1),
        RevenueGrowth = Math.Round(revenueGrowth, 1)
    };
}

private async Task<List<RecentBooking>> GetRecentBookingsAsync()
{
    var bookings = await _context.Bookings
        .Include(b => b.User)
        .Include(b => b.Hotel)
        .OrderByDescending(b => b.CreatedAt)
        .Take(5)
        .Select(b => new RecentBooking
        {
            Id = b.BookingNumber,
            Customer = b.User.Name,
            Type = b.Type.ToString().ToLower(), // hotel, flight, car
            Hotel = b.Hotel?.Name ?? b.ServiceName,
            Amount = b.TotalPrice,
            Status = b.Status.ToString().ToLower(),
            Date = b.CreatedAt
        })
        .ToListAsync();

    return bookings;
}

private async Task<List<TopDestination>> GetTopDestinationsAsync()
{
    var totalBookings = await _context.Bookings.CountAsync();
    
    var destinations = await _context.Bookings
        .Where(b => b.Type == BookingType.Hotel)
        .GroupBy(b => b.Destination)
        .Select(g => new 
        {
            Name = g.Key,
            Bookings = g.Count()
        })
        .OrderByDescending(x => x.Bookings)
        .Take(5)
        .ToListAsync();

    return destinations.Select(d => new TopDestination
    {
        Name = d.Name,
        Bookings = d.Bookings,
        Percent = totalBookings > 0 ? (int)((d.Bookings * 100.0) / totalBookings) : 0
    }).ToList();
}
```

### 3. Swagger Annotation Ekle

```csharp
[HttpGet("dashboard")]
[Produces("application/json")]
[ProducesResponseType(typeof(DashboardResponse), 200)]
[ProducesResponseType(401)]
[SwaggerOperation(Summary = "Dashboard istatistikleri", 
                  Description = "Admin dashboard için tüm istatistikleri, son rezervasyonları ve popüler destinasyonları getirir")]
public async Task<ActionResult<DashboardResponse>> GetDashboard()
{
    // ... implementation
}
```

## 🧪 Test

### Postman/cURL ile Test

```bash
# 1. Login yap ve token al
curl -X POST https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/Auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@freestays.com",
    "password": "Admin123!"
  }'

# 2. Token ile dashboard'a istek at
curl https://freestays-frontend-xi1vzy-ed390a-3-72-175-63.traefik.me/api/v1/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Beklenen Çıktı

```json
{
  "stats": {
    "totalBookings": 245,
    "totalRevenue": 125000.50,
    "totalCustomers": 156,
    "commission": 12500.05,
    "bookingsGrowth": 15.5,
    "revenueGrowth": 12.3
  },
  "recentBookings": [...],
  "topDestinations": [...]
}
```

## 📝 Migration (Eğer yeni alanlar gerekiyorsa)

```csharp
public partial class AddDashboardFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "BookingNumber",
            table: "Bookings",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "Destination",
            table: "Bookings",
            nullable: true);
    }
}
```

## ✅ Checklist

Backend geliştirici için:

- [ ] `DashboardResponse`, `DashboardStats`, `RecentBooking`, `TopDestination` modellerini oluştur
- [ ] `AdminController` içinde `GetDashboard()` endpoint'ini implement et
- [ ] Database'den gerçek verileri çek (stats, bookings, destinations)
- [ ] Swagger annotation'larını ekle
- [ ] Authorization kontrolü ekle (`[Authorize(Roles = "Admin")]`)
- [ ] Test et (Postman/cURL)
- [ ] Frontend ile entegre test et

## 🚀 Frontend Davranışı

Frontend şu şekilde çalışıyor:

1. **API başarılı ve format doğruysa** → Gerçek veriyi gösterir
2. **API hata dönerse** → Mock data kullanır ve console'a uyarı verir
3. **401 Unauthorized** → Logout yapar ve login'e yönlendirir

Console'da şu mesajları göreceksiniz:
- ✅ `Dashboard verileri API'den yüklendi` - Başarılı
- ⚠️ `API erişilemedi veya yanıt formatı hatalı` - Mock data kullanılıyor
- 💡 `Backend '/api/v1/admin/dashboard' endpoint'ini kontrol edin` - Yardımcı mesaj
