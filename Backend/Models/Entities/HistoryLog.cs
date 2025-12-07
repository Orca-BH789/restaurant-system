namespace Restaurant_Management.Models.Entities
{
    public class HistoryLog
    {
        public int Id { get; set; }
        public string Entity { get; set; } = "";
        public int EntityId { get; set; }
        public string Action { get; set; } = "";
        public string? OldData { get; set; }
        public string? NewData { get; set; }
        public string? Description { get; set; }
        public int? UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
