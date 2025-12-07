using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{
    public class Promotion
    {
        [Key]
        public int Id { get; set; }
      
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string Code { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? DiscountPercent { get; set; } // % giảm (0-100)

        [Column(TypeName = "decimal(10,2)")]
        public decimal? DiscountAmount { get; set; } // Số tiền cố định

        [Column(TypeName = "decimal(10,2)")]
        public decimal? MaxDiscountAmount { get; set; } // Giảm tối đa (cho %)

     
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

      
        [Column(TypeName = "decimal(10,2)")]
        public decimal MinOrderAmount { get; set; } = 0;

        public int? UsageLimit { get; set; } 

        public int UsageCount { get; set; } = 0; 

        
        public bool Active { get; set; } = true;

      
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; } = new List<PromotionUsage>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
