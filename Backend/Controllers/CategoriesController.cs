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
  
    public class CategoriesController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly FileService _fileService;

        public CategoriesController(RestaurantDbContext context, FileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [AllowAnonymous]
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDTO>>> GetCategories()
        {
            var categories = await _context.Categories.Include(c => c.MenuItems).ToListAsync();
            return categories.Select(MapToDto).ToList();
        }

        [AllowAnonymous]       
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDTO>> GetCategory(int id)
        {
            var category = await _context.Categories.Include(c => c.MenuItems).FirstOrDefaultAsync(c => c.Id == id);
            if (category == null) return NotFound();
            return MapToDto(category);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<ActionResult<CategoryDTO>> PostCategory(Category category)
        {
            if (await _context.Categories.AnyAsync(c => c.Name == category.Name))
                return Conflict(new { message = $"Category '{category.Name}' đã tồn tại." });

            category.CreatedAt = DateTime.UtcNow;
            category.UpdatedAt = DateTime.UtcNow;

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, MapToDto(category));
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            if (id != category.Id) return BadRequest();
            if (await _context.Categories.AnyAsync(c => c.Name == category.Name && c.Id != id))
                return Conflict(new { message = $"Category '{category.Name}' đã tồn tại." });

            category.UpdatedAt = DateTime.UtcNow;
            _context.Entry(category).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/upload")]
        public async Task<IActionResult> UpdateCategoryWithImage(int id, [FromBody] CategoryUpdateDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            category.Name = dto.Name;

            if (dto.ImageFile != null)
            {
                _fileService.DeleteImage(category.ImageUrl);
                category.ImageUrl = await _fileService.SaveBase64ImageAsync(dto.ImageFile, dto.FileName ?? $"category_{dto.Name}.png");
            }

         
            category.Description = dto.Description;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }       

        private CategoryDTO MapToDto(Category c)
        {
            return new CategoryDTO
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,  
                ImageUrl = c.ImageUrl,       
                MenuItems = c.MenuItems?.Select(m => new MenuItemDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Price = m.Price,
                    Unit = m.Unit,
                    IsActive = m.IsActive,
                    SortOrder = m.SortOrder,
                    CategoryId = m.CategoryId
                }).ToList() ?? new List<MenuItemDto>()
            };
        }
    }
}
