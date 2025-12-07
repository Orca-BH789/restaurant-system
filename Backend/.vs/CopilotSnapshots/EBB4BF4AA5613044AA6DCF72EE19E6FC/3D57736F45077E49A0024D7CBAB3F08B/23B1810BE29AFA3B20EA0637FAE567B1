using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{
    public class Order
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string OrderNumber { get; set; } = string.Empty;

        public int StaffId { get; set; }

        [ForeignKey(nameof(Customer))]
        public int? CustomerId { get; set; }

        public virtual Customer? Customer { get; set; }

        public int NumberOfGuests { get; set; } = 1;

        [Column(TypeName = "decimal(12,2)")]
        public decimal SubTotal { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal TaxAmount { get; set; } = 0;

        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalAmount { get; set; } = 0;

        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, InProgress, Completed, Cancelled

        [StringLength(20)]
        public string OrderType { get; set; } = "DineIn"; // DineIn, TakeAway, Delivery

        [StringLength(1000)]
        public string? Notes { get; set; }

        public DateTime OrderTime { get; set; } 

        public DateTime? ServedTime { get; set; }

        public DateTime? CompletedTime { get; set; }

        public DateTime CreatedAt { get; set; } 

        public DateTime UpdatedAt { get; set; }
        public int? AppliedPromotionId { get; set; }
        [ForeignKey("AppliedPromotionId")]
        public Promotion? AppliedPromotion { get; set; }

        // 🔹 Navigation properties
        public virtual User? Staff { get; set; } = null!;
        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public virtual ICollection<OrderTable> OrderTables { get; set; } = new List<OrderTable>(); // ghép bàn
    }
}
