using System.Text.RegularExpressions;

namespace Restaurant_Management.Services.AI
{
    /// <summary>
    /// Service format response t? AI thành output chuyên nghi?p
    /// </summary>
    public interface IResponseFormatterService
    {
        /// <summary>
        /// Format response xóa markdown, làm chuyên nghi?p h?n
        /// </summary>
        string FormatProfessionalResponse(string aiResponse);

        /// <summary>
        /// Format s? ti?n Vietnamese
        /// </summary>
        string FormatCurrency(decimal amount);

        /// <summary>
        /// Format ngày tháng Vietnamese
        /// </summary>
        string FormatDate(DateTime date);

        /// <summary>
        /// Format ph?n tr?m
        /// </summary>
        string FormatPercentage(decimal percentage);
    }

    public class ResponseFormatterService : IResponseFormatterService
    {
        /// <summary>
        /// Format response xóa markdown, làm chuyên nghi?p
        /// </summary>
        public string FormatProfessionalResponse(string aiResponse)
        {
            if (string.IsNullOrEmpty(aiResponse))
                return aiResponse;

            var formatted = aiResponse;

            // ? Xóa ** (bold markdown)
            formatted = Regex.Replace(formatted, @"\*\*(.+?)\*\*", "$1");

            // ? Xóa * (italic markdown)
            formatted = Regex.Replace(formatted, @"\*(.+?)\*", "$1");

            // ? Xóa __ (bold markdown alt)
            formatted = Regex.Replace(formatted, @"__(.+?)__", "$1");

            // ? Xóa _ (italic markdown alt)
            formatted = Regex.Replace(formatted, @"_(.+?)_", "$1");

            // ? Xóa # (heading markdown)
            formatted = Regex.Replace(formatted, @"^#+\s+", "", RegexOptions.Multiline);

            // ? Xóa emoji ?ôi khi không c?n
            // Gi? l?i emoji quan tr?ng (??, ??, ?, ??)
            // Xóa emoji khác
            formatted = RemoveUnnecessaryEmojis(formatted);

            // ? Thêm format chuyên nghi?p h?n
            formatted = EnhanceProfessionalFormatting(formatted);

            // ? Clean up extra spaces
            formatted = Regex.Replace(formatted, @"\n\s*\n", "\n");
            formatted = formatted.Trim();

            return formatted;
        }

        /// <summary>
        /// Xóa emoji không c?n thi?t
        /// </summary>
        private string RemoveUnnecessaryEmojis(string text)
        {
            // Emoji c?n gi? l?i
            var keepEmojis = new[] { "??", "??", "?", "??", "??", "??", "??", "???", "??", "??" };

            // Xóa t?t c? emoji tr? nh?ng cái trong keepEmojis
            var pattern = @"[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2000-\u206F]";
            text = Regex.Replace(text, pattern, match =>
            {
                return keepEmojis.Contains(match.Value) ? match.Value : "";
            });

            return text;
        }

        /// <summary>
        /// Enhance professional formatting
        /// </summary>
        private string EnhanceProfessionalFormatting(string text)
        {
            // Thêm d?u cách sau dòng tiêu ??
            text = Regex.Replace(text, @"^(.+?):\s*$", "$1:", RegexOptions.Multiline);

            // Format dòng danh sách chuyên nghi?p h?n
            // Thay th? "- " b?ng "• "
            text = Regex.Replace(text, @"^\s*-\s+", "• ", RegexOptions.Multiline);

            // Thêm t? chuyên nghi?p
            text = text
                .Replace("VN?", "VND")
                .Replace("vnd", "VND")
                .Replace("l??t", "giao d?ch");

            return text;
        }

        /// <summary>
        /// Format s? ti?n ki?u Vietnamese
        /// </summary>
        public string FormatCurrency(decimal amount)
        {
            return $"{amount:N0} VND";
        }

        /// <summary>
        /// Format ngày ki?u Vietnamese
        /// </summary>
        public string FormatDate(DateTime date)
        {
            return date.ToString("dd/MM/yyyy");
        }

        /// <summary>
        /// Format ph?n tr?m
        /// </summary>
        public string FormatPercentage(decimal percentage)
        {
            return $"{percentage:F2}%";
        }
    }
}
