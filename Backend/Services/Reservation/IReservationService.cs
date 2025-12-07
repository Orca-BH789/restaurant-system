using Restaurant_Management.Models.DTO;

namespace Restaurant_Management.Services.Reservation
{
    /// <summary>
    /// Interface cho Reservation Service
    /// Xử lý toàn bộ business logic liên quan đến đặt bàn
  
    public interface IReservationService
    {
        // ============ CREATE & UPDATE ============

        /// <summary>
        /// Tạo đặt bàn mới với gợi ý bàn tự động
        /// - Check công suất 50%
        /// - Tự động gợi ý bàn phù hợp
        /// - Check buffer time (±1h)
        /// </summary>
        Task<CreateReservationResponseDTO> CreateReservationAsync(CreateReservationDTO dto, int? userId = null);

        /// <summary>
        /// Xác nhận đặt bàn (Pending -> Confirmed)
        /// - Gửi email xác nhận
        /// - Schedule reminder email
        /// </summary>
        Task<bool> ConfirmReservationAsync(int reservationId, int userId);

        /// <summary>
        /// Khách đến nhà hàng (Confirmed -> Arrived)
        /// - Tạo Order tự động
        /// - Link các bàn vào OrderTable
        /// </summary>
        Task<int> ArriveReservationAsync(int reservationId, int staffId);

        /// <summary>
        /// Hủy đặt bàn
        /// - Customer: Chỉ hủy được nếu còn ≥30 phút
        /// - Staff/Admin: Hủy bất kỳ lúc nào
        /// </summary>
        Task<bool> CancelReservationAsync(int reservationId, int userId, string? cancelReason = null);       

        /// <summary>
        /// Lấy chi tiết reservation theo ID
        /// </summary>
        Task<ReservationDetailDTO?> GetReservationByIdAsync(int reservationId);

        /// <summary>
        /// Lấy reservation theo số đặt bàn (ReservationNumber)
        /// </summary>
        Task<ReservationDetailDTO?> GetReservationByNumberAsync(string reservationNumber);

        /// <summary>
        /// Lấy danh sách reservation với filter và pagination
        /// </summary>
        Task<PagedReservationResponseDTO> GetReservationsAsync(ReservationQueryDTO query);

        /// <summary>
        /// Lấy danh sách reservation của khách hàng (theo phone)
        /// </summary>
        Task<List<ReservationListDTO>> GetCustomerReservationsAsync(string customerPhone);

        /// <summary>
        /// Dashboard statistics cho ngày cụ thể
        /// </summary>
        Task<ReservationDashboardDTO> GetDashboardAsync(DateTime date);

        /// <summary>
        /// Timeline/Calendar view
        /// </summary>
        Task<ReservationTimelineDTO> GetTimelineAsync(DateTime date);

        // ============ TABLE MANAGEMENT ============

        /// <summary>
        /// Gợi ý bàn phù hợp dựa trên số khách và thời gian
        /// </summary>
        Task<List<TableSuggestionDTO>> SuggestTablesAsync(int numberOfGuests, DateTime reservationTime, string? preferredArea = null);

        /// <summary>
        /// Check xem bàn có khả dụng trong khung giờ không
        /// </summary>
        Task<bool> IsTableAvailableAsync(int tableId, DateTime reservationTime);

        /// <summary>
        /// Tính % công suất hiện tại (real-time)
        /// </summary>
        Task<double> GetCurrentCapacityPercentAsync();        

        /// <summary>
        /// Tự động hủy các reservation quá 15 phút chưa đến
        /// Chạy mỗi 5 phút
        /// </summary>
        Task CancelOverdueReservationsAsync();
        /// <summary>
        /// Gửi email nhắc nhở trước 1 giờ
        /// Chạy mỗi 10 phút
        /// </summary>
        Task SendReminderEmailsAsync();       

        /// <summary>
        /// Validate thời gian đặt bàn
        /// - Phải >= Now + 30 phút
        /// - Trong khung giờ 10:00 - 22:00
        /// </summary>
        bool ValidateReservationTime(DateTime reservationTime);

        /// <summary>
        /// Check xem customer có quyền cancel reservation không
        /// </summary>
        Task<bool> CanCustomerCancelAsync(int reservationId, string customerPhone);
    }
}
