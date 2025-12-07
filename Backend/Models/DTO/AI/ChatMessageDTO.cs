namespace Restaurant_Management.Models.DTO.AI
{

    namespace RestaurantManagement.DTOs.AI
    {
        public class ChatMessageDto
        {
            public string Role { get; set; } // "user" or "assistant"
            public string Content { get; set; }
            public DateTime CreatedAt { get; set; }
            public object Metadata { get; set; } // Parsed JSON
        }

        public class SendMessageRequest
        {
            public string Message { get; set; }
            public string? SessionId { get; set; }
        }

        public class SendMessageResponse
        {
            public string? SessionId { get; set; }
            public string Response { get; set; }
            public string IntentType { get; set; }
            public object Data { get; set; }
            public DateTime Timestamp { get; set; }
        }

        public class ConversationDto
        {
            public int Id { get; set; }
            public string? SessionId { get; set; }
            public string Topic { get; set; }
            public bool IsActive { get; set; }
            public DateTime StartedAt { get; set; }
            public DateTime LastMessageAt { get; set; }
            public List<ChatMessageDto> Messages { get; set; }
        }

        public class ConversationHistoryResponse
        {
            public List<ConversationDto> Conversations { get; set; }
            public int TotalCount { get; set; }
        }
    }
}