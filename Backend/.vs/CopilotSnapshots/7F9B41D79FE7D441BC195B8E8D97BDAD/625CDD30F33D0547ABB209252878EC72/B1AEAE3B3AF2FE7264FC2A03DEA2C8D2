using Restaurant_Management.Models.DTO.AI.RestaurantManagement.DTOs.AI;

namespace Restaurant_Management.Services.AI
{
    public interface IAIChatService
    {
        // Chat Management
        Task<SendMessageResponse> SendMessageAsync(SendMessageRequest request, int? userId = null);
        Task<ConversationDto> GetConversationAsync(string sessionId);
        Task<ConversationHistoryResponse> GetUserConversationsAsync(int? userId, int page = 1, int pageSize = 10);
        Task<bool> EndConversationAsync(string sessionId);

        // Intent Handlers
        Task<List<MenuSuggestionDto>> SuggestMenuItemsAsync(string userMessage, int? userId, int conversationId);
        Task<List<PromotionSuggestionDto>> SuggestPromotionsAsync(string userMessage, int conversationId);
        Task<ReservationSuggestionDto> SuggestReservationAsync(string userMessage, int conversationId);
        Task<AnalyticsResultDto> QueryAnalyticsAsync(string userMessage, int conversationId, int userId);
    }
}
