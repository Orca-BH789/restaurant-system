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
    [Route("api/[controller]")]
    [ApiController]
    public class OrderDetailsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public OrderDetailsController(RestaurantDbContext context)
        {
            _context = context;
        }

        // ============================================
        // 🔹 STAFF/ADMIN ENDPOINTS
        // ============================================

      //  [Authorize(Roles = "Admin,Staff")]
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDetailDTO>>> GetOrderDetails()
        {
            return await _context.OrderDetails
                .Include(od => od.MenuItem)
                .Include(od => od.Order)
                .Select(od => new OrderDetailDTO
                {
                    Id = od.Id,
                    OrderId = od.OrderId,
                    MenuItemId = od.MenuItemId,
                    MenuItemName = od.MenuItem.Name,
                    Quantity = od.Quantity,
                    UnitPrice = od.UnitPrice,
                    Note = od.Note,
                    Status = od.Status,
                    CreatedAt = od.CreatedAt,
                    UpdatedAt = od.UpdatedAt
                })
                .ToListAsync();
        }

        // [Authorize(Roles = "Admin,Staff")]
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDetailDTO>> GetOrderDetail(int id)
        {
            var od = await _context.OrderDetails
                .Include(x => x.MenuItem)
                .Include(x => x.Order)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (od == null)
                return NotFound(new { message = $"OrderDetail {id} không tồn tại." });

            return new OrderDetailDTO
            {
                Id = od.Id,
                OrderId = od.OrderId,
                MenuItemId = od.MenuItemId,
                MenuItemName = od.MenuItem.Name,
                Quantity = od.Quantity,
                UnitPrice = od.UnitPrice,
                Note = od.Note,
                Status = od.Status,
                CreatedAt = od.CreatedAt,
                UpdatedAt = od.UpdatedAt
            };
        }

       // [Authorize(Roles = "Admin,Staff,Chef")]
        [AllowAnonymous]
        [HttpPut("{detailId}/status")]
        public async Task<IActionResult> UpdateOrderDetailStatus(int detailId, [FromBody] string status)
        {
            var detail = await _context.OrderDetails.FindAsync(detailId);
            if (detail == null)
                return NotFound(new { message = $"OrderDetail {detailId} không tồn tại." });

            var validStatuses = new[] { "Pending", "Cooking", "Ready", "Served", "Cancelled" };
            if (!validStatuses.Contains(status))
                return BadRequest(new { message = "Trạng thái không hợp lệ." });

            detail.Status = status;
            detail.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Cập nhật trạng thái món thành công: {status}" });
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderDetail(int id)
        {
            var od = await _context.OrderDetails
                .Include(x => x.Order)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (od == null)
                return NotFound(new { message = $"OrderDetail {id} không tồn tại." });

            if (od.Order.Status == "Completed" || od.Order.Status == "Cancelled")
                return BadRequest(new { message = "Không thể xóa món của order đã hoàn thành/hủy." });

            _context.OrderDetails.Remove(od);
            await _context.SaveChangesAsync();

            await RecalculateOrderTotals(od.Order);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Xóa OrderDetail {id} thành công." });
        }
        
        /// <summary>
        /// POST: Thêm món (Customer)
        /// TableTokenMiddleware đã parse token và lưu OrderId vào HttpContext.Items["OrderId"]
        /// </summary>
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<OrderDetailDTO>> AddOrderItem([FromBody] CreateOrderDetailDTO dto)
        {
            //Lấy OrderId từ middleware
            var tokenOrderId = HttpContext.Items["OrderId"] as int?;

            if (!tokenOrderId.HasValue)
                return Unauthorized(new { message = "Vui lòng quét mã QR để truy cập." });
          
            if (dto.OrderId != tokenOrderId.Value)
                return Forbid();

            // Check order
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId);

            if (order == null)
                return NotFound(new { message = $"Order {dto.OrderId} không tồn tại." });
          
            if (order.Status != "Ordered")
            {
                var message = order.Status switch
                {
                    "Completed" => "Bữa ăn đã thanh toán. Kính mong Quý khách về trang chủ.",
                    "Cancelled" => "Bữa ăn hôm nay đã bị hủy. Kính mong Quý khách về trang chủ để được hỗ trợ.",
                    "PendingPayment" => "Bữa ăn hôm nay đang chờ thanh toán, không thể thêm món nữa",
                    _ => "Không thể thêm món được nha."
                };
                return BadRequest(new { message });
            }

            // Validate menu item
            var menuItem = await _context.MenuItems.FindAsync(dto.MenuItemId);
            if (menuItem == null)
                return BadRequest(new { message = $"MenuItem {dto.MenuItemId} không tồn tại." });

            if (!menuItem.IsAvailable)
                return BadRequest(new { message = "Món này hiện không khả dụng." });

            // Check if item already exists
            var existingDetail = order.OrderDetails
                .FirstOrDefault(d => d.MenuItemId == dto.MenuItemId && d.Status == "Pending");

            if (existingDetail != null)
            {
                // Cộng thêm số lượng
                existingDetail.Quantity += dto.Quantity;
                existingDetail.Note = dto.Note ?? existingDetail.Note;
                existingDetail.UpdatedAt = DateTime.UtcNow;

                await RecalculateOrderTotals(order);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã cập nhật số lượng món.",
                    orderDetail = MapToDTO(existingDetail, menuItem.Name)
                });
            }

            // Tạo OrderDetail mới
            var orderDetail = new OrderDetail
            {
                OrderId = dto.OrderId,
                MenuItemId = dto.MenuItemId,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : menuItem.Price,
                KitchenCode = $"K-{DateTime.Now:MMddHHmmss}-{dto.MenuItemId}",
                Note = dto.Note,
                Unit= menuItem.Unit,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.OrderDetails.Add(orderDetail);
            await _context.SaveChangesAsync();

            await RecalculateOrderTotals(order);
            await _context.SaveChangesAsync();

            var result = MapToDTO(orderDetail, menuItem.Name);
            return CreatedAtAction(nameof(GetOrderDetail), new { id = orderDetail.Id }, result);
        }

        /// <summary>
        /// PUT: Sửa món (Customer)
        /// </summary>
        [AllowAnonymous]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderItem(int id, [FromBody] UpdateOrderDetailDTO dto)
        {
            var tokenOrderId = HttpContext.Items["OrderId"] as int?;

            if (!tokenOrderId.HasValue)
                return Unauthorized(new { message = "Vui lòng quét mã QR để truy cập." });

            var orderDetail = await _context.OrderDetails
                .Include(od => od.Order)
                .FirstOrDefaultAsync(od => od.Id == id);

            if (orderDetail == null)
                return NotFound(new { message = $"OrderDetail {id} không tồn tại." });

            // Validate: orderDetail phải thuộc order của token
            if (orderDetail.OrderId != tokenOrderId.Value)
                return Forbid();

            // Check order status
            if (orderDetail.Order.Status != "Ordered")
                return BadRequest(new { message = $"Không thể sửa món khi order đang ở trạng thái '{orderDetail.Order.Status}'." });

            // Không cho sửa nếu món đã vào bếp
            if (orderDetail.Status == "Cooking" || orderDetail.Status == "Ready" || orderDetail.Status == "Served")
                return BadRequest(new { message = $"Không thể sửa món đang ở trạng thái '{orderDetail.Status}'." });

            orderDetail.Quantity = dto.Quantity;
            orderDetail.UnitPrice = dto.UnitPrice;
            orderDetail.Note = dto.Note;
            orderDetail.UpdatedAt = DateTime.UtcNow;

            await RecalculateOrderTotals(orderDetail.Order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật món thành công." });
        }

        /// <summary>
        /// DELETE: Xóa món (Customer)
        /// </summary>
        [AllowAnonymous]
        [HttpDelete("customer/{id}")]
        public async Task<IActionResult> CustomerDeleteOrderItem(int id)
        {
            var tokenOrderId = HttpContext.Items["OrderId"] as int?;

            if (!tokenOrderId.HasValue)
                return Unauthorized(new { message = "Vui lòng quét mã QR để truy cập." });

            var orderDetail = await _context.OrderDetails
                .Include(od => od.Order)
                .FirstOrDefaultAsync(od => od.Id == id);

            if (orderDetail == null)
                return NotFound(new { message = $"OrderDetail {id} không tồn tại." });

            // Validate: orderDetail phải thuộc order của token
            if (orderDetail.OrderId != tokenOrderId.Value)
                return Forbid();

            // Check order status
            if (orderDetail.Order.Status != "Ordered")
                return BadRequest(new { message = $"Không thể xóa món khi order đang ở trạng thái '{orderDetail.Order.Status}'." });

            // Không cho xóa nếu món đã vào bếp
            if (orderDetail.Status == "Cooking" || orderDetail.Status == "Ready" || orderDetail.Status == "Served")
                return BadRequest(new { message = $"Không thể xóa món đang ở trạng thái '{orderDetail.Status}'." });

            _context.OrderDetails.Remove(orderDetail);
            await _context.SaveChangesAsync();

            await RecalculateOrderTotals(orderDetail.Order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa món thành công." });
        }

        // ============================================
        // 🔹 HELPER METHODS
        // ============================================

        private async Task RecalculateOrderTotals(Order order)
        {
            await _context.Entry(order)
                .Collection(o => o.OrderDetails)
                .Query()
                .Include(d => d.MenuItem)
                .LoadAsync();

            order.SubTotal = order.OrderDetails
                .Where(d => d.Status != "Cancelled")
                .Sum(d => d.UnitPrice * d.Quantity);

            order.TaxAmount = (order.SubTotal - order.DiscountAmount) * 0.1m;
            order.TotalAmount = order.SubTotal - order.DiscountAmount + order.TaxAmount;
            order.UpdatedAt = DateTime.UtcNow;
        }

        private static OrderDetailDTO MapToDTO(OrderDetail od, string menuItemName)
        {
            return new OrderDetailDTO
            {
                Id = od.Id,
                OrderId = od.OrderId,
                MenuItemId = od.MenuItemId,
                MenuItemName = menuItemName,
                Quantity = od.Quantity,
                UnitPrice = od.UnitPrice,
                Note = od.Note,
                Status = od.Status,
                CreatedAt = od.CreatedAt,
                UpdatedAt = od.UpdatedAt
            };
        }
    }
}