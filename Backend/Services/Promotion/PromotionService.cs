using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Controllers;
using Restaurant_Management.Data;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Services.Promotion
{
    /// <summary>
    /// Service implementation cho Promotion - Quản lý khuyến mãi
    /// </summary>
    public class PromotionService : IPromotionService
    {
        private readonly RestaurantDbContext _context;

        public PromotionService(RestaurantDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tạo mã khuyến mãi mới
        /// </summary>
        public async Task<PromotionResponse> CreatePromotionAsync(CreatePromotionRequest request)
        {
            // Validate business rules
            ValidatePromotionData(request.DiscountPercent, request.DiscountAmount,
                request.StartDate, request.EndDate);

            // Check duplicate code
            if (await _context.Promotions.AnyAsync(p => p.Code == request.Code.ToUpper()))
            {
                throw new InvalidOperationException($"Mã khuyến mãi '{request.Code}' đã tồn tại");
            }

           
            var promotion = new Models.Entities.Promotion
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

            return MapToResponse(promotion);
        }

        /// <summary>
        /// Cập nhật mã khuyến mãi
        /// </summary>
        public async Task<PromotionResponse> UpdatePromotionAsync(int id, UpdatePromotionRequest request)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi ID: {id}");
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

            return MapToResponse(promotion);
        }

        /// <summary>
        /// Xóa mã khuyến mãi (soft delete nếu đã có usage, hard delete nếu chưa)
        /// </summary>
        public async Task<bool> DeletePromotionAsync(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi ID: {id}");
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

            return true;
        }

        /// <summary>
        /// Lấy chi tiết mã khuyến mãi theo ID
        /// </summary>
        public async Task<PromotionResponse> GetPromotionByIdAsync(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi ID: {id}");
            }

            return MapToResponse(promotion);
        }

        /// <summary>
        /// Lấy chi tiết mã khuyến mãi theo Code
        /// </summary>
        public async Task<PromotionResponse> GetPromotionByCodeAsync(string code)
        {
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code == code.ToUpper());

            if (promotion == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy mã khuyến mãi: {code}");
            }

            return MapToResponse(promotion);
        }

        /// <summary>
        /// Lấy danh sách tất cả mã khuyến mãi
        /// </summary>
        public async Task<List<PromotionResponse>> GetAllPromotionsAsync(bool? activeOnly = null)
        {
            var query = _context.Promotions.AsQueryable();

            if (activeOnly.HasValue && activeOnly.Value)
            {
                query = query.Where(p => p.Active);
            }

            var promotions = await query
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return promotions.Select(MapToResponse).ToList();
        }

        /// <summary>
        /// Lấy danh sách mã khuyến mãi đang hoạt động (active, trong thời gian, còn lượt)
        /// </summary>
        public async Task<List<PromotionResponse>> GetActivePromotionsAsync()
        {
            var now = DateTime.Now;
            var promotions = await _context.Promotions
                .Where(p => p.Active
                    && p.StartDate <= now
                    && p.EndDate >= now
                    && (p.UsageLimit == null || p.UsageCount < p.UsageLimit))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return promotions.Select(MapToResponse).ToList();
        }

        /// <summary>
        /// Validate mã khuyến mãi có hợp lệ không
        /// </summary>
        public async Task<PromotionValidationResponse> ValidatePromotionAsync(ValidatePromotionRequest request)
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

        /// <summary>
        /// Áp dụng mã khuyến mãi cho hóa đơn
        /// </summary>
        public async Task<PromotionValidationResponse> ApplyPromotionAsync(int invoiceId, ApplyPromotionRequest request)
        {
            // Validate promotion first
            var validation = await ValidatePromotionAsync(new ValidatePromotionRequest
            {
                Code = request.Code,
                OrderAmount = request.OrderAmount,
                CustomerId = request.CustomerId,
                CustomerPhone = request.CustomerPhone
            });

            if (!validation.IsValid)
            {
                return validation;
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
            return validation;
        }

        /// <summary>
        /// Lấy lịch sử sử dụng của một mã khuyến mãi
        /// </summary>
        public async Task<List<PromotionUsageResponse>> GetPromotionUsageHistoryAsync(int promotionId)
        {
            var usages = await _context.PromotionUsages
                .Include(pu => pu.Promotion)
                .Include(pu => pu.Customer)
                .Where(pu => pu.PromotionId == promotionId)
                .OrderByDescending(pu => pu.UsedAt)
                .ToListAsync();

            return usages.Select(u => new PromotionUsageResponse
            {
                Id = u.Id,
                PromotionId = u.PromotionId,
                PromotionName = u.Promotion.Name,
                PromotionCode = u.Promotion.Code,
                InvoiceId = u.InvoiceId,
                CustomerId = u.CustomerId,
                // ✅ FIX: Sửa User.Name thành FullName hoặc Email
                // Nếu User entity có Name thì đổi thành: u.Customer?.Name
                CustomerName = u.Customer?.FullName ?? u.Customer?.Email,
                CustomerPhone = u.CustomerPhone ?? u.Customer?.Phone,
                DiscountApplied = u.DiscountApplied,
                UsedAt = u.UsedAt
            }).ToList();
        }

        /// <summary>
        /// Lấy lịch sử sử dụng khuyến mãi của khách hàng
        /// </summary>
        public async Task<List<PromotionUsageResponse>> GetCustomerPromotionUsageAsync(int? customerId, string customerPhone)
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
                return new List<PromotionUsageResponse>();
            }

            var usages = await query
                .OrderByDescending(pu => pu.UsedAt)
                .ToListAsync();

            return usages.Select(u => new PromotionUsageResponse
            {
                Id = u.Id,
                PromotionId = u.PromotionId,
                PromotionName = u.Promotion.Name,
                PromotionCode = u.Promotion.Code,
                InvoiceId = u.InvoiceId,
                CustomerId = u.CustomerId,
                // ✅ FIX: Sửa User.Name thành FullName hoặc Email
                // Nếu User entity có Name thì đổi thành: u.Customer?.Name
                CustomerName = u.Customer?.FullName ?? u.Customer?.Email,
                CustomerPhone = u.CustomerPhone ?? u.Customer?.Phone,
                DiscountApplied = u.DiscountApplied,
                UsedAt = u.UsedAt
            }).ToList();
        }

        // ==================== HELPER METHODS ====================

        /// <summary>
        /// Validate business rules cho promotion data
        /// </summary>
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

        /// <summary>
        /// Tính số tiền giảm giá
        /// </summary>
        private decimal CalculateDiscount(Models.Entities.Promotion promotion, decimal orderAmount)
        {
            decimal discount = 0;

            if (promotion.DiscountPercent.HasValue)
            {
                // Giảm theo phần trăm
                discount = orderAmount * (promotion.DiscountPercent.Value / 100);

                // Apply max discount limit
                if (promotion.MaxDiscountAmount.HasValue && discount > promotion.MaxDiscountAmount.Value)
                {
                    discount = promotion.MaxDiscountAmount.Value;
                }
            }
            else if (promotion.DiscountAmount.HasValue)
            {
                // Giảm số tiền cố định
                discount = promotion.DiscountAmount.Value;
            }

            // Discount cannot exceed order amount
            if (discount > orderAmount)
            {
                discount = orderAmount;
            }

            return Math.Round(discount, 2);
        }

        /// <summary>
        /// Map Entity Promotion sang DTO PromotionResponse
        /// </summary>
        private PromotionResponse MapToResponse(Models.Entities.Promotion promotion)
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