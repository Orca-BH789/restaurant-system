namespace Restaurant_Management.Models.DTO
{
    public class TableDTO
    {
        public int Id { get; set; }

        public int TableNumber { get; set; }

        public string? TableName { get; set; }

        public int Capacity { get; set; }

        public string? Location { get; set; }

        public string Status { get; set; } = "Available"; // Available, Occupied, Reserved

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }
        
        public string? QrCodeUrl { get; set; }
    }

   
    public class TableUpdateDto
    {
        public int? Id { get; set; } 
        public int TableNumber { get; set; }
        public string? TableName { get; set; }
        public int Capacity { get; set; }
        public string? Location { get; set; }
        public string Status { get; set; } = "Available";
        public bool IsActive { get; set; } = true;
        
        public string? QrImageFile { get; set; }
        public string? FileName { get; set; }
    }
    public class MergeTablesDto
    {
        public List<int> TableIds { get; set; } = new();
    }
}
