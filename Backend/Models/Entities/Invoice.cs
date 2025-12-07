using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Restaurant_Management.Models.Entities
{
    public class Invoice
    {
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        [StringLength(30)]
        public string PaymentMethod { get; set; } = "Cash";
        public int? PromotionId { get; set; }

        [StringLength(20)]
        public string? PromotionCode { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PromotionDiscount { get; set; } = 0;

        [Column(TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }  
        [Column(TypeName = "decimal(12,2)")]
        public decimal? ReceivedAmount { get; set; } 

        [Column(TypeName = "decimal(12,2)")]
        public decimal? ChangeAmount { get; set; } 

        [StringLength(20)]
        public string Status { get; set; } = "Pending";
     

        [StringLength(100)]
        public string? TransactionId { get; set; } 

        public DateTime PaymentTime { get; set; } 

        public int CreatedBy { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } 
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("PromotionId")]
        public virtual Promotion Promotion { get; set; }
        public virtual Order Order { get; set; } = null!;
        public virtual User CreatedByUser { get; set; } = null!;
       
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; } = new List<PromotionUsage>();
    }
}
