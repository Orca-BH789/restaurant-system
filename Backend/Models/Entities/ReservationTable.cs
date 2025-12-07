using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Models.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{  
    public class ReservationTable
    {
        [Required]
        public int ReservationId { get; set; }

        [Required]
        public int TableId { get; set; }

        public int? SortOrder { get; set; }

        public virtual Reservation Reservation { get; set; } = null!;
        public virtual Table Table { get; set; } = null!;
    }
    
}