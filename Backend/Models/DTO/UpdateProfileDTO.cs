using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.Models.DTO
{
    /// <summary>
    /// DTO ?? user c?p nh?t thông tin profile cá nhân
    /// </summary>
    public class UpdateProfileDTO
    {
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên ph?i t? 2-100 ký t?")]
        public string? FullName { get; set; }

        [EmailAddress(ErrorMessage = "Email không h?p l?")]
        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(15, ErrorMessage = "S? ?i?n tho?i không h?p l?")]
        [Phone(ErrorMessage = "S? ?i?n tho?i không h?p l?")]
        public string? Phone { get; set; }
    }
}
