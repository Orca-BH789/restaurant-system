using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Restaurant_Management.Models.Entities
{
    public class Table
    {
        public int Id { get; set; }

        public int TableNumber { get; set; }

        [StringLength(50)]
        public string? TableName { get; set; }

        public int Capacity { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }
        
        [StringLength(1000)]
        public string? QrCodeUrl { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Available"; // Available, Occupied, Reserved

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        // 🔹 Navigation    
        public virtual ICollection<OrderTable> OrderTables { get; set; } = new List<OrderTable>();
    }
}
