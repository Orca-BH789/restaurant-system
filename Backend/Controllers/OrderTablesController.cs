using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class OrderTablesController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        public OrderTablesController(RestaurantDbContext context) => _context = context;

        // GET all order-table links
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderTable>>> GetOrderTables()
        {
            return await _context.OrderTables
                .Include(ot => ot.Order)
                .Include(ot => ot.Table)
                .ToListAsync();
        }

        // GET by id (OrderTableId)
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderTable>> GetOrderTable(int id)
        {
            var orderTable = await _context.OrderTables
                .Include(ot => ot.Order)
                .Include(ot => ot.Table)
                .FirstOrDefaultAsync(ot => ot.Id == id);

            if (orderTable == null)
                return NotFound(new { message = $"Không tìm thấy OrderTable {id}" });

            return orderTable;
        }

        // POST: link a table to an order (ghép bàn)
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<OrderTable>> PostOrderTable(OrderTable orderTable)
        {
            // check Order tồn tại
            if (!await _context.Orders.AnyAsync(o => o.Id == orderTable.OrderId))
                return BadRequest(new { message = $"OrderId {orderTable.OrderId} không tồn tại." });

            // check Table tồn tại
            if (!await _context.Tables.AnyAsync(t => t.Id == orderTable.TableId))
                return BadRequest(new { message = $"TableId {orderTable.TableId} không tồn tại." });

            // tránh trùng link Order-Table
            if (await _context.OrderTables.AnyAsync(ot => ot.OrderId == orderTable.OrderId && ot.TableId == orderTable.TableId))
                return Conflict(new { message = $"Order {orderTable.OrderId} đã liên kết với Table {orderTable.TableId}." });

            _context.OrderTables.Add(orderTable);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrderTable), new { id = orderTable.Id }, orderTable);
        }

        // PUT: update OrderTable (ví dụ thay đổi bàn)
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrderTable(int id, OrderTable orderTable)
        {
            if (id != orderTable.Id)
                return BadRequest(new { message = "Id không khớp." });

            // check Order tồn tại
            if (!await _context.Orders.AnyAsync(o => o.Id == orderTable.OrderId))
                return BadRequest(new { message = $"OrderId {orderTable.OrderId} không tồn tại." });

            // check Table tồn tại
            if (!await _context.Tables.AnyAsync(t => t.Id == orderTable.TableId))
                return BadRequest(new { message = $"TableId {orderTable.TableId} không tồn tại." });

            // tránh trùng link Order-Table
            if (await _context.OrderTables.AnyAsync(ot => ot.Id != id && ot.OrderId == orderTable.OrderId && ot.TableId == orderTable.TableId))
                return Conflict(new { message = $"Order {orderTable.OrderId} đã liên kết với Table {orderTable.TableId}." });

            _context.Entry(orderTable).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật OrderTable thành công." });
        }

        // DELETE
        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderTable(int id)
        {
            var orderTable = await _context.OrderTables.FindAsync(id);
            if (orderTable == null)
                return NotFound(new { message = $"OrderTable {id} không tồn tại." });

            _context.OrderTables.Remove(orderTable);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Xóa OrderTable {id} thành công." });
        }
    }
}
