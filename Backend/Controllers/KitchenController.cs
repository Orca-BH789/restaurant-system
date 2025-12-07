// File: Controllers/KitchenController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Hubs;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.DTOs;
using Restaurant_Management.Utils;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class KitchenController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly IHubContext<KitchenHub> _hub;

        public KitchenController(RestaurantDbContext context, IHubContext<KitchenHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // GET: api/kitchen?station=Hot
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetPendingItems([FromQuery] string? station)
        {
            var query = _context.OrderDetails
                .Where(x => x.Status != "Done")
                .AsQueryable();

            if (!string.IsNullOrEmpty(station))
                query = query.Where(x => x.KitchenCode == station);

            var items = await query
                .Include(x => x.MenuItem)
                .Include(x => x.Order)
                    .ThenInclude(o => o.OrderTables)
                        .ThenInclude(ot => ot.Table)
                .Select(x => new
                {
                    x.Id,
                    x.KitchenCode,
                    x.Note,
                    x.Quantity,
                    Status = x.Status,
                    MenuItemName = x.MenuItem.Name,
                    Table = x.Order.OrderTables.Select(ot => ot.Table.TableNumber).FirstOrDefault(),
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/kitchen/table/5
        [AllowAnonymous]
        [HttpGet("table/{tableId}")]
        public async Task<IActionResult> GetPendingItemsByTable(int tableId)
        {
            var items = await _context.OrderDetails
                .Where(x => x.Order.OrderTables.Any(ot => ot.Table.TableNumber == tableId))
                .Where(x => x.Status != "Done")
                .Include(x => x.MenuItem)
                .Select(x => new
                {
                    x.Id,
                    x.Note,
                    Status = x.Status,
                    MenuItemName = x.MenuItem.Name,
                    Table = x.Order.OrderTables.Select(ot => ot.Table.TableNumber).FirstOrDefault(),
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return Ok(items);
        }

        // PUT: api/kitchen/update-status/123
        [AllowAnonymous]
        [HttpPut("update-status/{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderDTO dto)
        {
            var detail = await _context.OrderDetails.FirstOrDefaultAsync(x => x.Id == id);
            if (detail == null) return NotFound("Món không tồn tại.");

            if (!KitchenFlow.Flow.Contains(dto.Status))
                return BadRequest("Status không hợp lệ.");

            var old = detail.Status;
            detail.Status = dto.Status;
            detail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Broadcast full list
            await BroadcastKdsUpdate();

            // If became Ready, notify specifically
            if (dto.Status == "Ready" && old != "Ready")
            {
                await _hub.Clients.All.SendAsync("NotifyReady", new { itemId = detail.Id, table = detail.Order.OrderTables.Select(ot => ot.Table.TableNumber).FirstOrDefault(), menuItem = detail.MenuItem.Name });
            }

            return Ok(new { message = $"Updated {id} → {dto.Status}" });
        }

        // PUT: api/kitchen/next/123
        [AllowAnonymous]
        [HttpPut("next/{id}")]
        public async Task<IActionResult> NextStatus(int id)
        {
            var detail = await _context.OrderDetails
                .Include(x => x.MenuItem)
                .Include(x => x.Order)
                    .ThenInclude(o => o.OrderTables)
                        .ThenInclude(ot => ot.Table)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (detail == null) return NotFound("Item không tồn tại.");

            var flow = KitchenFlow.Flow;
            var index = flow.IndexOf(detail.Status);

            if (index < 0 || index == flow.Count - 1)
                return BadRequest("Không thể chuyển tiếp.");

            var old = detail.Status;
            detail.Status = flow[index + 1];
            detail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await BroadcastKdsUpdate();

            // Notify Ready if reached Ready
            if (detail.Status == "Ready" && old != "Ready")
            {
                await _hub.Clients.All.SendAsync("NotifyReady", new { itemId = detail.Id, table = detail.Order.OrderTables.Select(ot => ot.Table.TableNumber).FirstOrDefault(), menuItem = detail.MenuItem.Name });
            }

            return Ok(detail.Status);
        }

        // PUT: api/kitchen/undo/123
        [AllowAnonymous]
        [HttpPut("undo/{id}")]
        public async Task<IActionResult> UndoStatus(int id)
        {
            var detail = await _context.OrderDetails.FindAsync(id);
            if (detail == null) return NotFound("Item không tồn tại.");

            var flow = KitchenFlow.Flow;
            var index = flow.IndexOf(detail.Status);

            if (index <= 0)
                return BadRequest("Không thể undo.");

            detail.Status = flow[index - 1];
            detail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await BroadcastKdsUpdate();
            return Ok(detail.Status);
        }

        // PUT: api/kitchen/table-done/5
        [AllowAnonymous]
        [HttpPut("table-done/{tableNumber}")]
        public async Task<IActionResult> MarkTableDone(int tableNumber)
        {
            var items = await _context.OrderDetails
                .Where(x => x.Order.OrderTables.Any(ot => ot.Table.TableNumber == tableNumber))
                .ToListAsync();

            if (!items.Any())
                return NotFound("Không có item nào cho bàn này.");

            foreach (var item in items)
            {
                item.Status = "Done";
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await BroadcastKdsUpdate();
            return Ok($"Bàn {tableNumber} đã hoàn tất.");
        }

        // Helper: broadcast current KDS snapshot
        private async Task BroadcastKdsUpdate()
        {
            var items = await _context.OrderDetails
                .Where(x => x.Status != "Done")
                .Include(x => x.MenuItem)
                .Include(x => x.Order)
                    .ThenInclude(o => o.OrderTables)
                        .ThenInclude(ot => ot.Table)
                .Select(x => new
                {
                    x.Id,
                    x.KitchenCode,
                    x.Note,
                    x.Quantity,
                    Status = x.Status,
                    MenuItemName = x.MenuItem.Name,
                    Table = x.Order.OrderTables.Select(ot => ot.Table.TableNumber).FirstOrDefault(),
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            await _hub.Clients.All.SendAsync("KdsUpdated", items);
        }
    }
}
