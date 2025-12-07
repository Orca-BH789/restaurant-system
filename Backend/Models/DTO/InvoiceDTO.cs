using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Restaurant_Management.Models.DTOs
{
    public class InvoiceDTO
    {
        public int Id { get; set; }
        public int OrderId { get; set; }

        public decimal Amount { get; set; }
        public string Status { get; set; } = "Unpaid";

        public int? PromotionId { get; set; }
        public string? PromotionCode { get; set; }      
        public decimal? PromotionDiscount { get; set; } = 0;

        public DateTime PaymentTime { get; set; }
        public int CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public string? OrderNumber { get; set; }
        public string? CustomerName { get; set; }
        public string? CreatedByName { get; set; }
    }

        public class CreateInvoiceDTO
        {
            public int OrderId { get; set; }
            public decimal Amount { get; set; }
            public string? Status { get; set; }
            public int CreatedBy { get; set; }
        }
    public class UpdateInvoiceDTO
    {
        public decimal Amount { get; set; }
        public string? Status { get; set; }
    }
}
