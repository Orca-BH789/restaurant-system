using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.Controllers
{
    // ==================== DTOs ====================
    #region DTOs

    // Request DTOs
    public class CreatePromotionRequest
    {
        [Required(ErrorMessage = "Tên khuyến mãi là bắt buộc")]
        [StringLength(100)]
        public string Name { get; set; }

        [Required(ErrorMessage = "Mã khuyến mãi là bắt buộc")]
        [StringLength(20)]
        [RegularExpression(@"^[A-Z0-9]+$", ErrorMessage = "Mã chỉ chứa chữ HOA và số")]
        public string Code { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Range(0, 100, ErrorMessage = "Phần trăm giảm từ 0-100")]
        public decimal? DiscountPercent { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền giảm phải >= 0")]
        public decimal? DiscountAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền giảm tối đa phải >= 0")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
        public DateTime EndDate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị đơn hàng tối thiểu phải >= 0")]
        public decimal MinOrderAmount { get; set; } = 0;

        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng phải > 0")]
        public int? UsageLimit { get; set; }

        public bool Active { get; set; } = true;
    }

    public class UpdatePromotionRequest
    {
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Range(0, 100)]
        public decimal? DiscountPercent { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? DiscountAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MaxDiscountAmount { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MinOrderAmount { get; set; }

        [Range(1, int.MaxValue)]
        public int? UsageLimit { get; set; }

        public bool? Active { get; set; }
    }

    public class ApplyPromotionRequest
    {
        [Required(ErrorMessage = "Mã khuyến mãi là bắt buộc")]
        public string Code { get; set; }

        [Required(ErrorMessage = "Tổng tiền đơn hàng là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tổng tiền phải > 0")]
        public decimal OrderAmount { get; set; }

        public int? CustomerId { get; set; }

        [StringLength(15)]
        [RegularExpression(@"^[0-9]{10,15}$", ErrorMessage = "Số điện thoại không hợp lệ")]
        public string CustomerPhone { get; set; }
    }

    public class ValidatePromotionRequest
    {
        [Required]
        public string Code { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal OrderAmount { get; set; }

        public int? CustomerId { get; set; }

        [StringLength(15)]
        public string CustomerPhone { get; set; }
    }

    // Response DTOs
    public class PromotionResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int UsageCount { get; set; }
        public bool Active { get; set; }
        public bool IsExpired { get; set; }
        public bool IsValid { get; set; }
        public int? RemainingUsage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class PromotionValidationResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? FinalAmount { get; set; }
        public PromotionResponse Promotion { get; set; }
    }

    public class PromotionUsageResponse
    {
        public int Id { get; set; }
        public int PromotionId { get; set; }
        public string PromotionName { get; set; }
        public string PromotionCode { get; set; }
        public int InvoiceId { get; set; }
        public int? CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerPhone { get; set; }
        public decimal DiscountApplied { get; set; }
        public DateTime UsedAt { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();

        public static ApiResponse<T> SuccessResponse(T data, string message = "Thành công")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> ErrorResponse(string message, List<string> errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }

    #endregion
  

   
}
