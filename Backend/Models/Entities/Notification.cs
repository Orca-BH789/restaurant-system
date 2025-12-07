namespace Restaurant_Management.Models.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public string Type { get; set; } = "";
        public string TargetRole { get; set; } = "";
        public int? TableId { get; set; }
        public int? OrderId { get; set; }
        public int? ReferenceId { get; set; }
        public string? Title { get; set; }
        public string Message { get; set; } = "";
        public string? Payload { get; set; }
        public bool IsRead { get; set; }
        public int? ReadBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
    }


}
