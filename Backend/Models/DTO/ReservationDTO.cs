using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.Models.DTO
{
    public class ReservationDetailDTO
    {
        public int Id { get; set; }
        public string ReservationNumber { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public int NumberOfGuests { get; set; }
        public DateTime ReservationTime { get; set; }
        public string Status { get; set; } = string.Empty; // Pending, Confirmed, Arrived, Cancelled
        public string? Notes { get; set; }
        public string? PreferredArea { get; set; }     
        public List<TableSuggestionDTO> SuggestedTables { get; set; } = new();
   
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Order link (nếu đã Arrived)
        public int? OrderId { get; set; }
        public string? OrderNumber { get; set; }
    }

    /// <summary>
    /// DTO thông tin bàn gợi ý
    /// </summary>
    public class TableSuggestionDTO
    {
        public int TableId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public string Location { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho danh sách reservation (list view)
    /// </summary>
    public class ReservationListDTO
    {
        public int Id { get; set; }
        public string ReservationNumber { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public int NumberOfGuests { get; set; }
        public DateTime ReservationTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public int TableCount { get; set; }
        public string TableNames { get; set; } = string.Empty; // "Bàn 1, Bàn 2"
        public DateTime CreatedAt { get; set; }
    }


    /// DTO cho cập nhật trạng thái reservation  
    public class UpdateReservationStatusDTO
    {
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        [RegularExpression("^(Confirmed|Arrived|Cancelled)$", ErrorMessage = "Trạng thái không hợp lệ")]
        public string Status { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Ghi chú không quá 500 ký tự")]
        public string? Notes { get; set; }
    }

    /// DTO cho filter và pagination  
    public class ReservationQueryDTO
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Status { get; set; } // Pending, Confirmed, Arrived, Cancelled, ALL
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string SortBy { get; set; } = "ReservationTime"; // ReservationTime, CreatedAt
        public bool IsDescending { get; set; } = false;
    }

   
    /// Response có pagination 
    public class PagedReservationResponseDTO
    {
        public List<ReservationListDTO> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;
    }


    /// DTO Dashboard statistics  
    public class ReservationDashboardDTO
    {
        public DateTime Date { get; set; }
        public int TotalReservations { get; set; }
        public int PendingCount { get; set; }
        public int ConfirmedCount { get; set; }
        public int ArrivedCount { get; set; }
        public int CancelledCount { get; set; }
        public double CurrentCapacityPercent { get; set; }
        public List<ReservationListDTO> UpcomingReservations { get; set; } = new(); // Trong 1 giờ tới
        public List<ReservationListDTO> OverdueReservations { get; set; } = new(); // Quá 15 phút chưa đến
    }

   
    /// DTO cho Timeline/Calendar view   
    public class ReservationTimelineDTO
    {
        public DateTime Date { get; set; }
        public List<TimeSlotDTO> TimeSlots { get; set; } = new();
    }

    public class TimeSlotDTO
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public List<TableReservationDTO> TableReservations { get; set; } = new();
    }

    public class TableReservationDTO
    {
        public int TableId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int? ReservationId { get; set; }
        public string? ReservationNumber { get; set; }
        public string? CustomerName { get; set; }
        public string Status { get; set; } = "Available"; // Available, Pending, Confirmed, Arrived, InOrder
    }
    public class CreateReservationDTO
    {
        public int? CustomerId { get; set; }

        [StringLength(50, MinimumLength = 2, ErrorMessage = "Tên phải từ 2-50 ký tự")]
        [RegularExpression(@"^[a-zA-ZÀ-ỹ\s']{2,50}$", ErrorMessage = "Tên không hợp lệ")]
        public string? CustomerName { get; set; }

        [RegularExpression(@"^(0|\+84)[0-9]{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? CustomerPhone { get; set; }

        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string? CustomerEmail { get; set; }

        [Required(ErrorMessage = "Số lượng khách là bắt buộc")]
        [Range(1, 20, ErrorMessage = "Số lượng khách từ 1-20 người")]
        public int NumberOfGuests { get; set; }

        [Required(ErrorMessage = "Thời gian đặt bàn là bắt buộc")]
        public DateTime ReservationTime { get; set; }

        [StringLength(500, ErrorMessage = "Ghi chú không quá 500 ký tự")]
        public string? Notes { get; set; }

        [StringLength(50)]
        public string? PreferredArea { get; set; }
    }

    /// <summary>
    /// Response khi tạo reservation thành công
    /// </summary>
    public class CreateReservationResponseDTO
    {
        public bool Success { get; set; }
        public ReservationDetailDTO? Data { get; set; }
        public string? Message { get; set; }
    }

    
    public class ErrorResponseDTO
    {
        public bool Success { get; set; } = false;
        public ErrorDetailDTO Error { get; set; } = new();
    }

    public class ErrorDetailDTO
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public object? Details { get; set; }
    }

    public class CancelReservationDTO
    {
        [StringLength(500, ErrorMessage = "Lý do hủy không quá 500 ký tự")]
        public string? CancelReason { get; set; }
    }
}
