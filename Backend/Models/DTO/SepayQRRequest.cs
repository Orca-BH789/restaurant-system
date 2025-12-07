using Newtonsoft.Json;

namespace Restaurant_Management.Models.DTO
{
    public class SepayQRRequest
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
    }

  
    public class SepayTransactionResponse
    {
        [JsonProperty("status")]
        public int Status { get; set; }

        [JsonProperty("messages")]
        public SepayMessages Messages { get; set; }

        [JsonProperty("transactions")]
        public List<SepayTransaction> Transactions { get; set; }
    }

    public class SepayMessages
    {
        [JsonProperty("success")]
        public bool Success { get; set; }
    }

    public class SepayTransaction
    {
        [JsonProperty("id")]
        public long Id { get; set; }

        [JsonProperty("transaction_date")]
        public DateTime TransactionDate { get; set; }

        [JsonProperty("amount_in")]
        public decimal Amount { get; set; }

        [JsonProperty("transaction_content")]
        public string TransactionContent { get; set; }

        [JsonProperty("reference_number")]
        public string ReferenceNumber { get; set; }

        [JsonProperty("bank_brand_name")]
        public string BankBrandName { get; set; }
    }
}
