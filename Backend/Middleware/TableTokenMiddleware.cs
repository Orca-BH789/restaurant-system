using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace Restaurant_Management.Middleware
{
    /// <summary>
    /// Middleware để validate JWT token cho customer order
    /// ✅ FIXED: Thêm ClockSkew để cho phép sai lệch thời gian
    /// </summary>
    public class TableTokenMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _jwtkey;
        private readonly IConfiguration _configuration;

        public TableTokenMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
            _jwtkey = Environment.GetEnvironmentVariable("JWT_KEY") ?? _configuration["JWT_KEY"] ?? "";
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Chỉ validate token cho các endpoint customer order
            var path = context.Request.Path.Value;

            if (path != null && (
                path.Contains("/api/OrderDetails") ||
                path.Contains("/api/Kitchen/table")))
            {
                var token = context.Request.Headers["Authorization"]
                    .FirstOrDefault()?.Split(" ").Last();

                if (!string.IsNullOrEmpty(token))
                {
                    try
                    {
                        var tokenHandler = new JwtSecurityTokenHandler();
                        var key = Encoding.UTF8.GetBytes(_jwtkey ?? "");

                        if (string.IsNullOrEmpty(_jwtkey))
                        {
                            Console.WriteLine("❌ JWT Key is missing in configuration!");
                            context.Response.StatusCode = 500;
                            await context.Response.WriteAsync("Server configuration error");
                            return;
                        }

                        // ✅ FIX: Thêm ClockSkew 5 phút để tránh lỗi do chênh lệch thời gian
                        tokenHandler.ValidateToken(token, new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = new SymmetricSecurityKey(key),
                            ValidateIssuer = true,
                            ValidateAudience = true,
                            ValidIssuer = _configuration["Jwt:Issuer"],
                            ValidAudience = _configuration["Jwt:Audience"],
                            ValidateLifetime = true,
                            ClockSkew = TimeSpan.FromMinutes(5), 

                            // ✅ Map claim names
                            RoleClaimType = "role",
                            NameClaimType = "sub"
                        }, out SecurityToken validatedToken);

                        var jwtToken = (JwtSecurityToken)validatedToken;

                        // ✅ Lấy claims
                        var orderIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "orderId")?.Value;
                        var tableIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "tableId")?.Value;

                        if (string.IsNullOrEmpty(orderIdClaim) || string.IsNullOrEmpty(tableIdClaim))
                        {
                            Console.WriteLine("❌ Token missing required claims (orderId or tableId)");
                            context.Response.StatusCode = 401;
                            await context.Response.WriteAsync("Invalid token claims");
                            return;
                        }

                        // ✅ Lưu vào HttpContext để controller sử dụng
                        context.Items["OrderId"] = int.Parse(orderIdClaim);
                        context.Items["TableId"] = int.Parse(tableIdClaim);

                        Console.WriteLine($"✅ Token validated - Order: {orderIdClaim}, Table: {tableIdClaim}");
                    }
                    catch (SecurityTokenExpiredException ex)
                    {
                        Console.WriteLine($"❌ Token expired: {ex.Message}");
                        context.Response.StatusCode = 401;
                        context.Response.Headers.Add("Token-Expired", "true");
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Token đã hết hạn. Vui lòng quét lại mã QR.",
                            error = "token_expired"
                        });
                        return;
                    }
                    catch (SecurityTokenInvalidSignatureException ex)
                    {
                        Console.WriteLine($"❌ Invalid token signature: {ex.Message}");
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Token không hợp lệ.",
                            error = "invalid_signature"
                        });
                        return;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Token validation failed: {ex.Message}");
                        context.Response.StatusCode = 401;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Token không hợp lệ. Vui lòng quét lại mã QR.",
                            error = "invalid_token"
                        });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}