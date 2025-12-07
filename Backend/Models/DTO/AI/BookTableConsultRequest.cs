namespace Restaurant_Management.Models.DTO.AI
{
    /// <summary>
    /// Request DTO cho endpoint t? v?n ??t bàn v?i AI
    /// Khách hàng s? d?ng endpoint này ?? ???c AI t? v?n v? vi?c ??t bàn
    /// </summary>
    public class BookTableConsultRequest
    {
        /// <summary>
        /// S? l??ng khách (1-20 ng??i)
        /// </summary>
        public int NumberOfGuests { get; set; }

        /// <summary>
        /// Th?i gian ??t bàn mong mu?n (m?c ??nh là 1 gi? t?i)
        /// </summary>
        public DateTime? ReservationTime { get; set; }

        /// <summary>
        /// Yêu c?u ??c bi?t (ví d?: "C?n ch? yên t?nh", "G?n c?a s?", v.v.)
        /// </summary>
        public string? SpecialRequests { get; set; }

        /// <summary>
        /// S? thích danh m?c menu (l?c menu items theo danh m?c, có th? null)
        /// </summary>
        public int? CategoryPreference { get; set; }

        /// <summary>
        /// Tin nh?n t? khách hàng g?i cho AI
        /// </summary>
        public string UserMessage { get; set; }

        /// <summary>
        /// ID session n?u khách ti?p t?c conversation (có th? null)
        /// </summary>
        public string? SessionId { get; set; }
    }
}
