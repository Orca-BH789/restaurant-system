using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.DTOs;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ExpenseController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public ExpenseController(RestaurantDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExpenseDTO dto)
        {
            var userId = 1; 

            var expense = new Expense
            {
                Amount = dto.Amount,
                Category = dto.Category,
                Description = dto.Description,
                InvoiceNumber = dto.InvoiceNumber,
                Supplier = dto.Supplier,
                PaymentMethod = dto.PaymentMethod,
                TaxCode = dto.TaxCode,
                IsDeductible = dto.IsDeductible,
                DueDate = dto.DueDate,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return Ok(expense);
        }
      
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ExpenseFilterDTO filter)
        {
            var query = _context.Expenses.AsQueryable();

            if (!string.IsNullOrEmpty(filter.Category))
                query = query.Where(x => x.Category == filter.Category);

            if (filter.Status.HasValue)
                query = query.Where(x => x.Status == filter.Status.Value);

            if (!string.IsNullOrEmpty(filter.Supplier))
                query = query.Where(x => x.Supplier == filter.Supplier);

            if (filter.IsDeductible.HasValue)
                query = query.Where(x => x.IsDeductible == filter.IsDeductible.Value);

            if (filter.From.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.From.Value);

            if (filter.To.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.To.Value);

            var list = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(list);
        }

        // ============================================
        // GET BY ID
        // ============================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var exp = await _context.Expenses.FindAsync(id);
            if (exp == null) return NotFound();

            return Ok(exp);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateExpenseDTO dto)
        {
            var exp = await _context.Expenses.FindAsync(id);
            if (exp == null) return NotFound();

            exp.Amount = dto.Amount;
            exp.Category = dto.Category;
            exp.Description = dto.Description;
            exp.InvoiceNumber = dto.InvoiceNumber;
            exp.Supplier = dto.Supplier;
            exp.PaymentMethod = dto.PaymentMethod;
            exp.TaxCode = dto.TaxCode;
            exp.IsDeductible = dto.IsDeductible;
            exp.DueDate = dto.DueDate;

            exp.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(exp);
        }
   
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exp = await _context.Expenses.FindAsync(id);
            if (exp == null) return NotFound();

            _context.Expenses.Remove(exp);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Deleted" });
        }


        [HttpPut("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] ChangeExpenseStatusDTO dto)
        {
            var exp = await _context.Expenses.FindAsync(id);
            if (exp == null) return NotFound();

            exp.Status = dto.Status;
            exp.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Updated status → {dto.Status}" });
        }
     
        [HttpGet("summary")]
        public async Task<IActionResult> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            from ??= DateTime.UtcNow.AddMonths(-1);
            to ??= DateTime.UtcNow;

            var total = await _context.Expenses
                .Where(x => x.CreatedAt >= from && x.CreatedAt <= to)
                .SumAsync(x => x.Amount);

            var deductible = await _context.Expenses
                .Where(x => x.IsDeductible)
                .Where(x => x.CreatedAt >= from && x.CreatedAt <= to)
                .SumAsync(x => x.Amount);

            return Ok(new
            {
                TotalExpenses = total,
                DeductibleExpenses = deductible
            });
        }
    }
}
