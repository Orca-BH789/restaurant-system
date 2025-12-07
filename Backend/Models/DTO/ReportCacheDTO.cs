namespace Restaurant_Management.Models.DTO
{
    public class ReportCacheDTO
    {
        public int Id { get; set; }
        public string ReportType { get; set; } = "";
        public DateOnly ReportDate { get; set; }
        public string DataJson { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateReportCacheDTO
    {
        public string ReportType { get; set; } = "";
        public DateOnly ReportDate { get; set; }
        public string DataJson { get; set; } = "";
    }

}
