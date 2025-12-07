using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.DTO.Auth
{

    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username là bắt buộc")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password là bắt buộc")]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime AccessTokenExpiration { get; set; }
        public string Message { get; set; } = "Đăng nhập thành công";      
    }  

    public class RefreshTokenResponseDto
    {
        public string Message { get; set; } = "Token đã được làm mới";
        public DateTime AccessTokenExpiration { get; set; }
    }

    public class ForgotPasswordDTO
    {
        [Required(ErrorMessage = "Vui lòng nhập email")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDTO
    {
        [Required(ErrorMessage = "Thiếu thông tin Email")]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thiếu mã xác thực (Token)")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; } = string.Empty;

        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class LogoutResponseDto
    {
        public string Message { get; set; } = "Đăng xuất thành công";
    }
}
