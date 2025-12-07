using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class PromotionsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public PromotionsController(RestaurantDbContext context)
        {
            _context = context;
        }

        // ==================== ADMIN ENDPOINTS ====================

        /// <summary>
        /// Tạo mã khuyến mãi mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApiResponse<PromotionResponse>>> CreatePromotion(
            [FromBody] CreatePromotionRequest request)
        {
            try
            {
                // Validate business rules
                ValidatePromotionData(request.DiscountPercent, request.DiscountAmount,
                    request.StartDate, request.EndDate);

                // Check duplicate code
                if (await _context.Promotions.AnyAsync(p => p.Code == request.Code.ToUpper()))
                {
                    return BadRequest(ApiResponse<PromotionResponse>.ErrorResponse(
                        $"Mã khuyến mãi '{request.Code}' đã tồn tại"));
                }

                var promotion = new Promotion
                {
                    Name = request.Name,
                    Code = request.Code.ToUpper(),
                    Description = request.Description,
                    DiscountPercent = request.DiscountPercent,
                    DiscountAmount = request.DiscountAmount,
                    MaxDiscountAmount = request.MaxDiscountAmount,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    MinOrderAmount = request.MinOrderAmount,
                    UsageLimit = request.UsageLimit,
                    Active = request.Active,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Promotions.Add(promotion);
                await _context.SaveChangesAsync();

                var result = MapToResponse(promotion);
                return Ok(ApiResponse<PromotionResponse>.SuccessResponse(
                    result, "Tạo mã khuyến mãi thành công"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<PromotionResponse>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionResponse>.ErrorResponse(
                    "Lỗi khi tạo mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Cập nhật mã khuyến mãi
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApiResponse<PromotionResponse>>> UpdatePromotion(
            int id, [FromBody] UpdatePromotionRequest request)
        {
            try
            {
                var promotion = await _context.Promotions.FindAsync(id);
                if (promotion == null)
                {
                    return NotFound(ApiResponse<PromotionResponse>.ErrorResponse(
                        $"Không tìm thấy khuyến mãi ID: {id}"));
                }

                // Update only provided fields
                if (!string.IsNullOrEmpty(request.Name))
                    promotion.Name = request.Name;

                if (!string.IsNullOrEmpty(request.Description))
                    promotion.Description = request.Description;

                if (request.DiscountPercent.HasValue || request.DiscountAmount.HasValue)
                {
                    ValidatePromotionData(
                        request.DiscountPercent ?? promotion.DiscountPercent,
                        request.DiscountAmount ?? promotion.DiscountAmount,
                        request.StartDate ?? promotion.StartDate,
                        request.EndDate ?? promotion.EndDate
                    );

                    if (request.DiscountPercent.HasValue)
                        promotion.DiscountPercent = request.DiscountPercent;

                    if (request.DiscountAmount.HasValue)
                        promotion.DiscountAmount = request.DiscountAmount;
                }

                if (request.MaxDiscountAmount.HasValue)
                    promotion.MaxDiscountAmount = request.MaxDiscountAmount;

                if (request.StartDate.HasValue)
                    promotion.StartDate = request.StartDate.Value;

                if (request.EndDate.HasValue)
                    promotion.EndDate = request.EndDate.Value;

                if (request.MinOrderAmount.HasValue)
                    promotion.MinOrderAmount = request.MinOrderAmount.Value;

                if (request.UsageLimit.HasValue)
                    promotion.UsageLimit = request.UsageLimit;

                if (request.Active.HasValue)
                    promotion.Active = request.Active.Value;

                promotion.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var result = MapToResponse(promotion);
                return Ok(ApiResponse<PromotionResponse>.SuccessResponse(
                    result, "Cập nhật mã khuyến mãi thành công"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<PromotionResponse>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionResponse>.ErrorResponse(
                    "Lỗi khi cập nhật mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Xóa mã khuyến mãi
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApiResponse<bool>>> DeletePromotion(int id)
        {
            try
            {
                var promotion = await _context.Promotions.FindAsync(id);
                if (promotion == null)
                {
                    return NotFound(ApiResponse<bool>.ErrorResponse(
                        $"Không tìm thấy khuyến mãi ID: {id}"));
                }

                // Check if promotion has been used
                var hasUsage = await _context.PromotionUsages.AnyAsync(pu => pu.PromotionId == id);
                if (hasUsage)
                {
                    // Soft delete - just deactivate
                    promotion.Active = false;
                    promotion.UpdatedAt = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Hard delete - no usage history
                    _context.Promotions.Remove(promotion);
                    await _context.SaveChangesAsync();
                }

                return Ok(ApiResponse<bool>.SuccessResponse(
                    true, "Xóa mã khuyến mãi thành công"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<bool>.ErrorResponse(
                    "Lỗi khi xóa mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả mã khuyến mãi
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<ActionResult<ApiResponse<List<PromotionResponse>>>> GetAllPromotions(
            [FromQuery] bool? activeOnly = null)
        {
            try
            {
                var query = _context.Promotions.AsQueryable();

                if (activeOnly.HasValue && activeOnly.Value)
                {
                    query = query.Where(p => p.Active);
                }

                var promotions = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var result = promotions.Select(MapToResponse).ToList();
                return Ok(ApiResponse<List<PromotionResponse>>.SuccessResponse(
                    result, $"Tìm thấy {result.Count} mã khuyến mãi"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<List<PromotionResponse>>.ErrorResponse(
                    "Lỗi khi lấy danh sách khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Lấy chi tiết mã khuyến mãi theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<ActionResult<ApiResponse<PromotionResponse>>> GetPromotionById(int id)
        {
            try
            {
                var promotion = await _context.Promotions.FindAsync(id);
                if (promotion == null)
                {
                    return NotFound(ApiResponse<PromotionResponse>.ErrorResponse(
                        $"Không tìm thấy khuyến mãi ID: {id}"));
                }

                var result = MapToResponse(promotion);
                return Ok(ApiResponse<PromotionResponse>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionResponse>.ErrorResponse(
                    "Lỗi khi lấy thông tin khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng của một mã khuyến mãi
        /// </summary>
        [HttpGet("{id}/usage-history")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ApiResponse<List<PromotionUsageResponse>>>> GetPromotionUsageHistory(int id)
        {
            try
            {
                var usages = await _context.PromotionUsages
                    .Include(pu => pu.Promotion)
                    .Include(pu => pu.Customer)
                    .Where(pu => pu.PromotionId == id)
                    .OrderByDescending(pu => pu.UsedAt)
                    .ToListAsync();

                var result = usages.Select(u => new PromotionUsageResponse
                {
                    Id = u.Id,
                    PromotionId = u.PromotionId,
                    PromotionName = u.Promotion.Name,
                    PromotionCode = u.Promotion.Code,
                    InvoiceId = u.InvoiceId,
                    CustomerId = u.CustomerId,
                    CustomerName = u.Customer?.FullName ?? u.Customer?.Email,
                    CustomerPhone = u.CustomerPhone ?? u.Customer?.Phone,
                    DiscountApplied = u.DiscountApplied,
                    UsedAt = u.UsedAt
                }).ToList();

                return Ok(ApiResponse<List<PromotionUsageResponse>>.SuccessResponse(
                    result, $"Tìm thấy {result.Count} lần sử dụng"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<List<PromotionUsageResponse>>.ErrorResponse(
                    "Lỗi khi lấy lịch sử sử dụng", new List<string> { ex.Message }));
            }
        }

        // ==================== PUBLIC/CUSTOMER ENDPOINTS ====================

        /// <summary>
        /// Lấy danh sách mã khuyến mãi đang hoạt động (Public)
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<PromotionResponse>>>> GetActivePromotions()
        {
            try
            {
                var now = DateTime.Now;
                var promotions = await _context.Promotions
                    .Where(p => p.Active
                        && p.StartDate <= now
                        && p.EndDate >= now
                        && (p.UsageLimit == null || p.UsageCount < p.UsageLimit))
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var result = promotions.Select(MapToResponse).ToList();
                return Ok(ApiResponse<List<PromotionResponse>>.SuccessResponse(
                    result, $"Có {result.Count} mã khuyến mãi đang hoạt động"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<List<PromotionResponse>>.ErrorResponse(
                    "Lỗi khi lấy danh sách khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Kiểm tra mã khuyến mãi (Public)
        /// </summary>
        [HttpPost("validate")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PromotionValidationResponse>>> ValidatePromotion(
            [FromBody] ValidatePromotionRequest request)
        {
            try
            {
                var result = await ValidatePromotionInternal(request);
                return Ok(ApiResponse<PromotionValidationResponse>.SuccessResponse(
                    result, result.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionValidationResponse>.ErrorResponse(
                    "Lỗi khi kiểm tra mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Áp dụng mã khuyến mãi cho hóa đơn
        /// </summary>
        [HttpPost("apply")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<ActionResult<ApiResponse<PromotionValidationResponse>>> ApplyPromotion(
            [FromQuery] int invoiceId, [FromBody] ApplyPromotionRequest request)
        {
            try
            {
                // Validate promotion first
                var validation = await ValidatePromotionInternal(new ValidatePromotionRequest
                {
                    Code = request.Code,
                    OrderAmount = request.OrderAmount,
                    CustomerId = request.CustomerId,
                    CustomerPhone = request.CustomerPhone
                });

                if (!validation.IsValid)
                {
                    return BadRequest(ApiResponse<PromotionValidationResponse>.ErrorResponse(
                        validation.Message));
                }

                var promotion = await _context.Promotions
                    .FirstOrDefaultAsync(p => p.Code == request.Code.ToUpper());

                // Create usage record
                var usage = new PromotionUsage
                {
                    PromotionId = promotion.Id,
                    InvoiceId = invoiceId,
                    CustomerId = request.CustomerId,
                    CustomerPhone = request.CustomerPhone,
                    DiscountApplied = validation.DiscountAmount.Value,
                    UsedAt = DateTime.Now
                };

                _context.PromotionUsages.Add(usage);

                // Update promotion usage count
                promotion.UsageCount++;
                promotion.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                validation.Message = "Áp dụng mã khuyến mãi thành công";
                return Ok(ApiResponse<PromotionValidationResponse>.SuccessResponse(
                    validation, validation.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionValidationResponse>.ErrorResponse(
                    "Lỗi khi áp dụng mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng khuyến mãi của khách hàng
        /// </summary>
        [HttpGet("customer-usage")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<List<PromotionUsageResponse>>>> GetCustomerPromotionUsage(
            [FromQuery] int? customerId, [FromQuery] string customerPhone)
        {
            try
            {
                var query = _context.PromotionUsages
                    .Include(pu => pu.Promotion)
                    .Include(pu => pu.Customer)
                    .AsQueryable();

                if (customerId.HasValue)
                {
                    query = query.Where(pu => pu.CustomerId == customerId.Value);
                }
                else if (!string.IsNullOrEmpty(customerPhone))
                {
                    query = query.Where(pu => pu.CustomerPhone == customerPhone);
                }
                else
                {
                    return Ok(ApiResponse<List<PromotionUsageResponse>>.SuccessResponse(
                        new List<PromotionUsageResponse>(), "Không có lịch sử sử dụng"));
                }

                var usages = await query
                    .OrderByDescending(pu => pu.UsedAt)
                    .ToListAsync();

                var result = usages.Select(u => new PromotionUsageResponse
                {
                    Id = u.Id,
                    PromotionId = u.PromotionId,
                    PromotionName = u.Promotion.Name,
                    PromotionCode = u.Promotion.Code,
                    InvoiceId = u.InvoiceId,
                    CustomerId = u.CustomerId,
                    CustomerName = u.Customer?.FullName ?? u.Customer?.Email,
                    CustomerPhone = u.CustomerPhone ?? u.Customer?.Phone,
                    DiscountApplied = u.DiscountApplied,
                    UsedAt = u.UsedAt
                }).ToList();

                return Ok(ApiResponse<List<PromotionUsageResponse>>.SuccessResponse(
                    result, $"Tìm thấy {result.Count} lần sử dụng"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<List<PromotionUsageResponse>>.ErrorResponse(
                    "Lỗi khi lấy lịch sử sử dụng", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Tìm mã khuyến mãi theo code (Public - để validate UI)
        /// </summary>
        [HttpGet("by-code/{code}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PromotionResponse>>> GetPromotionByCode(string code)
        {
            try
            {
                var promotion = await _context.Promotions
                    .FirstOrDefaultAsync(p => p.Code == code.ToUpper());

                if (promotion == null)
                {
                    return NotFound(ApiResponse<PromotionResponse>.ErrorResponse(
                        $"Không tìm thấy mã khuyến mãi: {code}"));
                }

                var result = MapToResponse(promotion);
                return Ok(ApiResponse<PromotionResponse>.SuccessResponse(result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<PromotionResponse>.ErrorResponse(
                    "Lỗi khi tìm mã khuyến mãi", new List<string> { ex.Message }));
            }
        }

        // ==================== HELPER METHODS ====================

        private void ValidatePromotionData(decimal? discountPercent, decimal? discountAmount,
            DateTime startDate, DateTime endDate)
        {
            // Must have either percent or amount
            if (!discountPercent.HasValue && !discountAmount.HasValue)
            {
                throw new InvalidOperationException("Phải có ít nhất một loại giảm giá (% hoặc số tiền)");
            }

            // Cannot have both
            if (discountPercent.HasValue && discountAmount.HasValue)
            {
                throw new InvalidOperationException("Chỉ được chọn một loại giảm giá (% hoặc số tiền)");
            }

            // Validate date range
            if (endDate <= startDate)
            {
                throw new InvalidOperationException("Ngày kết thúc phải sau ngày bắt đầu");
            }
        }

        private async Task<PromotionValidationResponse> ValidatePromotionInternal(ValidatePromotionRequest request)
        {
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code == request.Code.ToUpper());

            if (promotion == null)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = "Mã khuyến mãi không tồn tại"
                };
            }

            // Check active
            if (!promotion.Active)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = "Mã khuyến mãi đã bị vô hiệu hóa",
                    Promotion = MapToResponse(promotion)
                };
            }

            // Check date range
            var now = DateTime.Now;
            if (now < promotion.StartDate)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = $"Mã khuyến mãi chưa bắt đầu (từ {promotion.StartDate:dd/MM/yyyy HH:mm})",
                    Promotion = MapToResponse(promotion)
                };
            }

            if (now > promotion.EndDate)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = $"Mã khuyến mãi đã hết hạn (đến {promotion.EndDate:dd/MM/yyyy HH:mm})",
                    Promotion = MapToResponse(promotion)
                };
            }

            // Check usage limit
            if (promotion.UsageLimit.HasValue && promotion.UsageCount >= promotion.UsageLimit.Value)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = "Mã khuyến mãi đã hết lượt sử dụng",
                    Promotion = MapToResponse(promotion)
                };
            }

            // Check minimum order amount
            if (request.OrderAmount < promotion.MinOrderAmount)
            {
                return new PromotionValidationResponse
                {
                    IsValid = false,
                    Message = $"Đơn hàng tối thiểu {promotion.MinOrderAmount:N0}đ để sử dụng mã này",
                    Promotion = MapToResponse(promotion)
                };
            }

            // Check customer usage (if customer info provided)
            if (request.CustomerId.HasValue || !string.IsNullOrEmpty(request.CustomerPhone))
            {
                var hasUsed = await _context.PromotionUsages
                    .AnyAsync(pu => pu.PromotionId == promotion.Id &&
                        (request.CustomerId.HasValue && pu.CustomerId == request.CustomerId.Value ||
                         !string.IsNullOrEmpty(request.CustomerPhone) && pu.CustomerPhone == request.CustomerPhone));

                if (hasUsed)
                {
                    return new PromotionValidationResponse
                    {
                        IsValid = false,
                        Message = "Bạn đã sử dụng mã khuyến mãi này rồi",
                        Promotion = MapToResponse(promotion)
                    };
                }
            }

            // Calculate discount
            var discountAmount = CalculateDiscount(promotion, request.OrderAmount);
            var finalAmount = request.OrderAmount - discountAmount;

            return new PromotionValidationResponse
            {
                IsValid = true,
                Message = "Mã khuyến mãi hợp lệ",
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount,
                Promotion = MapToResponse(promotion)
            };
        }

        private decimal CalculateDiscount(Promotion promotion, decimal orderAmount)
        {
            decimal discount = 0;

            if (promotion.DiscountPercent.HasValue)
            {
                discount = orderAmount * (promotion.DiscountPercent.Value / 100);

                // Apply max discount limit
                if (promotion.MaxDiscountAmount.HasValue && discount > promotion.MaxDiscountAmount.Value)
                {
                    discount = promotion.MaxDiscountAmount.Value;
                }
            }
            else if (promotion.DiscountAmount.HasValue)
            {
                discount = promotion.DiscountAmount.Value;
            }

            // Discount cannot exceed order amount
            if (discount > orderAmount)
            {
                discount = orderAmount;
            }

            return Math.Round(discount, 2);
        }

        private PromotionResponse MapToResponse(Promotion promotion)
        {
            var now = DateTime.Now;
            var isExpired = now > promotion.EndDate;
            var isValid = promotion.Active
                && now >= promotion.StartDate
                && now <= promotion.EndDate
                && (!promotion.UsageLimit.HasValue || promotion.UsageCount < promotion.UsageLimit.Value);

            return new PromotionResponse
            {
                Id = promotion.Id,
                Name = promotion.Name,
                Code = promotion.Code,
                Description = promotion.Description,
                DiscountPercent = promotion.DiscountPercent,
                DiscountAmount = promotion.DiscountAmount,
                MaxDiscountAmount = promotion.MaxDiscountAmount,
                StartDate = promotion.StartDate,
                EndDate = promotion.EndDate,
                MinOrderAmount = promotion.MinOrderAmount,
                UsageLimit = promotion.UsageLimit,
                UsageCount = promotion.UsageCount,
                Active = promotion.Active,
                IsExpired = isExpired,
                IsValid = isValid,
                RemainingUsage = promotion.UsageLimit.HasValue
                    ? promotion.UsageLimit.Value - promotion.UsageCount
                    : null,
                CreatedAt = promotion.CreatedAt,
                UpdatedAt = promotion.UpdatedAt
            };
        }
    }
}
