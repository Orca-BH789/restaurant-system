using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Restaurant_Management.Models.Entities
{
    public class OrderDetail
    {
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int MenuItemId { get; set; }

        public string? Note { get; set; }         
        public string? KitchenCode { get; set; }

        public int Quantity { get; set; } = 1;

        [StringLength(50)]
        public string Unit { get; set; } = "Phần";

        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        [StringLength(500)]
        public string? SpecialRequests { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Ordered";        // Ordered, Preparing, Served, Cancelled
        public DateTime CreatedAt { get; set; } 
        public DateTime UpdatedAt { get; set; } 

        // Computed property
        [NotMapped]
        public decimal Subtotal => Quantity * UnitPrice;

        // Navigation properties
        public virtual Order Order { get; set; } = null!;
        public virtual MenuItem MenuItem { get; set; } = null!;
    }
}
