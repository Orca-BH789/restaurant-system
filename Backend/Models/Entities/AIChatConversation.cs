using Restaurant_Management.Models.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantManagement.Models
{
    [Table("AIChatConversation")]
    public class AIChatConversation
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("User")]
        public int? UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string SessionId { get; set; }

        [MaxLength(100)]
        public string Topic { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime StartedAt { get; set; } = DateTime.Now;

        [Required]
        public DateTime LastMessageAt { get; set; } = DateTime.Now;

        [MaxLength(50)]
        public string? IntentType { get; set; } // "menu", "promotion", "reservation", "analytics"

        // Navigation Properties
        public virtual User User { get; set; }
        public virtual ICollection<AIChatMessage> Messages { get; set; }    
        public virtual ICollection<AIChatActionLog> ActionLogs { get; set; }
    }
}