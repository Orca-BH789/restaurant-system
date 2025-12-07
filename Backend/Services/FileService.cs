using Microsoft.AspNetCore.Hosting;

namespace RestaurantManagement.Services
{
    public class FileService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
               
        public FileService(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<string?> SaveBase64ImageAsync(string base64String, string fileName)
        {
            try
            {
                if (base64String.Contains(","))
                {
                    base64String = base64String.Split(',')[1];
                }

             
                byte[] imageBytes = Convert.FromBase64String(base64String);

              
                string extension = Path.GetExtension(fileName);
                string uniqueFileName = $"{Guid.NewGuid()}{extension}";

               
                string uploadFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "menu-items");
                                
                if (!Directory.Exists(uploadFolder))
                {
                    Directory.CreateDirectory(uploadFolder);
                }

                string filePath = Path.Combine(uploadFolder, uniqueFileName);
                                
                await File.WriteAllBytesAsync(filePath, imageBytes);

                return $"/uploads/menu-items/{uniqueFileName}";
            }
            catch (FormatException)
            {     
                Console.WriteLine("❌ Invalid base64 string format");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error saving image: {ex.Message}");
                return null;
            }
        }
  
        public void DeleteImage(string? imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return;

            try
            {
                // imageUrl có dạng: /uploads/menu-items/abc123.jpg
                // Cần convert thành đường dẫn vật lý: C:\...\wwwroot\uploads\menu-items\abc123.jpg
                string filePath = Path.Combine(
                    _webHostEnvironment.WebRootPath,
                    imageUrl.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString())
                );

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    Console.WriteLine($"✅ Deleted image: {filePath}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error deleting image: {ex.Message}");
            }
        }

        public bool IsValidImageExtension(string fileName)
        {
            string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            string extension = Path.GetExtension(fileName).ToLowerInvariant();
            return allowedExtensions.Contains(extension);
        }
    }
}