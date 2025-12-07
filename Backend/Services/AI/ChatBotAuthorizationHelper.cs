using System.Security.Claims;

namespace Restaurant_Management.Services.AI
{
    /// <summary>
    /// Helper class ?? x? lý phân quy?n cho ChatBot Assistant
    /// ChatBot có quy?n truy c?p toàn di?n ??:
    /// - ??c t?t c? d? li?u (??n hàng, menu, th?ng kê, v.v.)
    /// - T?o báo cáo phân tích
    /// - L?u cache k?t qu?
    /// - Không thay ??i d? li?u giao d?ch
    /// </summary>
    public interface IChatBotAuthorizationHelper
    {
        /// <summary>
        /// Ki?m tra xem user có ph?i là ChatBot Assistant không
        /// </summary>
        bool IsChatBotAssistant(ClaimsPrincipal user);

        /// <summary>
        /// Ki?m tra xem user có quy?n truy c?p analytics không
        /// (ChatBot ho?c Admin/Manager)
        /// </summary>
        bool CanAccessAnalytics(ClaimsPrincipal user);

        /// <summary>
        /// Ki?m tra xem user có quy?n t?o báo cáo không
        /// </summary>
        bool CanGenerateReports(ClaimsPrincipal user);

        /// <summary>
        /// L?y role c?a user
        /// </summary>
        string? GetUserRole(ClaimsPrincipal user);

        /// <summary>
        /// L?y user ID
        /// </summary>
        int? GetUserId(ClaimsPrincipal user);
    }

    public class ChatBotAuthorizationHelper : IChatBotAuthorizationHelper
    {
        /// <summary>
        /// Ki?m tra xem user có ph?i là ChatBot Assistant không
        /// </summary>
        public bool IsChatBotAssistant(ClaimsPrincipal user)
        {
            var role = GetUserRole(user);
            return role == "ChatBot" || role == "4"; // UserRole.ChatBot = 4
        }

        /// <summary>
        /// ChatBot và Admin/Manager có th? truy c?p analytics
        /// </summary>
        public bool CanAccessAnalytics(ClaimsPrincipal user)
        {
            var role = GetUserRole(user);
            return role == "ChatBot" || role == "Admin" || role == "Manager" 
                || role == "4" || role == "1" || role == "2";
        }

        /// <summary>
        /// ChatBot và Admin có th? t?o báo cáo
        /// </summary>
        public bool CanGenerateReports(ClaimsPrincipal user)
        {
            var role = GetUserRole(user);
            return role == "ChatBot" || role == "Admin"
                || role == "4" || role == "1";
        }

        /// <summary>
        /// L?y role c?a user t? claims
        /// </summary>
        public string? GetUserRole(ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Role)?.Value;
        }

        /// <summary>
        /// L?y user ID t? claims
        /// </summary>
        public int? GetUserId(ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }
}
