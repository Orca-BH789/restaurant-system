using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Controllers;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.DTOs;
using Restaurant_Management.Models.Entities;
using System;

namespace Restaurant_Management.Controllers
{
    [Authorize(Roles = "Staff")]
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public StaffController(RestaurantDbContext context)
        {
            _context = context;
        }


        [HttpGet("tables")]
        public async Task<IActionResult> GetActiveTables()
        {
            var tables = await _context.Tables
                .Where(t => t.Status == "Occupied")
                .Select(t => new { t.Id, t.TableNumber, t.Status })
                .ToListAsync();

            return Ok(tables);
        }

       
        [HttpPut("serve/{kitchenCode}")]
        public async Task<IActionResult> MarkAsServed(string kitchenCode)
        {
            var detail = await _context.OrderDetails.FirstOrDefaultAsync(x => x.KitchenCode == kitchenCode);
            if (detail == null) return NotFound("Không tìm thấy món.");
            if (detail.Status != "Done") return BadRequest("Món chưa hoàn tất.");

            detail.Status = "Served";
            detail.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã đánh dấu {kitchenCode} là Served" });
        }
    }

}
