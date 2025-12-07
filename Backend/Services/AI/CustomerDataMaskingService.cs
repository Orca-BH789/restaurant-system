using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Services.AI
{
    /// <summary>
    /// Service ?? che d?u thông tin khách hàng nh?y c?m
    /// Cho phép AI phân tích d? li?u kinh doanh mà không ti?p c?n thông tin cá nhân
    /// </summary>
    public interface ICustomerDataMaskingService
    {
        /// <summary>
        /// Che d?u thông tin khách hàng trong Order
        /// </summary>
        Order MaskOrderCustomerInfo(Order order);

        /// <summary>
        /// Che d?u thông tin khách hàng trong danh sách Orders
        /// </summary>
        List<Order> MaskOrdersCustomerInfo(List<Order> orders);

        /// <summary>
        /// Che d?u thông tin khách hàng trong Invoice
        /// </summary>
        Invoice MaskInvoiceCustomerInfo(Invoice invoice);

        /// <summary>
        /// Che d?u thông tin khách hàng trong danh sách Invoices
        /// </summary>
        List<Invoice> MaskInvoicesCustomerInfo(List<Invoice> invoices);

        /// <summary>
        /// Che d?u m?t s? ?i?n tho?i
        /// Vd: 0987654321 => 098***321
        /// </summary>
        string MaskPhoneNumber(string phone);

        /// <summary>
        /// Che d?u m?t tên
        /// Vd: Nguy?n V?n A => Nguy?n V****
        /// </summary>
        string MaskCustomerName(string name);
    }

    public class CustomerDataMaskingService : ICustomerDataMaskingService
    {
        /// <summary>
        /// Che d?u thông tin khách hàng trong m?t Order
        /// </summary>
        public Order MaskOrderCustomerInfo(Order order)
        {
            if (order == null) return null;

            var maskedOrder = new Order
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                StaffId = order.StaffId,
                Staff = order.Staff,
                CustomerId = order.CustomerId,
                Customer = order.Customer,
                NumberOfGuests = order.NumberOfGuests,
                SubTotal = order.SubTotal,
                DiscountAmount = order.DiscountAmount,
                TaxAmount = order.TaxAmount,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                OrderType = order.OrderType,
                Notes = order.Notes,
                OrderTime = order.OrderTime,
                ServedTime = order.ServedTime,
                CompletedTime = order.CompletedTime,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                AppliedPromotionId = order.AppliedPromotionId,
                AppliedPromotion = order.AppliedPromotion,
                OrderDetails = order.OrderDetails,
                Invoices = order.Invoices?.Select(i => MaskInvoiceCustomerInfo(i)).ToList(),
                OrderTables = order.OrderTables
            };

            return maskedOrder;
        }

        /// <summary>
        /// Che d?u thông tin khách hàng trong danh sách Orders
        /// </summary>
        public List<Order> MaskOrdersCustomerInfo(List<Order> orders)
        {
            if (orders == null || orders.Count == 0) return orders;
            return orders.Select(MaskOrderCustomerInfo).ToList();
        }

        /// <summary>
        /// Che d?u thông tin khách hàng trong m?t Invoice
        /// </summary>
        public Invoice MaskInvoiceCustomerInfo(Invoice invoice)
        {
            if (invoice == null) return null;

            var maskedInvoice = new Invoice
            {
                Id = invoice.Id,
                OrderId = invoice.OrderId,
                Order = invoice.Order != null ? MaskOrderCustomerInfo(invoice.Order) : null,
                Amount = invoice.Amount,
                PromotionDiscount = invoice.PromotionDiscount,
                PromotionCode = invoice.PromotionCode,
                PromotionId = invoice.PromotionId,
                PaymentMethod = invoice.PaymentMethod,
                Status = invoice.Status,
                ReceivedAmount = invoice.ReceivedAmount,
                ChangeAmount = invoice.ChangeAmount,
                TransactionId = invoice.TransactionId,
                PaymentTime = invoice.PaymentTime,
                CreatedBy = invoice.CreatedBy,
                CreatedByUser = invoice.CreatedByUser,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt,
                UpdatedAt = invoice.UpdatedAt,
                Promotion = invoice.Promotion,
                PromotionUsages = invoice.PromotionUsages
            };

            return maskedInvoice;
        }

        /// <summary>
        /// Che d?u thông tin khách hàng trong danh sách Invoices
        /// </summary>
        public List<Invoice> MaskInvoicesCustomerInfo(List<Invoice> invoices)
        {
            if (invoices == null || invoices.Count == 0) return invoices;
            return invoices.Select(MaskInvoiceCustomerInfo).ToList();
        }

        /// <summary>
        /// Che d?u s? ?i?n tho?i
        /// Vd: 0987654321 => 098***321
        /// </summary>
        public string MaskPhoneNumber(string phone)
        {
            if (string.IsNullOrEmpty(phone))
                return "xxxx";

            if (phone.Length < 6)
                return "xxxx";

            // Gi? l?i 3 s? ??u và 3 s? cu?i
            var start = phone.Substring(0, 3);
            var end = phone.Substring(phone.Length - 3);
            return $"{start}***{end}";
        }

        /// <summary>
        /// Che d?u tên khách hàng
        /// Vd: Nguy?n V?n A => Nguy?n V****
        /// </summary>
        public string MaskCustomerName(string name)
        {
            if (string.IsNullOrEmpty(name))
                return "xxxx";

            var parts = name.Trim().Split(' ');
            if (parts.Length == 0)
                return "xxxx";

            // Gi? l?i ph?n h? ??u tiên, che d?u ph?n còn l?i
            if (parts.Length == 1)
                return $"{parts[0][0]}****";

            var lastName = parts[parts.Length - 1];
            var firstLetter = lastName[0].ToString();
            return $"{parts[0]} {firstLetter}****";
        }
    }
}
