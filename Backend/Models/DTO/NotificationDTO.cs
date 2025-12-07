namespace Restaurant_Management.Models.DTO
{
    public class NotificationDTO
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
        public DateTime CreatedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public class CreateNotificationDTO
    {
        public string Type { get; set; } = "";
        public string TargetRole { get; set; } = "";
        public int? TableId { get; set; }
        public int? OrderId { get; set; }
        public int? ReferenceId { get; set; }
        public string? Title { get; set; }
        public string Message { get; set; } = "";
        public string? Payload { get; set; }
    }

}
