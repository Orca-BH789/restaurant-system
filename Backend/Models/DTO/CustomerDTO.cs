namespace Restaurant_Management.Models.DTO
{
    /// <summary>
    /// DTO cho t?o Customer m?i
    /// </summary>
    public class CreateCustomerDTO
    {
        public string FullName { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Email { get; set; }
    }

    /// <summary>
    /// DTO cho c?p nh?t Customer
    /// </summary>
    public class UpdateCustomerDTO
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Email { get; set; }
    }

    /// <summary>
    /// DTO cho response Customer
    /// </summary>
    public class CustomerDTO
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public int TotalOrders { get; set; }

        public int TotalReservations { get; set; }

        public decimal TotalSpent { get; set; }
    }

    /// <summary>
    /// DTO cho Customer detail (bao g?m danh sách Orders)
    /// </summary>
    public class CustomerDetailDTO : CustomerDTO
    {
        public List<CustomerOrderDTO> Orders { get; set; } = new();

        public List<CustomerReservationDTO> Reservations { get; set; } = new();
    }

    /// <summary>
    /// Simplified Order info trong Customer detail
    /// </summary>
    public class CustomerOrderDTO
    {
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime OrderTime { get; set; }
    }

    /// <summary>
    /// Simplified Reservation info trong Customer detail
    /// </summary>
    public class CustomerReservationDTO
    {
        public int Id { get; set; }

        public string ReservationNumber { get; set; } = string.Empty;

        public DateTime ReservationTime { get; set; }

        public string Status { get; set; } = string.Empty;

        public int NumberOfGuests { get; set; }
    }

    /// <summary>
    /// DTO cho Customer query filters
    /// </summary>
    public class CustomerFilterDTO
    {
        public string? SearchTerm { get; set; }

        public string? SortBy { get; set; } = "Id"; // Id, FullName, Phone, Email, CreatedAt

        public bool IsDescending { get; set; } = false;

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public bool? HasOrders { get; set; }
    }

    /// <summary>
    /// DTO cho paginated response
    /// </summary>
    public class PagedCustomerResponseDTO
    {
        public List<CustomerDTO> Data { get; set; } = new();

        public int TotalCount { get; set; }

        public int PageNumber { get; set; }

        public int PageSize { get; set; }

        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;

        public bool HasPrevious => PageNumber > 1;

        public bool HasNext => PageNumber < TotalPages;
    }
}
