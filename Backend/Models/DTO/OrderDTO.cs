using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.DTO
{
    public class OrderDTO
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public int NumberOfGuests { get; set; } = 1;
        public string OrderType { get; set; } = "DineIn";
        public decimal SubTotal { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal TotalAmount { get; set; } = 0;
        public DateTime OrderTime { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedTime { get; set; }
        public bool CanAddItems => Status == "Ordered";
        public bool CanRequestPayment => Status == "Ordered" && (OrderDetails?.Any() ?? false);
        public bool CanCancelPayment => Status == "PendingPayment";
        public int TotalItems => OrderDetails?.Sum(d => d.Quantity) ?? 0;
        public PromotionDTO? AppliedPromotion { get; set; }

        // Nested objects
        public StaffDTO? Staff { get; set; }
        public List<TableDTO> Tables { get; set; } = new();
        public List<OrderDetailDTO> OrderDetails { get; set; } = new();
    }

    public class ScanTableResponse
    {
        public bool Created { get; set; }
        public string Message { get; set; } = string.Empty;
        public OrderDTO Order { get; set; } = null!;
        public string Token { get; set; } = string.Empty;
        public int ExpiresIn { get; set; } = 14400; // 4 hours
        public string QrUrl { get; set; } = string.Empty;
    }

    public class PaymentRequestResponse
    {
        public string Message { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
    }

    public class CreateOrderDto
    {
        [Required(ErrorMessage = "Staff ID bắt buộc")]
        public int StaffId { get; set; }

        [StringLength(100, ErrorMessage = "Tên khách tối đa 100 ký tự")]
        public string? CustomerName { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(20)]
        public string? CustomerPhone { get; set; }

        [Range(1, 50, ErrorMessage = "Số khách từ 1-50")]
        public int NumberOfGuests { get; set; } = 1;

        [Required]
        [RegularExpression("DineIn|TakeAway|Delivery", ErrorMessage = "OrderType phải là DineIn, TakeAway hoặc Delivery")]
        public string OrderType { get; set; } = "DineIn";

        public List<int> TableIds { get; set; } = new();
        public List<CreateOrderItemDto> Items { get; set; } = new();

        [Range(0, 100, ErrorMessage = "Giảm giá từ 0-100%")]
        public decimal Discount { get; set; } = 0;
    }

    public class CreateOrderItemDto
    {
        [Required(ErrorMessage = "MenuItemId bắt buộc")]
        public int MenuItemId { get; set; }

        [Range(1, 99, ErrorMessage = "Số lượng từ 1-99")]
        public int Quantity { get; set; } = 1;

        [StringLength(200, ErrorMessage = "Ghi chú tối đa 200 ký tự")]
        public string? Note { get; set; }
    }

    public class UpdateOrderDTO
    {
        [StringLength(100, ErrorMessage = "Tên khách tối đa 100 ký tự")]
        public string? CustomerName { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(20)]
        public string? CustomerPhone { get; set; }

        [Range(1, 50, ErrorMessage = "Số khách từ 1-50")]
        public int? NumberOfGuests { get; set; }

        [RegularExpression("DineIn|TakeAway|Delivery", ErrorMessage = "OrderType phải là DineIn, TakeAway hoặc Delivery")]
        public string? OrderType { get; set; }
        public string Status { get; set; }

        [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
        public string? Note { get; set; }
    }

    public class ActivateTableDto
    {
        public int? StaffId { get; set; }

        public int? CustomerId { get; set; }

        [StringLength(100, ErrorMessage = "Tên khách tối đa 100 ký tự")]
        public string? CustomerName { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(20)]
        public string? CustomerPhone { get; set; }

        [Range(1, 50, ErrorMessage = "Số khách từ 1-50")]
        public int? NumberOfGuests { get; set; }
    }

    public class CompleteOrderDto
    {
        public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Transfer, Voucher
        public decimal AmountPaid { get; set; }
        public int? UserId { get; set; } // Staff xử lý thanh toán
        public decimal? ReceivedAmount { get; set; }
        public decimal? ChangeAmount { get; set; }   // tiền thối lại
    }

    public class MergeOrdersDto
    {
        public int SourceOrderId { get; set; }
        public int TargetOrderId { get; set; }

    }
    public class SplitOrderDto
    {
        public List<int> OrderDetailIds { get; set; } = new();
        public int NewTableId { get; set; }
        public int? NumberOfGuests { get; set; }
    }
    public class ApplyPromotionDto
    {
        public int PromotionId { get; set; }
        public decimal DiscountAmount { get; set; }
    }
    public class PromotionDTO
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public decimal? DiscountPercent { get; set; }
        public decimal? DiscountAmount { get; set; }




    }
}