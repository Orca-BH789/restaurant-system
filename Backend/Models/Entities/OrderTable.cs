using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Restaurant_Management.Models.Entities
{
    public class OrderTable
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public int TableId { get; set; }

        // Navigation
        public virtual Order Order { get; set; } = null!;
        public virtual Table Table { get; set; } = null!;
    }
}
