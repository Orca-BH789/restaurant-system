using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantManagement.Models
{
    [Table("AIChatActionLog")]
    public class AIChatActionLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Conversation")]
        public int ConversationId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ActionType { get; set; } // "suggest_item", "suggest_promotion", "book_table", "query_analytics"

        [MaxLength(50)]
        public string? EntityType { get; set; } // "MenuItem", "Promotion", "Reservation"

        public int? EntityId { get; set; }

        [Column(TypeName = "NVARCHAR(MAX)")]
        public string? ActionData { get; set; }

        [Column(TypeName = "NVARCHAR(MAX)")]
        public string? Result { get; set; } 

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Property
        public virtual AIChatConversation Conversation { get; set; }
    }
}