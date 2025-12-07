namespace Restaurant_Management.Models.Entities
{
    public class ReportCache
    {
        public int Id { get; set; }
        public string ReportType { get; set; } = "";
        public DateOnly ReportDate { get; set; }
        public string DataJson { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
