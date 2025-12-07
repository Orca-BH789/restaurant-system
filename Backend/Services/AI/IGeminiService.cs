using Restaurant_Management.Models.DTO.AI;
using Restaurant_Management.Models.DTO.AI.RestaurantManagement.DTOs.AI;

namespace Restaurant_Management.Services.AI
{
    public interface IGeminiService
    {
        Task<string> GetChatCompletionAsync(
            string userMessage,
            List<ChatMessageDto> conversationHistory,
            AIContextDto context = null);

        Task<string> GenerateSystemPrompt(AIContextDto context);
    }
}
