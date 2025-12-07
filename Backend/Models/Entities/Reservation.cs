using Restaurant_Management.Models.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.Entities
{
    public class Reservation
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(20)]
        public string ReservationNumber { get; set; } = string.Empty;

        [ForeignKey(nameof(Customer))]
        public int? CustomerId { get; set; } 

        [Required]
        [Range(1, 20)]
        public int NumberOfGuests { get; set; }

        [Required]
        public DateTime ReservationTime { get; set; }

        /// <summary>
        /// Trạng thái đặt bàn
        /// - Pending: Chờ xác nhận
        /// - Confirmed: Đã xác nhận
        /// - Arrived: Khách đã đến
        /// - Cancelled: Đã hủy
        /// </summary>
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        [StringLength(1000)]
        public string? Notes { get; set; }
     
        [StringLength(50)]
        public string? PreferredArea { get; set; }
      
        [StringLength(500)]
        public string? CancelReason { get; set; }
    
        public DateTime? CancelledAt { get; set; }
   
        public int? CreatedBy { get; set; }

        /// <summary>
        /// Order được tạo khi khách đến (Status = Arrived)
        /// </summary>
        public int? OrderId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Navigation properties
        [ForeignKey("CreatedBy")]
        public virtual User? User { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; } 

        public virtual Customer? Customer { get; set; }

        public virtual ICollection<ReservationTable> ReservationTables { get; set; } = new List<ReservationTable>();
    }
}