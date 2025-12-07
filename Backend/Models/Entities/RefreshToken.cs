using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{
   
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; } = null!;

        [Required]
        [MaxLength(500)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiresAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
        
        public bool IsRevoked { get; set; } = false;   
        
        public DateTime? RevokedAt { get; set; }

        [MaxLength(200)]
        public string? RevokeReason { get; set; }
      
        [MaxLength(50)]
        public string? IpAddress { get; set; }
      
        [MaxLength(500)]
        public string? UserAgent { get; set; }
        public string DeviceFingerprint { get; set; } = string.Empty;
        public DateTime LastUsedAt { get; set; }
        public string DeviceName { get; set; } = string.Empty;

        public bool IsValid => !IsRevoked && DateTime.UtcNow < ExpiresAt;
    }
}