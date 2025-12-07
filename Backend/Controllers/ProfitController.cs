using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfitController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public ProfitController(RestaurantDbContext context)
        {
            _context = context;
        }
   
        [HttpGet]
        public async Task<IActionResult> GetProfit(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            from ??= DateTime.UtcNow.Date.AddDays(-30);
            to ??= DateTime.UtcNow;

            // ----- Revenue -----
            var revenue = await _context.Invoices
                .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
                .SumAsync(i => i.Amount);

            // ----- Deductible Expenses -----
            var expenses = await _context.Expenses
                .Where(e => e.IsDeductible)
                .Where(e => e.CreatedAt >= from && e.CreatedAt <= to)
                .SumAsync(e => e.Amount);

            var profit = revenue - expenses;

            return Ok(new
            {
                From = from,
                To = to,
                Revenue = revenue,
                Expenses = expenses,
                Profit = profit,
                ProfitMargin = revenue == 0 ? 0 : (profit / revenue)
            });
        }

        // ============================================
        // DAILY CHART: Lợi nhuận theo từng ngày
        // GET api/profit/daily?days=30
        // ============================================
        [HttpGet("daily")]
        public async Task<IActionResult> GetDailyProfit([FromQuery] int days = 30)
        {
            var from = DateTime.UtcNow.Date.AddDays(-days);

            var invoices = await _context.Invoices
                .Where(i => i.CreatedAt >= from)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.IsDeductible && e.CreatedAt >= from)
                .ToListAsync();

            var daily = Enumerable.Range(0, days + 1).Select(offset =>
            {
                var date = from.AddDays(offset).Date;

                var dayRevenue = invoices
                    .Where(x => x.CreatedAt.Date == date)
                    .Sum(x => x.Amount);

                var dayExpense = expenses
                    .Where(x => x.CreatedAt.Date == date)
                    .Sum(x => x.Amount);

                return new
                {
                    Date = date,
                    Revenue = dayRevenue,
                    Expenses = dayExpense,
                    Profit = dayRevenue - dayExpense
                };
            });

            return Ok(daily);
        }

        // ============================================
        // TOP EXPENSES (chi phí lớn nhất)
        // GET api/profit/top-expenses?limit=5
        // ============================================
        [HttpGet("top-expenses")]
        public async Task<IActionResult> GetTopExpenses([FromQuery] int limit = 5)
        {
            var data = await _context.Expenses
                .OrderByDescending(e => e.Amount)
                .Take(limit)
                .ToListAsync();

            return Ok(data);
        }

        // ============================================
        // TOP REVENUE DAYS (Ngày doanh thu cao nhất)
        // GET api/profit/top-revenue-days?limit=7
        // ============================================
        [HttpGet("top-revenue-days")]
        public async Task<IActionResult> GetTopRevenueDays([FromQuery] int limit = 7)
        {
            var revenueByDay = await _context.Invoices
                .GroupBy(i => i.CreatedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(x => x.Amount)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(limit)
                .ToListAsync();

            return Ok(revenueByDay);
        }

       
        [HttpGet("tax-form")]
        public async Task<IActionResult> GetTaxForm([FromQuery] int month, [FromQuery] int year)
        {
            var from = new DateTime(year, month, 1);
            var to = from.AddMonths(1).AddDays(-1);

            var revenue = await _context.Invoices
                .Where(i => i.CreatedAt >= from && i.CreatedAt <= to)
                .SumAsync(i => i.Amount);

            var expenses = await _context.Expenses
                .Where(e => e.IsDeductible)
                .Where(e => e.CreatedAt >= from && e.CreatedAt <= to)
                .SumAsync(e => e.Amount);

            var profit = revenue - expenses;

            // Ví dụ thuế GTGT 8%, TNCN 5% (Có thể thay đổi tùy mô hình)
            var estimatedTax = profit * 0.05m;

            return Ok(new
            {
                Period = $"{month}/{year}",
                Revenue = revenue,
                DeductibleExpenses = expenses,
                Profit = profit,
                ProfitMargin = revenue == 0 ? 0 : (profit / revenue),
                EstimatedTax = estimatedTax
            });
        }
    }
}
