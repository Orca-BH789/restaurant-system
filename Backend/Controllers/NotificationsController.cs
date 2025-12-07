using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Restaurant_Management.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public NotificationsController(RestaurantDbContext context)
        {
            _context = context;
        }

        #region CRUD
        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
        {
            return await _context.Notifications.ToListAsync();
        }

        // GET: api/Notifications/5

        //[HttpGet("{id}")]
        //public async Task<ActionResult<Notification>> GetNotification(int id)
        //{
        //    var notification = await _context.Notifications.FindAsync(id);

        //    if (notification == null)
        //    {
        //        return NotFound();
        //    }

        //    return notification;
        //}

        // PUT: api/Notifications/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNotification(int id, Notification notification)
        {
            if (id != notification.Id)
            {
                return BadRequest();
            }

            _context.Entry(notification).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NotificationExists(id))
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

        // POST: api/Notifications
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        //[HttpPost]
        //public async Task<ActionResult<Notification>> PostNotification(Notification notification)
        //{
        //    _context.Notifications.Add(notification);
        //    await _context.SaveChangesAsync();

        //    return CreatedAtAction("GetNotification", new { id = notification.Id }, notification);
        //}

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool NotificationExists(int id)
        {
            return _context.Notifications.Any(e => e.Id == id);
        }
        #endregion

        [HttpGet("role/{role}")]
        public async Task<IActionResult> GetByRole(string role)
        {
            var items = await _context.Notifications
                .Where(n => n.TargetRole == role)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateNotificationDTO dto)
        {
            var notification = new Notification
            {
                Type = dto.Type,
                TargetRole = dto.TargetRole,
                TableId = dto.TableId,
                OrderId = dto.OrderId,
                ReferenceId = dto.ReferenceId,
                Title = dto.Title,
                Message = dto.Message,
                Payload = dto.Payload,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(notification);
        }
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var item = await _context.Notifications.FindAsync(id);
            if (item == null) return NotFound();

            item.IsRead = true;
            item.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(item);
        }
        
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("unread")]
        public async Task<ActionResult<IEnumerable<NotificationDTO>>> GetUnreadNotifications()
        {
            try
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Staff";

                var notifications = await _context.Notifications
                    .Where(n => n.TargetRole == role && !n.IsRead)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                return Ok(notifications.Select(n => new NotificationDTO
                {
                    Id = n.Id,
                    Type = n.Type,
                    TargetRole = n.TargetRole,
                    TableId = n.TableId,
                    OrderId = n.OrderId,
                    ReferenceId = n.ReferenceId,
                    Title = n.Title,
                    Message = n.Message,
                    Payload = n.Payload,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    ReadAt = n.ReadAt
                }).ToList());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi lấy notifications.", error = ex.Message });
            }
        }
       
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Staff";

                var unreadNotifications = await _context.Notifications
                    .Where(n => n.TargetRole == role && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = $"Đã đánh dấu {unreadNotifications.Count} notifications là đã đọc." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật notifications.", error = ex.Message });
            }
        }

    }
}
