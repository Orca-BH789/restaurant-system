using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using RestaurantManagement.Services;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MenuItemsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly FileService _fileService;

        public MenuItemsController(RestaurantDbContext context, FileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        // GET all
        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MenuItemDto>>> GetMenuItems()
        {
            var menuItems = await _context.MenuItems
                .Include(m => m.Category)
                .ToListAsync();

            return menuItems.Select(MapToDto).ToList();
        }

        // GET by Id
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<MenuItemDto>> GetMenuItem(int id)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return NotFound(new { message = $"MenuItem với Id {id} không tồn tại" });

            return MapToDto(menuItem);
        }

        // POST
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<MenuItemDto>> PostMenuItem([FromBody] MenuItemCreateDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Dữ liệu không hợp lệ." });

            if (await _context.MenuItems.AnyAsync(m => m.Name == dto.Name && m.CategoryId == dto.CategoryId))
                return Conflict(new { message = $"Món '{dto.Name}' đã tồn tại trong Category này." });

            var menuItem = new MenuItem
            {
                Name = dto.Name,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                Price = dto.Price,
                CostPrice = dto.CostPrice,
                Unit = dto.Unit ?? "Phần",
                PreparationTime = dto.PreparationTime,
                SortOrder = dto.SortOrder,
                IsAvailable = dto.IsAvailable,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Lưu ảnh
            if (!string.IsNullOrEmpty(dto.ImageFile))
            {
                menuItem.ImageUrl = await _fileService.SaveBase64ImageAsync(
                    dto.ImageFile,
                    dto.FileName ?? $"menuitem_{menuItem.Name}.png"
                );
            }

            _context.MenuItems.Add(menuItem);
            await _context.SaveChangesAsync();
            await _context.Entry(menuItem).Reference(m => m.Category).LoadAsync();

            return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.Id }, MapToDto(menuItem));
        }

        // PUT
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMenuItem(int id, [FromBody] MenuItemUpdateDto dto)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.Category) 
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return NotFound(new { message = $"MenuItem với Id {id} không tồn tại" });

            if (await _context.MenuItems
                .AnyAsync(m => m.Name == dto.Name && m.CategoryId == dto.CategoryId && m.Id != id))
            {
                return Conflict(new { message = $"Món '{dto.Name}' đã tồn tại trong Category này." });
            }

            menuItem.Name = dto.Name;
            menuItem.Description = dto.Description;
            menuItem.CategoryId = dto.CategoryId;
            menuItem.Price = dto.Price;
            menuItem.CostPrice = dto.CostPrice;
            menuItem.Unit = dto.Unit ?? "Phần";
            menuItem.PreparationTime = dto.PreparationTime;
            menuItem.SortOrder = dto.SortOrder;
            menuItem.IsAvailable = dto.IsAvailable;
            menuItem.IsActive = dto.IsActive;
            menuItem.UpdatedAt = DateTime.UtcNow;

            // Update ảnh nếu có gửi mới
            if (!string.IsNullOrEmpty(dto.ImageFile))
            {             
                if (!string.IsNullOrEmpty(menuItem.ImageUrl))
                {
                    _fileService.DeleteImage(menuItem.ImageUrl);
                }

                menuItem.ImageUrl = await _fileService.SaveBase64ImageAsync(
                    dto.ImageFile,
                    dto.FileName ?? $"menuitem_{menuItem.Name}.png"
                );
            }

            await _context.SaveChangesAsync();

            // ✅ Reload Category nếu CategoryId thay đổi
            if (menuItem.Category?.Id != dto.CategoryId)
            {
                await _context.Entry(menuItem).Reference(m => m.Category).LoadAsync();
            }

            return Ok(MapToDto(menuItem));
        }

        // DELETE
        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenuItem(int id)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null)
                return NotFound(new { message = $"MenuItem với Id {id} không tồn tại" });

            _fileService.DeleteImage(menuItem.ImageUrl);
            _context.MenuItems.Remove(menuItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private MenuItemDto MapToDto(MenuItem m)
        {
            return new MenuItemDto
            {
                Id = m.Id,
                CategoryId = m.CategoryId,
                Name = m.Name,
                Description = m.Description,
                Price = m.Price,
                CostPrice = m.CostPrice,
                Unit = m.Unit,
                PreparationTime = m.PreparationTime,
                IsAvailable = m.IsAvailable,
                IsActive = m.IsActive,
                SortOrder = m.SortOrder,
                ImageUrl = m.ImageUrl,
                Category = m.Category == null ? null : new CategoryDTO
                {
                    Id = m.Category.Id,
                    Name = m.Category.Name
                }
            };
        }
    }
}
