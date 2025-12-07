using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{
    public class PromotionUsage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PromotionId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        public int? CustomerId { get; set; } // NULL nếu khách vãng lai

        [StringLength(15)]
        public string CustomerPhone { get; set; } // Để check khách vãng lai dùng 1 lần

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountApplied { get; set; } // Số tiền đã giảm

        [Required]
        public DateTime UsedAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("PromotionId")]
        public virtual Promotion Promotion { get; set; }

        [ForeignKey("InvoiceId")]
        public virtual Invoice Invoice { get; set; }

        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }
    }
}
