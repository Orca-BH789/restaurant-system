using Restaurant_Management.Models.DTO.AI.RestaurantManagement.DTOs.AI;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Models.DTO.AI
{
    public class GeminiRequest
    {
        public List<GeminiContent> Contents { get; set; }
        public GeminiGenerationConfig GenerationConfig { get; set; }
    }

    public class GeminiContent
    {
        public string Role { get; set; } // "user" or "model"
        public List<GeminiPart> Parts { get; set; }
    }

    public class GeminiPart
    {
        public string Text { get; set; }
    }

    public class GeminiGenerationConfig
    {
        public double Temperature { get; set; }
        public int MaxOutputTokens { get; set; }
    }

    public class GeminiResponse
    {
        public List<GeminiCandidate> Candidates { get; set; }
    }

    public class GeminiCandidate
    {
        public GeminiContent Content { get; set; }
        public string FinishReason { get; set; }
    }

    // DTO Classes for AI Context
    public class MenuItemForAIDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public string CategoryName { get; set; }
        public bool IsVegetarian { get; set; }
    }

    public class PromotionForAIDto
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public decimal DiscountValue { get; set; }
        public string DiscountType { get; set; } // "Percentage" hoặc "Amount"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class TableForAIDto
    {
        public int Id { get; set; }
        public int TableNumber { get; set; }
        public string TableName { get; set; }
        public int Capacity { get; set; }
        public string Location { get; set; }
    }

    public class AIContextDto
    {
        public List<MenuItemForAIDto> AvailableMenuItems { get; set; } = new();
        public List<PromotionForAIDto> ActivePromotions { get; set; } = new();
        public List<TableForAIDto> AvailableTables { get; set; } = new();
        public Dictionary<string, object> UserPreferences { get; set; } = new();
        public AnalyticsResultDto RecentAnalytics { get; set; }
    }
}
