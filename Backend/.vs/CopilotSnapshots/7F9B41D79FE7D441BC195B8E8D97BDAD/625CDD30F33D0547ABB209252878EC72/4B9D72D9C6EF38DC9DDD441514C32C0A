using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO.AI.RestaurantManagement.DTOs.AI;
using Restaurant_Management.Models.Entities;
using System.Text.Json;

namespace Restaurant_Management.Services.AI
{
    public class AIAnalyticsService : IAIAnalyticsService
    {
        private readonly RestaurantDbContext _context;

        public AIAnalyticsService(RestaurantDbContext context)
        {
            _context = context;
        }

        public async Task<AnalyticsResultDto> GetRevenueAnalysisAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            startDate ??= DateTime.Today;
            endDate ??= DateTime.Today.AddDays(1);

            // Check cache first
            var cacheKey = $"revenue_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}";
            var cached = await _context.ReportCaches
                .Where(r => r.ReportType == cacheKey)
                .FirstOrDefaultAsync();

            if (cached != null)
            {
                return new AnalyticsResultDto
                {
                    QueryType = "revenue",
                    Data = JsonSerializer.Deserialize<object>(cached.DataJson),
                    Summary = "Dữ liệu từ cache",
                    GeneratedAt = cached.CreatedAt
                };
            }

            // Query from HistoryLog
            var orderLogs = await _context.HistoryLogs
                .Where(h => h.Entity == "Order"
                         && h.Action == "Create"
                         && h.CreatedAt >= startDate
                         && h.CreatedAt < endDate)
                .ToListAsync();

            var totalRevenue = orderLogs
                .Select(h => JsonSerializer.Deserialize<Dictionary<string, object>>(h.NewData))
                .Sum(data => data.ContainsKey("TotalAmount")
                    ? Convert.ToDecimal(data["TotalAmount"])
                    : 0);

            var result = new
            {
                TotalRevenue = totalRevenue,
                OrderCount = orderLogs.Count,
                AverageOrderValue = orderLogs.Count > 0 ? totalRevenue / orderLogs.Count : 0,
                Period = new { Start = startDate, End = endDate }
            };

            // Cache result
            await _context.ReportCaches.AddAsync(new ReportCache
            {
                ReportType = cacheKey,
                ReportDate = DateOnly.FromDateTime(startDate.Value),
                DataJson = JsonSerializer.Serialize(result),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return new AnalyticsResultDto
            {
                QueryType = "revenue",
                Data = result,
                Summary = GenerateNaturalLanguageResponse(new AnalyticsResultDto { Data = result }).Result,
                GeneratedAt = DateTime.UtcNow
            };
        }

        public async Task<AnalyticsResultDto> GetPopularItemsAsync(int topN = 10)
        {
            var orderItemLogs = await _context.HistoryLogs
                .Where(h => h.Entity == "OrderItem"
                         && h.Action == "Create"
                         && h.CreatedAt >= DateTime.Today.AddMonths(-1))
                .ToListAsync();

            var popularItems = orderItemLogs
                .Select(h => JsonSerializer.Deserialize<Dictionary<string, object>>(h.NewData))
                .GroupBy(data => data.ContainsKey("MenuItemId") ? Convert.ToInt32(data["MenuItemId"]) : 0)
                .Select(g => new
                {
                    MenuItemId = g.Key,
                    OrderCount = g.Count(),
                    TotalQuantity = g.Sum(item => item.ContainsKey("Quantity") ? Convert.ToInt32(item["Quantity"]) : 0)
                })
                .OrderByDescending(x => x.OrderCount)
                .Take(topN)
                .ToList();

            // Enrich with menu item details
            var menuItemIds = popularItems.Select(p => p.MenuItemId).ToList();
            var menuItems = await _context.MenuItems
                .Where(m => menuItemIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id);

            var enrichedData = popularItems.Select(p => new
            {
                p.MenuItemId,
                Name = menuItems.ContainsKey(p.MenuItemId) ? menuItems[p.MenuItemId].Name : "Unknown",
                p.OrderCount,
                p.TotalQuantity
            }).ToList();

            return new AnalyticsResultDto
            {
                QueryType = "popular_items",
                Data = enrichedData,
                Summary = $"Top {topN} món ăn phổ biến nhất trong tháng qua",
                GeneratedAt = DateTime.UtcNow
            };
        }

        public async Task<AnalyticsResultDto> GetPeakHoursAsync()
        {
            var orderLogs = await _context.HistoryLogs
                .Where(h => h.Entity == "Order"
                         && h.Action == "Create"
                         && h.CreatedAt >= DateTime.Today.AddMonths(-1))
                .ToListAsync();

            var hourlyDistribution = orderLogs
                .GroupBy(h => h.CreatedAt.Hour)
                .Select(g => new
                {
                    Hour = g.Key,
                    OrderCount = g.Count()
                })
                .OrderByDescending(x => x.OrderCount)
                .ToList();

            return new AnalyticsResultDto
            {
                QueryType = "peak_hours",
                Data = hourlyDistribution,
                Summary = $"Giờ cao điểm: {hourlyDistribution.FirstOrDefault()?.Hour}h với {hourlyDistribution.FirstOrDefault()?.OrderCount} đơn hàng",
                GeneratedAt = DateTime.UtcNow
            };
        }

        public async Task<AnalyticsResultDto> GetTableUtilizationAsync()
        {
            var reservationLogs = await _context.HistoryLogs
                .Where(h => h.Entity == "Reservation"
                         && h.Action == "Create"
                         && h.CreatedAt >= DateTime.Today.AddMonths(-1))
                .ToListAsync();

            var tableUsage = reservationLogs
                .Select(h => JsonSerializer.Deserialize<Dictionary<string, object>>(h.NewData))
                .GroupBy(data => data.ContainsKey("TableId") ? Convert.ToInt32(data["TableId"]) : 0)
                .Select(g => new
                {
                    TableId = g.Key,
                    ReservationCount = g.Count()
                })
                .OrderByDescending(x => x.ReservationCount)
                .ToList();

            return new AnalyticsResultDto
            {
                QueryType = "table_utilization",
                Data = tableUsage,
                Summary = $"Bàn được đặt nhiều nhất: Table {tableUsage.FirstOrDefault()?.TableId}",
                GeneratedAt = DateTime.UtcNow
            };
        }

        public async Task<string> GenerateNaturalLanguageResponse(AnalyticsResultDto data)
        {
            await Task.CompletedTask; // Placeholder for async

            switch (data.QueryType)
            {
                case "revenue":
                    var revenueData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                        JsonSerializer.Serialize(data.Data));
                    var totalRevenue = Convert.ToDecimal(revenueData["TotalRevenue"]);
                    var orderCount = Convert.ToInt32(revenueData["OrderCount"]);
                    return $"Doanh thu: {totalRevenue:N0} VNĐ từ {orderCount} đơn hàng. " +
                           $"Trung bình mỗi đơn: {(orderCount > 0 ? totalRevenue / orderCount : 0):N0} VNĐ.";

                default:
                    return data.Summary ?? "Không có dữ liệu";
            }
        }
    }
}
