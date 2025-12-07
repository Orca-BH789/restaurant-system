using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Restaurant_Management.Models.DTO;
using RestaurantManagement.Services;

namespace RestaurantManagement.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly FileService _fileService;

        public UploadController(FileService fileService)
        {
            _fileService = fileService;
        }     

        [HttpPost("base64")]
        public async Task<IActionResult> UploadBase64([FromBody] UploadBase64Dto dto)
        {
            if (string.IsNullOrEmpty(dto.FileName) || string.IsNullOrEmpty(dto.Base64))
                return BadRequest(new { message = "Thiếu dữ liệu." });

            try
            {
                var imageUrl = await _fileService.SaveBase64ImageAsync(dto.Base64, dto.FileName);

                var fullUrl = $"{Request.Scheme}://{Request.Host}{imageUrl}";
                return Ok(new { imageUrl = fullUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi upload: {ex.Message}" });
            }
        }
    }
}
