using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Models.DTO
{
    public class ExpenseDTO
    {
    }
    public class CreateExpenseDTO
    {
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Supplier { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? TaxCode { get; set; }
        public bool IsDeductible { get; set; } = true;
        public DateTime? DueDate { get; set; }
    }
    public class UpdateExpenseDTO
    {
        public decimal Amount { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Supplier { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? TaxCode { get; set; }
        public bool IsDeductible { get; set; } = true;
        public DateTime? DueDate { get; set; }
    }
    public class ChangeExpenseStatusDTO
    {
        public ExpenseStatus Status { get; set; }
    }
    public class ExpenseFilterDTO
    {
        public string? Category { get; set; }
        public ExpenseStatus? Status { get; set; }
        public string? Supplier { get; set; }
        public bool? IsDeductible { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }




}
