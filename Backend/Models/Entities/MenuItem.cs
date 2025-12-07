using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages.Manage;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Restaurant_Management.Models.Entities
{
    [Index(nameof(Name), nameof(CategoryId), IsUnique = true)]

    public class MenuItem
    {
        public int Id { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal CostPrice { get; set; } = 0; // optional cho phân tích lãi

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(50)]
        public string Unit { get; set; } = "Phần"; // vd: Ly, Chai, Dĩa

        public int PreparationTime { get; set; } = 15; // phút

        public bool IsAvailable { get; set; } = true; // còn món không
        public bool IsActive { get; set; } = true;    // ẩn/hiện trong menu

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } 
        public DateTime UpdatedAt { get; set; }

        // Navigation properties    
        public virtual Category Category { get; set; } = null!;
        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    }
}
