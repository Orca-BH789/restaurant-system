using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using Restaurant_Management.Services.AI;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ReportCachesController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly IReportCacheService _reportCacheService;

        public ReportCachesController(RestaurantDbContext context, IReportCacheService reportCacheService)
        {
            _context = context;
            _reportCacheService = reportCacheService;
        }

        #region CRUD

        // GET: api/ReportCaches
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReportCache>>> GetReportCaches()
        {
            return await _context.ReportCaches.ToListAsync();
        }

        // GET: api/ReportCaches/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ReportCache>> GetReportCache(int id)
        {
            var reportCache = await _context.ReportCaches.FindAsync(id);

            if (reportCache == null)
            {
                return NotFound();
            }

            return reportCache;
        }

        // PUT: api/ReportCaches/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReportCache(int id, ReportCache reportCache)
        {
            if (id != reportCache.Id)
            {
                return BadRequest();
            }

            _context.Entry(reportCache).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReportCacheExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/ReportCaches/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReportCache(int id)
        {
            var reportCache = await _context.ReportCaches.FindAsync(id);
            if (reportCache == null)
            {
                return NotFound();
            }

            _context.ReportCaches.Remove(reportCache);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReportCacheExists(int id)
        {
            return _context.ReportCaches.Any(e => e.Id == id);
        }
        #endregion


        [HttpGet("{reportType}/{date}")]
        public async Task<IActionResult> Get(string reportType, DateOnly date)
        {
            var cache = await _context.ReportCaches
                .FirstOrDefaultAsync(r =>
                    r.ReportType == reportType &&
                    r.ReportDate == date);

            return Ok(cache);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateReportCacheDTO dto)
        {
            var exists = await _context.ReportCaches
                .FirstOrDefaultAsync(r =>
                    r.ReportType == dto.ReportType &&
                    r.ReportDate == dto.ReportDate);

            if (exists != null)
                _context.ReportCaches.Remove(exists);

            var cache = new ReportCache
            {
                ReportType = dto.ReportType,
                ReportDate = dto.ReportDate,
                DataJson = dto.DataJson,
                CreatedAt = DateTime.UtcNow
            };

            _context.ReportCaches.Add(cache);
            await _context.SaveChangesAsync();

            return Ok(cache);
        }

        /// <summary>
        /// Lấy tất cả reports trong date range
        /// </summary>
        [Authorize(Roles = "Admin,Manager,ChatBot")]
        [HttpGet("range")]
        public async Task<ActionResult<List<ReportCache>>> GetReportsInRange(
            [FromQuery] string reportType,
            [FromQuery] DateOnly fromDate,
            [FromQuery] DateOnly toDate)
        {
            try
            {
                var reports = await _reportCacheService.GetReportsAsync(reportType, fromDate, toDate);
                return Ok(new
                {
                    reportType = reportType,
                    period = new { from = fromDate, to = toDate },
                    count = reports.Count,
                    reports = reports
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy cached report hôm nay
        /// </summary>
        [Authorize(Roles = "Admin,Manager,ChatBot")]
        [HttpGet("today/{reportType}")]
        public async Task<ActionResult<ReportCache>> GetTodayReport(string reportType)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                var report = await _reportCacheService.GetCachedReportAsync(reportType, today);

                if (report == null)
                    return NotFound(new { message = $"Không có cached report cho {reportType} hôm nay" });

                return Ok(report);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Xóa cached reports cũ (> 30 ngày)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("cleanup")]
        public async Task<ActionResult> CleanupOldReports([FromQuery] int daysToKeep = 30)
        {
            try
            {
                var deletedCount = await _reportCacheService.CleanupOldReportsAsync(daysToKeep);
                return Ok(new
                {
                    message = $"Đã xóa {deletedCount} reports cũ hơn {daysToKeep} ngày",
                    deletedCount = deletedCount,
                    daysToKeep = daysToKeep
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thống kê cache
        /// </summary>
        [Authorize(Roles = "Admin,Manager")]
        [HttpGet("stats")]
        public async Task<ActionResult> GetCacheStats()
        {
            try
            {
                var stats = await _context.ReportCaches
                    .GroupBy(r => r.ReportType)
                    .Select(g => new
                    {
                        reportType = g.Key,
                        count = g.Count(),
                        oldestDate = g.Min(r => r.ReportDate),
                        latestDate = g.Max(r => r.ReportDate)
                    })
                    .ToListAsync();

                var totalCount = await _context.ReportCaches.CountAsync();
                var oldestReport = await _context.ReportCaches.OrderBy(r => r.ReportDate).FirstOrDefaultAsync();

                return Ok(new
                {
                    totalCached = totalCount,
                    byType = stats,
                    oldestReport = oldestReport?.ReportDate,
                    latestReport = stats.Any() ? stats.Max(s => s.latestDate) : (DateOnly?)null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
