// Models/AIChatMessage.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantManagement.Models
{
    [Table("AIChatMessage")]
    public class AIChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Conversation")]
        public int ConversationId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } 

        [Required]
        [Column(TypeName = "NVARCHAR(MAX)")]
        public string Content { get; set; }

        [Column(TypeName = "NVARCHAR(MAX)")]
        public string? Metadata { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

       
        public virtual AIChatConversation Conversation { get; set; }
    }
}