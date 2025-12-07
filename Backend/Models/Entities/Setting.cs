using System.ComponentModel.DataAnnotations;

namespace Restaurant_Management.Models.Entities
{
    public class Setting
    {
        public int Id { get; set; }

        [Required]
        public string Key { get; set; }= string.Empty;

        public string? Value { get; set; }

        public string? Description { get; set; }

        public DateTime UpdatedAt { get; set; }

    }
}
