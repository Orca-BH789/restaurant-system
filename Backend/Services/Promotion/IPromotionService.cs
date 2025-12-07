using Restaurant_Management.Controllers;

namespace Restaurant_Management.Services.Promotion
{
    /// <summary>
    /// Interface cho Promotion Service - Quản lý khuyến mãi
    /// </summary>
    public interface IPromotionService
    {
        /// <summary>
        /// Tạo mã khuyến mãi mới
        /// </summary>
        Task<PromotionResponse> CreatePromotionAsync(CreatePromotionRequest request);

        /// <summary>
        /// Cập nhật mã khuyến mãi
        /// </summary>
        Task<PromotionResponse> UpdatePromotionAsync(int id, UpdatePromotionRequest request);

        /// <summary>
        /// Xóa mã khuyến mãi (soft delete nếu đã có usage, hard delete nếu chưa)
        /// </summary>
        Task<bool> DeletePromotionAsync(int id);

        /// <summary>
        /// Lấy chi tiết mã khuyến mãi theo ID
        /// </summary>
        Task<PromotionResponse> GetPromotionByIdAsync(int id);

        /// <summary>
        /// Lấy chi tiết mã khuyến mãi theo Code
        /// </summary>
        Task<PromotionResponse> GetPromotionByCodeAsync(string code);

        /// <summary>
        /// Lấy danh sách tất cả mã khuyến mãi
        /// </summary>
        Task<List<PromotionResponse>> GetAllPromotionsAsync(bool? activeOnly = null);

        /// <summary>
        /// Lấy danh sách mã khuyến mãi đang hoạt động (active, trong thời gian, còn lượt)
        /// </summary>
        Task<List<PromotionResponse>> GetActivePromotionsAsync();

        /// <summary>
        /// Validate mã khuyến mãi có hợp lệ không
        /// </summary>
        Task<PromotionValidationResponse> ValidatePromotionAsync(ValidatePromotionRequest request);

        /// <summary>
        /// Áp dụng mã khuyến mãi cho hóa đơn
        /// </summary>
        Task<PromotionValidationResponse> ApplyPromotionAsync(int invoiceId, ApplyPromotionRequest request);

        /// <summary>
        /// Lấy lịch sử sử dụng của một mã khuyến mãi
        /// </summary>
        Task<List<PromotionUsageResponse>> GetPromotionUsageHistoryAsync(int promotionId);

        /// <summary>
        /// Lấy lịch sử sử dụng khuyến mãi của khách hàng
        /// </summary>
        Task<List<PromotionUsageResponse>> GetCustomerPromotionUsageAsync(int? customerId, string customerPhone);
    }
}