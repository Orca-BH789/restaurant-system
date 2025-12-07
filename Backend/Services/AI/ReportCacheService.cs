using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.Entities;
using System.Text.Json;

namespace Restaurant_Management.Services.AI
{
    /// <summary>
    /// Service l?u tr? d? li?u analytics vào ReportCache
    /// M?i l?n AI phân tích d? li?u s? ???c cache ?? có th? truy xu?t nhanh sau này
    /// </summary>
    public interface IReportCacheService
    {
        /// <summary>
        /// L?u d? li?u analytics vào cache
        /// </summary>
        Task<ReportCache> SaveAnalyticsReportAsync(
            string reportType,
            DateTime? fromDate,
            DateTime? toDate,
            object reportData);

        /// <summary>
        /// L?y report t? cache (n?u có trong ngày)
        /// </summary>
        Task<ReportCache?> GetCachedReportAsync(string reportType, DateOnly reportDate);

        /// <summary>
        /// L?y t?t c? reports trong kho?ng th?i gian
        /// </summary>
        Task<List<ReportCache>> GetReportsAsync(string reportType, DateOnly fromDate, DateOnly toDate);

        /// <summary>
        /// Xóa cache c? (> 30 ngày)
        /// </summary>
        Task<int> CleanupOldReportsAsync(int daysToKeep = 30);
    }

    public class ReportCacheService : IReportCacheService
    {
        private readonly RestaurantDbContext _context;

        public ReportCacheService(RestaurantDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// L?u analytics report vào cache
        /// </summary>
        public async Task<ReportCache> SaveAnalyticsReportAsync(
            string reportType,
            DateTime? fromDate,
            DateTime? toDate,
            object reportData)
        {
            try
            {
                // T?o unique key d?a trên reportType và date range
                var today = DateOnly.FromDateTime(DateTime.Now);
                
                // Chu?n hóa report type
                var normalizedType = NormalizeReportType(reportType, fromDate, toDate);

                // Serialize data
                var jsonData = JsonSerializer.Serialize(new
                {
                    reportType = reportType,
                    period = new
                    {
                        from = fromDate,
                        to = toDate
                    },
                    data = reportData,
                    cachedAt = DateTime.UtcNow
                });

                // T?o ho?c update cache
                var existingReport = await _context.ReportCaches
                    .FirstOrDefaultAsync(r => r.ReportType == normalizedType && r.ReportDate == today);

                if (existingReport != null)
                {
                    // Update existing cache
                    existingReport.DataJson = jsonData;
                    existingReport.CreatedAt = DateTime.UtcNow;
                    _context.ReportCaches.Update(existingReport);
                }
                else
                {
                    // Create new cache
                    var newReport = new ReportCache
                    {
                        ReportType = normalizedType,
                        ReportDate = today,
                        DataJson = jsonData,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ReportCaches.Add(newReport);
                }

                await _context.SaveChangesAsync();

                var savedReport = await _context.ReportCaches
                    .FirstOrDefaultAsync(r => r.ReportType == normalizedType && r.ReportDate == today);

                Console.WriteLine($"? Saved {reportType} report to cache. ReportId: {savedReport?.Id}");

                return savedReport;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Error saving report cache: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// L?y cached report t? ngày hôm nay
        /// </summary>
        public async Task<ReportCache?> GetCachedReportAsync(string reportType, DateOnly reportDate)
        {
            try
            {
                var normalizedType = reportType; // Ho?c normalize n?u c?n
                var report = await _context.ReportCaches
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.ReportType == normalizedType && r.ReportDate == reportDate);

                if (report != null)
                    Console.WriteLine($"? Found cached report for {reportType} on {reportDate}");
                else
                    Console.WriteLine($"?? No cached report for {reportType} on {reportDate}");

                return report;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Error retrieving cached report: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// L?y t?t c? reports trong date range
        /// </summary>
        public async Task<List<ReportCache>> GetReportsAsync(string reportType, DateOnly fromDate, DateOnly toDate)
        {
            try
            {
                var reports = await _context.ReportCaches
                    .AsNoTracking()
                    .Where(r => r.ReportType == reportType && r.ReportDate >= fromDate && r.ReportDate <= toDate)
                    .OrderBy(r => r.ReportDate)
                    .ToListAsync();

                Console.WriteLine($"? Retrieved {reports.Count} reports for {reportType} from {fromDate} to {toDate}");
                return reports;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Error retrieving reports: {ex.Message}");
                return new List<ReportCache>();
            }
        }

        /// <summary>
        /// Xóa cached reports c? h?n s? ngày ch? ??nh
        /// </summary>
        public async Task<int> CleanupOldReportsAsync(int daysToKeep = 30)
        {
            try
            {
                var cutoffDate = DateOnly.FromDateTime(DateTime.Now.AddDays(-daysToKeep));

                var oldReports = await _context.ReportCaches
                    .Where(r => r.ReportDate < cutoffDate)
                    .ToListAsync();

                if (oldReports.Any())
                {
                    _context.ReportCaches.RemoveRange(oldReports);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"? Deleted {oldReports.Count} old reports");
                }

                return oldReports.Count;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Error cleaning up old reports: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// Chu?n hóa report type d?a trên date range
        /// VD: "revenue_today", "revenue_week", "revenue_month"
        /// </summary>
        private string NormalizeReportType(string reportType, DateTime? fromDate, DateTime? toDate)
        {
            if (fromDate == null || toDate == null)
                return reportType;

            var days = (toDate.Value.Date - fromDate.Value.Date).Days;

            string period = days <= 0 ? "today" :
                           days <= 7 ? "week" :
                           days <= 30 ? "month" :
                           days > 30 ? "year" : "custom";

            return $"{reportType}_{period}";
        }
    }
}
