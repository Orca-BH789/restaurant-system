using System.Security.Claims;

namespace Restaurant_Management.Services
{
    /// <summary>
    /// Service ki?m soát quy?n h?n truy c?p d? li?u theo role
    /// Ch?n Insert, Update, Delete trên các b?ng nh?y c?m
    /// </summary>
    public interface IDataAccessControlService
    {
        /// <summary>
        /// Ki?m tra quy?n th?c hi?n hành ??ng trên entity
        /// </summary>
        bool CanPerformAction(ClaimsPrincipal user, string entityType, string action);

        /// <summary>
        /// Ki?m tra và throw exception n?u không có quy?n
        /// </summary>
        void ValidateAction(ClaimsPrincipal user, string entityType, string action);

        /// <summary>
        /// L?y danh sách roles có quy?n v?i action
        /// </summary>
        List<string> GetAllowedRoles(string entityType, string action);
    }

    public class DataAccessControlService : IDataAccessControlService
    {
        // Dictionary ??nh ngh?a quy?n: [Entity][Action] = [AllowedRoles]
        private readonly Dictionary<string, Dictionary<string, List<string>>> _permissions = new()
        {
            // ? B?ng Order - Ch? Admin/Manager có quy?n, AI/Customer không
            ["Order"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff" },
                ["Read"] = new() { "Admin", "Manager", "Staff", "ChatBot" },
                ["Update"] = new() { "Admin", "Manager" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng Customer - Ch? Admin có quy?n
            ["Customer"] = new()
            {
                ["Create"] = new() { "Admin", "Staff" },
                ["Read"] = new() { "Admin", "Manager", "Staff" },
                ["Update"] = new() { "Admin" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng OrderDetail - Ch? Admin/Manager
            ["OrderDetail"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff" },
                ["Read"] = new() { "Admin", "Manager", "Staff", "ChatBot" },
                ["Update"] = new() { "Admin", "Manager" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng Invoice - Ch? Admin/Manager
            ["Invoice"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff" },
                ["Read"] = new() { "Admin", "Manager", "Staff", "ChatBot" },
                ["Update"] = new() { "Admin" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng Reservation - Ch? Admin/Manager/Staff
            ["Reservation"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff", "Customer" },
                ["Read"] = new() { "Admin", "Manager", "Staff", "ChatBot" },
                ["Update"] = new() { "Admin", "Manager", "Staff" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng OrderTable - Ch? Admin/Manager
            ["OrderTable"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff" },
                ["Read"] = new() { "Admin", "Manager", "Staff", "ChatBot" },
                ["Update"] = new() { "Admin", "Manager" },
                ["Delete"] = new() { "Admin" }
            },

            // ? B?ng RefreshToken - Ch? chính user ho?c Admin
            ["RefreshToken"] = new()
            {
                ["Create"] = new() { "Admin", "Manager", "Staff", "Customer", "ChatBot" },
                ["Read"] = new() { "Admin" },
                ["Update"] = new() { "Admin" },
                ["Delete"] = new() { "Admin", "Self" } // Self = user xóa token c?a chính mình
            }
        };

        public bool CanPerformAction(ClaimsPrincipal user, string entityType, string action)
        {
            if (user == null || !user.Identity?.IsAuthenticated == true)
                return false;

            // N?u entity không trong list ? allow (default)
            if (!_permissions.ContainsKey(entityType))
                return true;

            // N?u action không ??nh ngh?a ? deny (default secure)
            if (!_permissions[entityType].ContainsKey(action))
                return false;

            var userRole = user.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
            var allowedRoles = _permissions[entityType][action];

            return allowedRoles.Contains(userRole);
        }

        public void ValidateAction(ClaimsPrincipal user, string entityType, string action)
        {
            if (!CanPerformAction(user, entityType, action))
            {
                var userRole = user.FindFirst(ClaimTypes.Role)?.Value ?? "Unknown";
                var allowedRoles = GetAllowedRoles(entityType, action);
                
                throw new UnauthorizedAccessException(
                    $"B?n (role: {userRole}) không có quy?n {action} trên b?ng {entityType}. " +
                    $"Ch? {string.Join(", ", allowedRoles)} m?i có quy?n này."
                );
            }
        }

        public List<string> GetAllowedRoles(string entityType, string action)
        {
            if (_permissions.ContainsKey(entityType) && _permissions[entityType].ContainsKey(action))
                return _permissions[entityType][action];

            return new List<string>();
        }
    }
}
