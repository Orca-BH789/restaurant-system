using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Restaurant_Management.Services.Payment
{
    public interface IPaymentService
    {
        // VietQR
        Task<VietQRResponse> GenerateVietQRAsync(VietQRRequest request);
        Task<PaymentStatusResponse> CheckVietQRStatusAsync(string referenceId);
        bool VerifyWebhookSignature(dynamic request);

        // PayPal
        Task<PayPalOrderResponse> CreatePayPalOrderAsync(PayPalRequest request);
        Task<PayPalCaptureResponse> CapturePayPalOrderAsync(string orderId);
        Task<PayPalStatusResponse> GetPayPalOrderStatusAsync(string orderId);
        Task ProcessPayPalWebhookAsync(dynamic request);
        Task<bool> VerifyPayPalWebhookAsync(dynamic request, IHeaderDictionary headers);
    }

    #region Request Models

    public class VietQRRequest
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
        public int OrderNumber { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
    }

    public class PayPalRequest
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Description { get; set; }
    }

    #endregion

    #region Response Models

    public class VietQRResponse
    {
        public string QRCodeBase64 { get; set; }
        public string QRDataURL { get; set; }
        public string ReferenceId { get; set; }
        public decimal Amount { get; set; }
        public string BankAccount { get; set; }
        public string BankName { get; set; }
        public string AccountName { get; set; }
        public string Content { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class PaymentStatusResponse
    {
        public string Status { get; set; } // pending, success, failed, expired
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public decimal? PaidAmount { get; set; }
        public DateTime? PaidAt { get; set; }
        public string BankTransactionId { get; set; }
    }

    public class PayPalOrderResponse
    {
        public string OrderId { get; set; }
        public string ApprovalUrl { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class PayPalCaptureResponse
    {
        public string Status { get; set; }
        public string TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public DateTime PaidAt { get; set; }
        public string PayerEmail { get; set; }
        public string PayerName { get; set; }
    }

    public class PayPalStatusResponse
    {
        public string Status { get; set; }
        public string OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
    }

    #endregion
}