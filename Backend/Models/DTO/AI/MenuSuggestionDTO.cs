namespace Restaurant_Management.Models.DTO.AI
{  
    namespace RestaurantManagement.DTOs.AI
    {
        public class MenuSuggestionDto
        {
            public int MenuItemId { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal Price { get; set; }
            public string ImageUrl { get; set; }
            public string Reason { get; set; } 
            public double ConfidenceScore { get; set; } // 0-1
        }

        public class PromotionSuggestionDto
        {
            public int PromotionId { get; set; }
            public string Code { get; set; }
            public string Description { get; set; }
            public decimal DiscountValue { get; set; }
            public string DiscountType { get; set; }
            public string Reason { get; set; }
            public int UsageCount { get; set; } 
        }

        public class ReservationSuggestionDto
        {
            public List<int> AvailableTableIds { get; set; }
            public DateTime SuggestedTime { get; set; }
            public string Reason { get; set; }
        }

        public class AnalyticsResultDto
        {
            public string QueryType { get; set; }
            public object Data { get; set; }
            public string Summary { get; set; }
            public DateTime GeneratedAt { get; set; }
        }
    }
}
