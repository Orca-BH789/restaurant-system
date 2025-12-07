using Restaurant_Management.Models.DTO.AI.RestaurantManagement.DTOs.AI;

namespace Restaurant_Management.Services.AI
{
    public interface IAIAnalyticsService
    {
        Task<AnalyticsResultDto> GetRevenueAnalysisAsync(DateTime? startDate = null, DateTime? endDate = null);
        Task<AnalyticsResultDto> GetPopularItemsAsync(int topN = 10);
        Task<AnalyticsResultDto> GetPeakHoursAsync();
        Task<AnalyticsResultDto> GetTableUtilizationAsync();
        Task<string> GenerateNaturalLanguageResponse(AnalyticsResultDto data);
    }
}
