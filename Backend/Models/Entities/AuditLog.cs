using System;
using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.Models.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Action { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        [MaxLength(500)]
        public string? Details { get; set; }

        // Navigation property
        public User? User { get; set; }
    }
}