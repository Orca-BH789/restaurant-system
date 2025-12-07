using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Restaurant_Management.Services.Payment;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Restaurant_Management.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentService> _logger;
        private readonly HttpClient _httpClient;

        // VietQR Config
        private readonly string _sepayApiKey;
        private readonly string _sepayApiUrl;
        private readonly string _bankAccount;
        private readonly string _bankAccountName;
        private readonly string _bankName;
        private readonly string _bankCode;
        private readonly string _webhookSecret;

        // PayPal Config
        private readonly string _paypalClientId;
        private readonly string _paypalClientSecret;
        private readonly string _paypalApiUrl;
        private readonly string _paypalWebhookId;

        public PaymentService( IConfiguration configuration, ILogger<PaymentService> logger,IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();

            // Load VietQR config
            _sepayApiKey = _configuration["Payment:VietQR:SepayApiKey"] ?? "";
            _sepayApiUrl = _configuration["Payment:VietQR:SepayApiUrl"] ?? "";
            _bankAccount = _configuration["Payment:VietQR:BankAccountNumber"] ?? "";
            _bankAccountName = _configuration["Payment:VietQR:BankAccountName"] ?? "";
            _bankName = _configuration["Payment:VietQR:BankName"] ?? "";
            _bankCode = _configuration["Payment:VietQR:BankCode"] ?? "";
            _webhookSecret = _configuration["Payment:VietQR:WebhookSecret"] ?? "";

            // Load PayPal config
            _paypalClientId = _configuration["Payment:PayPal:ClientId"] ?? "";
            _paypalClientSecret = _configuration["Payment:PayPal:ClientSecret"] ?? "";
            var paypalMode = _configuration["Payment:PayPal:Mode"] ?? "Sandbox";
            _paypalApiUrl = paypalMode == "Live"
                ? _configuration["Payment:PayPal:LiveApiUrl"]
                : _configuration["Payment:PayPal:SandboxApiUrl"];
            _paypalWebhookId = _configuration["Payment:PayPal:WebhookId"] ?? "";
        }

        #region VietQR Implementation

        #region VietQR Implementation

        public async Task<VietQRResponse> GenerateVietQRAsync(VietQRRequest request)
        {
            try
            {
                // Generate reference ID cho tracking (không dùng để match với Sepay)
                var referenceId = $"INV{request.InvoiceId}_{DateTime.UtcNow:yyyyMMddHHmmss}";

                // ⭐ Content theo format: TTDH{OrderId}
                // Sepay sẽ gửi nguyên content này trong webhook
                var content = $"TTDH{request.OrderId}";

                _logger.LogInformation($"🔷 Generating VietQR - Invoice: {request.InvoiceId}, Order: {request.OrderId}, Content: {content}");

                // Validate config
                if (string.IsNullOrEmpty(_bankCode) || string.IsNullOrEmpty(_bankAccount))
                {
                    throw new Exception("VietQR configuration is missing. Please check appsettings.json");
                }

                // Generate VietQR URL using VietQR.io API (FREE)
                // Docs: https://vietqr.io/
                var accountName = Uri.EscapeDataString(_bankAccountName);
                var transferContent = Uri.EscapeDataString(content);

                var qrUrl = $"https://img.vietqr.io/image/{_bankCode}-{_bankAccount}-qr_only.png" +
                           $"?amount={request.Amount}" +
                           $"&addInfo={transferContent}" +
                           $"&accountName={accountName}";

                _logger.LogInformation($"✅ Generated QR URL: {qrUrl}");

                return new VietQRResponse
                {
                    QRCodeBase64 = "", // Can convert image to base64 if needed
                    QRDataURL = qrUrl,
                    ReferenceId = referenceId, // Chỉ để tracking, không dùng để match
                    Amount = request.Amount,
                    BankAccount = _bankAccount,
                    BankName = _bankName,
                    AccountName = _bankAccountName,
                    Content = content, // ⭐ "TTDH{OrderId}"
                    ExpiresAt = DateTime.UtcNow.AddMinutes(3)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generating VietQR");
                throw new Exception("Không thể tạo mã QR. Vui lòng thử lại.", ex);
            }
        }

        public async Task<PaymentStatusResponse> CheckVietQRStatusAsync(string referenceId)
        {
            try
            {
                _logger.LogInformation($"🔍 Checking VietQR status for reference: {referenceId}");

                // ⚠️ LƯU Ý: Phương thức này chỉ dùng để frontend polling
                // Thực tế Sepay sẽ gửi webhook trực tiếp, không cần check API

                // Nếu không có Sepay API key, return pending
                if (string.IsNullOrEmpty(_sepayApiKey))
                {
                    _logger.LogWarning("⚠️ Sepay API key not configured. Returning pending status.");
                    return new PaymentStatusResponse
                    {
                        Status = "pending",
                        TransactionId = referenceId,
                        Amount = 0
                    };
                }

                // Validate API URL
                if (string.IsNullOrEmpty(_sepayApiUrl) || !Uri.IsWellFormedUriString(_sepayApiUrl, UriKind.Absolute))
                {
                    _logger.LogWarning($"⚠️ Invalid Sepay API URL: {_sepayApiUrl}. Returning pending.");
                    return new PaymentStatusResponse
                    {
                        Status = "pending",
                        TransactionId = referenceId,
                        Amount = 0
                    };
                }

                // Call Sepay API to check transaction status
                var apiUrl = $"{_sepayApiUrl}/transactions?reference_id={referenceId}";
                _logger.LogInformation($"📡 Calling Sepay API: {apiUrl}");

                var request = new HttpRequestMessage(HttpMethod.Get, apiUrl);
                request.Headers.Add("Authorization", $"Bearer {_sepayApiKey}");

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"✅ Sepay API response: {content}");

                    var result = JsonSerializer.Deserialize<SepayTransactionResponse>(content);

                    if (result?.transactions?.Any() == true)
                    {
                        var transaction = result.transactions.First();
                        return new PaymentStatusResponse
                        {
                            Status = "success",
                            TransactionId = referenceId,
                            Amount = transaction.amount,
                            PaidAmount = transaction.amount,
                            PaidAt = transaction.transaction_date,
                            BankTransactionId = transaction.transaction_id
                        };
                    }
                }
                else
                {
                    _logger.LogWarning($"⚠️ Sepay API returned status: {response.StatusCode}");
                }

                return new PaymentStatusResponse
                {
                    Status = "pending",
                    TransactionId = referenceId,
                    Amount = 0
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "❌ HTTP Error checking VietQR status");
                return new PaymentStatusResponse
                {
                    Status = "pending",
                    TransactionId = referenceId,
                    Amount = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error checking VietQR status");
                return new PaymentStatusResponse
                {
                    Status = "pending",
                    TransactionId = referenceId,
                    Amount = 0
                };
            }
        }
        #endregion
        public bool VerifyWebhookSignature(dynamic request)
        {
            return true;
        }

        #endregion

        #region PayPal Implementation

        public async Task<PayPalOrderResponse> CreatePayPalOrderAsync(PayPalRequest request)
        {
            try
            {
                // Get PayPal access token
                var accessToken = await GetPayPalAccessToken();

                // Create order
                var orderRequest = new
                {
                    intent = "CAPTURE",
                    purchase_units = new[]
                    {
                        new
                        {
                            reference_id = $"INV{request.InvoiceId}",
                            description = request.Description,
                            amount = new
                            {
                                currency_code = request.Currency,
                                value = request.Amount.ToString("F2")
                            }
                        }
                    },
                    application_context = new
                    {
                        return_url = _configuration["Payment:PayPal:ReturnUrl"],
                        cancel_url = _configuration["Payment:PayPal:CancelUrl"],
                        brand_name = "Restaurant Management",
                        landing_page = "BILLING",
                        user_action = "PAY_NOW"
                    }
                };

                var requestMessage = new HttpRequestMessage(HttpMethod.Post,
                    $"{_paypalApiUrl}/v2/checkout/orders");
                requestMessage.Headers.Add("Authorization", $"Bearer {accessToken}");
                requestMessage.Content = new StringContent(
                    JsonSerializer.Serialize(orderRequest),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.SendAsync(requestMessage);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<PayPalOrderCreateResponse>(content);
                    var approvalUrl = result?.links?.FirstOrDefault(l => l.rel == "approve")?.href;

                    return new PayPalOrderResponse
                    {
                        OrderId = result?.id,
                        ApprovalUrl = approvalUrl,
                        Amount = request.Amount,
                        Currency = request.Currency,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(30)
                    };
                }

                throw new Exception($"PayPal API error: {content}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayPal order");
                throw;
            }
        }

        public async Task<PayPalCaptureResponse> CapturePayPalOrderAsync(string orderId)
        {
            try
            {
                var accessToken = await GetPayPalAccessToken();

                var request = new HttpRequestMessage(HttpMethod.Post,
                    $"{_paypalApiUrl}/v2/checkout/orders/{orderId}/capture");
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<PayPalCaptureResult>(content);
                    var capture = result?.purchase_units?[0]?.payments?.captures?[0];

                    return new PayPalCaptureResponse
                    {
                        Status = "completed",
                        TransactionId = capture?.id,
                        Amount = decimal.Parse(capture?.amount?.value ?? "0"),
                        Currency = capture?.amount?.currency_code,
                        PaidAt = DateTime.Parse(capture?.create_time ?? DateTime.UtcNow.ToString()),
                        PayerEmail = result?.payer?.email_address,
                        PayerName = $"{result?.payer?.name?.given_name} {result?.payer?.name?.surname}"
                    };
                }

                throw new Exception($"PayPal capture error: {content}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error capturing PayPal order");
                throw;
            }
        }

        public async Task<PayPalStatusResponse> GetPayPalOrderStatusAsync(string orderId)
        {
            try
            {
                var accessToken = await GetPayPalAccessToken();

                var request = new HttpRequestMessage(HttpMethod.Get,
                    $"{_paypalApiUrl}/v2/checkout/orders/{orderId}");
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<PayPalOrderStatusResult>(content);

                    return new PayPalStatusResponse
                    {
                        Status = result?.status?.ToLower(),
                        OrderId = result?.id,
                        Amount = decimal.Parse(result?.purchase_units?[0]?.payments?.captures?[0]?.amount?.value ?? "0"),
                        Currency = result?.purchase_units?[0]?.payments?.captures?[0]?.amount?.currency_code
                    };
                }

                throw new Exception($"PayPal status error: {content}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PayPal order status");
                throw;
            }
        }

        public async Task ProcessPayPalWebhookAsync(dynamic request)
        {
            // Process PayPal webhook events
            _logger.LogInformation($"Processing PayPal webhook: {request.EventType}");
            await Task.CompletedTask;
        }

        public async Task<bool> VerifyPayPalWebhookAsync(dynamic request, IHeaderDictionary headers)
        {
            try
            {
                var accessToken = await GetPayPalAccessToken();

                var verifyRequest = new
                {
                    transmission_id = headers["PAYPAL-TRANSMISSION-ID"].ToString(),
                    transmission_time = headers["PAYPAL-TRANSMISSION-TIME"].ToString(),
                    cert_url = headers["PAYPAL-CERT-URL"].ToString(),
                    auth_algo = headers["PAYPAL-AUTH-ALGO"].ToString(),
                    transmission_sig = headers["PAYPAL-TRANSMISSION-SIG"].ToString(),
                    webhook_id = _paypalWebhookId,
                    webhook_event = request
                };

                var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    $"{_paypalApiUrl}/v1/notifications/verify-webhook-signature");
                httpRequest.Headers.Add("Authorization", $"Bearer {accessToken}");
                httpRequest.Content = new StringContent(
                    JsonSerializer.Serialize(verifyRequest),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.SendAsync(httpRequest);
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PayPalWebhookVerifyResult>(content);

                return result?.verification_status == "SUCCESS";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying PayPal webhook");
                return false;
            }
        }

        private async Task<string> GetPayPalAccessToken()
        {
            try
            {
                var auth = Convert.ToBase64String(
                    Encoding.UTF8.GetBytes($"{_paypalClientId}:{_paypalClientSecret}"));

                var request = new HttpRequestMessage(HttpMethod.Post,
                    $"{_paypalApiUrl}/v1/oauth2/token");
                request.Headers.Add("Authorization", $"Basic {auth}");
                request.Content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials")
                });

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PayPalTokenResponse>(content);

                return result?.access_token;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PayPal access token");
                throw;
            }
        }

        #endregion

        #region Helper Classes

        private class SepayTransactionResponse
        {
            public List<SepayTransaction> transactions { get; set; }
        }

        private class SepayTransaction
        {
            public string transaction_id { get; set; }
            public decimal amount { get; set; }
            public DateTime transaction_date { get; set; }
        }

        private class PayPalTokenResponse
        {
            public string access_token { get; set; }
        }

        private class PayPalOrderCreateResponse
        {
            public string id { get; set; }
            public List<PayPalLink> links { get; set; }
        }

        private class PayPalLink
        {
            public string href { get; set; }
            public string rel { get; set; }
        }

        private class PayPalCaptureResult
        {
            public List<PayPalPurchaseUnit> purchase_units { get; set; }
            public PayPalPayer payer { get; set; }
        }

        private class PayPalPurchaseUnit
        {
            public PayPalPayments payments { get; set; }
        }

        private class PayPalPayments
        {
            public List<PayPalCapture> captures { get; set; }
        }

        private class PayPalCapture
        {
            public string id { get; set; }
            public PayPalAmount amount { get; set; }
            public string create_time { get; set; }
        }

        private class PayPalAmount
        {
            public string currency_code { get; set; }
            public string value { get; set; }
        }

        private class PayPalPayer
        {
            public string email_address { get; set; }
            public PayPalName name { get; set; }
        }

        private class PayPalName
        {
            public string given_name { get; set; }
            public string surname { get; set; }
        }

        private class PayPalOrderStatusResult
        {
            public string id { get; set; }
            public string status { get; set; }
            public List<PayPalPurchaseUnit> purchase_units { get; set; }
        }

        private class PayPalWebhookVerifyResult
        {
            public string verification_status { get; set; }
        }

        #endregion
    }
}