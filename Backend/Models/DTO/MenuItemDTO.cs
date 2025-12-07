namespace Restaurant_Management.Models.DTO
{
    // Dùng khi GET (trả dữ liệu ra frontend)
    public class MenuItemDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public string? ImageUrl { get; set; }
        public string Unit { get; set; } = "Phần";
        public int PreparationTime { get; set; } = 15;
        public bool IsAvailable { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        public CategoryDTO? Category { get; set; }
    }

    // Dùng khi POST (tạo mới)
    public class MenuItemCreateDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public string? Unit { get; set; } = "Phần";
        public int PreparationTime { get; set; } = 15;
        public bool IsAvailable { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public string? ImageFile { get; set; } // base64 string
        public string? FileName { get; set; }
    }

    public class MenuItemUpdateDto
    {
        public string Name { get; set; } = "a";
        public string? Description { get; set; }
        public int CategoryId { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public string? Unit { get; set; }
        public int PreparationTime { get; set; }
        public int SortOrder { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsActive { get; set; }
        public string? ImageFile { get; set; } 
        public string? FileName { get; set; }   
    }
}
