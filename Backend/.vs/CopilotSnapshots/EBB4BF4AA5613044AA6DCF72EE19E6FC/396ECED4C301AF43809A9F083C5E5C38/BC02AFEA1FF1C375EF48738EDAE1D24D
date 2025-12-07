using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using Restaurant_Management.Services.Email;

namespace Restaurant_Management.Services.Reservation
{
    public class ReservationService : IReservationService
    {
        private readonly RestaurantDbContext _context;
        private readonly ILogger<ReservationService> _logger;
        private readonly IEmailService _emailService;

        public ReservationService(
            RestaurantDbContext context,
            ILogger<ReservationService> logger,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        #region CREATE & UPDATE

        public async Task<CreateReservationResponseDTO> CreateReservationAsync(CreateReservationDTO dto, int? userId = null)
        {
            try
            {
                // Step 1: Check công suất 50%
                var capacity = await GetCurrentCapacityPercentAsync();
                if (capacity >= 0.5)
                {
                    return new CreateReservationResponseDTO
                    {
                        Success = false,
                        Message = $"Nhà hàng đang quá tải ({Math.Round(capacity * 100, 2)}% công suất). Vui lòng đặt bàn sau.",
                        Data = null
                    };
                }

                // Step 2: Gợi ý bàn phù hợp
                var suggestedTables = await SuggestTablesAsync(
                    dto.NumberOfGuests,
                    dto.ReservationTime,
                    dto.PreferredArea);

                if (!suggestedTables.Any())
                {
                    return new CreateReservationResponseDTO
                    {
                        Success = false,
                        Message = "Không có bàn khả dụng trong khung giờ này. Vui lòng chọn thời gian khác.",
                        Data = null
                    };
                }

                // Step 3: Tạo hoặc lấy Customer
                int? customerId = null;
                if (dto.CustomerId.HasValue)
                {
                    customerId = dto.CustomerId.Value;
                }
                else if (!string.IsNullOrEmpty(dto.CustomerPhone))
                {
                    // Tìm customer theo phone
                    var existingCustomer = await _context.Customer
                        .FirstOrDefaultAsync(c => c.Phone == dto.CustomerPhone);

                    if (existingCustomer != null)
                    {
                        customerId = existingCustomer.Id;
                    }
                    else if (!string.IsNullOrEmpty(dto.CustomerName))
                    {
                        // Tạo customer mới
                        var newCustomer = new Customer
                        {
                            FullName = dto.CustomerName,
                            Phone = dto.CustomerPhone,
                            Email = dto.CustomerEmail,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        _context.Customer.Add(newCustomer);
                        await _context.SaveChangesAsync();
                        customerId = newCustomer.Id;
                    }
                }

                // Step 4: Tạo Reservation (sử dụng Transaction)
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var reservation = new Models.Entities.Reservation
                    {
                        ReservationNumber = await GenerateReservationNumberAsync(),
                        CustomerId = customerId,
                        NumberOfGuests = dto.NumberOfGuests,
                        ReservationTime = dto.ReservationTime,
                        Status = "Pending",
                        Notes = dto.Notes,
                        PreferredArea = dto.PreferredArea,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Reservations.Add(reservation);
                    await _context.SaveChangesAsync();

                    // Step 5: Tạo ReservationTable (link các bàn)
                    int sortOrder = 1;
                    foreach (var table in suggestedTables)
                    {
                        _context.ReservationTables.Add(new ReservationTable
                        {
                            ReservationId = reservation.Id,
                            TableId = table.TableId,
                            SortOrder = sortOrder++
                        });
                    }
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    _logger.LogInformation($"Created reservation {reservation.ReservationNumber} for customer {customerId}");

                    // Load lại để lấy navigation properties
                    var createdReservation = await _context.Reservations
                        .Include(r => r.User)
                        .Include(r => r.Customer)
                        .Include(r => r.ReservationTables)
                            .ThenInclude(rt => rt.Table)
                        .FirstOrDefaultAsync(r => r.Id == reservation.Id);

                    return new CreateReservationResponseDTO
                    {
                        Success = true,
                        Message = "Đặt bàn thành công! Vui lòng đến đúng giờ.",
                        Data = MapToDetailDTO(createdReservation!, suggestedTables)
                    };
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error in transaction when creating reservation");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reservation");
                throw;
            }
        }

        public async Task<bool> ConfirmReservationAsync(int reservationId, int userId)
        {
            var reservation = await _context.Reservations
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
            {
                throw new InvalidOperationException("Không tìm thấy đặt bàn");
            }

            if (reservation.Status != "Pending")
            {
                throw new InvalidOperationException($"Không thể xác nhận đặt bàn ở trạng thái {reservation.Status}");
            }

            if (reservation.ReservationTime < DateTime.Now)
            {
                throw new InvalidOperationException("Thời gian đặt bàn đã qua");
            }

            reservation.Status = "Confirmed";
            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Confirmed reservation {reservation.ReservationNumber}");

            // Gửi email xác nhận nếu có email
            if (reservation.Customer != null && !string.IsNullOrEmpty(reservation.Customer.Email))
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        reservation.Customer.Email,
                        "Xác nhận đặt bàn - Nhà hàng Việt Thái",
                        $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Xác nhận đặt bàn - Nhà hàng Việt Thái</title>
</head>
<body style=""margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;"">
    <table role=""presentation"" style=""width: 100%; border-collapse: collapse; background-color: #f5f5f5;"">
        <tr>
            <td style=""padding: 20px 0;"">
                <table role=""presentation"" style=""width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"">
                    
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;"">
                            <h1 style=""margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;"">
                                Nhà hàng Việt Thái
                            </h1>
                            <p style=""margin: 10px 0 0 0; color: #f0f0f0; font-size: 14px;"">
                                Authentic Vietnamese & Thai Cuisine
                            </p>
                        </td>
                    </tr>

                    <!-- Success Icon -->
                    <tr>
                        <td style=""padding: 30px 30px 20px; text-align: center;"">
                            <div style=""width: 80px; height: 80px; margin: 0 auto; background-color: #4CAF50; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;"">
                                <span style=""color: #ffffff; font-size: 48px; line-height: 80px;"">✓</span>
                            </div>
                            <h2 style=""margin: 20px 0 10px; color: #333333; font-size: 24px; font-weight: 600;"">
                                Đặt bàn thành công!
                            </h2>
                            <p style=""margin: 0; color: #666666; font-size: 15px;"">
                                Cảm ơn Quý khách đã tin tưởng và lựa chọn dịch vụ của chúng tôi
                            </p>
                        </td>
                    </tr>

                    <!-- Customer Name -->
                    <tr>
                        <td style=""padding: 0 30px 20px;"">
                            <p style=""margin: 0; color: #333333; font-size: 16px;"">
                                Kính gửi: <strong style=""color: #667eea;"">Quý khách {reservation.Customer.FullName}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Reservation Details -->
                    <tr>
                        <td style=""padding: 0 30px 30px;"">
                            <table role=""presentation"" style=""width: 100%; border-collapse: collapse; background-color: #f9f9f9; border-radius: 8px; overflow: hidden;"">
                                <tr>
                                    <td style=""padding: 20px;"">
                                        <h3 style=""margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600; border-bottom: 2px solid #667eea; padding-bottom: 10px;"">
                                            Thông tin đặt bàn
                                        </h3>
                                        
                                        <!-- Reservation Number -->
                                        <table role=""presentation"" style=""width: 100%; margin-bottom: 12px;"">
                                            <tr>
                                                <td style=""padding: 8px 0; color: #666666; font-size: 14px; width: 40%;"">
                                                    📋 Mã đặt bàn:
                                                </td>
                                                <td style=""padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;"">
                                                    {reservation.ReservationNumber}
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Number of Guests -->
                                        <table role=""presentation"" style=""width: 100%; margin-bottom: 12px;"">
                                            <tr>
                                                <td style=""padding: 8px 0; color: #666666; font-size: 14px; width: 40%;"">
                                                    👥 Số khách:
                                                </td>
                                                <td style=""padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;"">
                                                    {reservation.NumberOfGuests} người
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Reservation Time -->
                                        <table role=""presentation"" style=""width: 100%; margin-bottom: 12px;"">
                                            <tr>
                                                <td style=""padding: 8px 0; color: #666666; font-size: 14px; width: 40%;"">
                                                    🕐 Thời gian:
                                                </td>
                                                <td style=""padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;"">
                                                    {reservation.ReservationTime:dd/MM/yyyy} lúc {reservation.ReservationTime:HH:mm}
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Preferred Area -->
                                        <table role=""presentation"" style=""width: 100%;"">
                                            <tr>
                                                <td style=""padding: 8px 0; color: #666666; font-size: 14px; width: 40%;"">
                                                    📍 Khu vực:
                                                </td>
                                                <td style=""padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600;"">
                                                    {(string.IsNullOrEmpty(reservation.PreferredArea) ? "Theo sắp xếp" : reservation.PreferredArea)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Important Notice -->
                    <tr>
                        <td style=""padding: 0 30px 20px;"">
                            <div style=""background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;"">
                                <p style=""margin: 0; color: #856404; font-size: 14px; line-height: 1.6;"">
                                    <strong>⚠️ Lưu ý quan trọng:</strong><br>
                                    Vui lòng đến đúng giờ để được phục vụ tốt nhất. Nếu Quý khách đến muộn quá 15 phút, bàn có thể được sắp xếp cho khách khác.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Contact Information -->
                    <tr>
                        <td style=""padding: 0 30px 30px;"">
                            <div style=""background-color: #e8f4f8; border-radius: 8px; padding: 20px; text-align: center;"">
                                <p style=""margin: 0 0 10px 0; color: #333333; font-size: 15px; font-weight: 600;"">
                                    Cần hỗ trợ hoặc thay đổi đặt bàn?
                                </p>
                                <p style=""margin: 0; color: #666666; font-size: 14px;"">
                                    📞 Hotline: <a href=""tel:0123456789"" style=""color: #667eea; text-decoration: none; font-weight: 600;"">0123 456 789</a>
                                </p>
                                <p style=""margin: 5px 0 0 0; color: #666666; font-size: 14px;"">
                                    ✉️ Email: <a href=""mailto:info@vietthairestaurant.vn"" style=""color: #667eea; text-decoration: none;"">info@vietthairestaurant.vn</a>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;"">
                            <p style=""margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;"">
                                Nhà hàng Việt Thái
                            </p>
                            <p style=""margin: 0 0 5px 0; color: #666666; font-size: 13px;"">
                                📍 123 Đường ABC, Quận 1, TP. Hồ Chí Minh
                            </p>
                            <p style=""margin: 0 0 15px 0; color: #666666; font-size: 13px;"">
                                🕐 Giờ mở cửa: 10:00 - 22:00 (Thứ 2 - Chủ Nhật)
                            </p>
                            
                            <p style=""margin: 15px 0 0 0; color: #999999; font-size: 12px;"">
                                Trân trọng cảm ơn và hẹn gặp lại Quý khách!<br>
                                © 2024 Nhà hàng Việt Thái. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send confirmation email");
                }
            }

            return true;
        }

        public async Task<int> ArriveReservationAsync(int reservationId, int staffId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.ReservationTables)
                        .ThenInclude(rt => rt.Table)
                    .FirstOrDefaultAsync(r => r.Id == reservationId);

                if (reservation == null)
                {
                    throw new InvalidOperationException("Không tìm thấy đặt bàn");
                }

                if (reservation.Status != "Confirmed")
                {
                    throw new InvalidOperationException($"Chỉ có thể xác nhận đến cho đặt bàn đã Confirmed. Trạng thái hiện tại: {reservation.Status}");
                }

                // Step 1: Tạo Order mới
                var order = new Order
                {
                    OrderNumber = await GenerateOrderNumberAsync(),
                    StaffId = staffId,
                    CustomerId = reservation.CustomerId,
                    NumberOfGuests = reservation.NumberOfGuests,
                    OrderType = "DineIn",
                    Status = "Ordered",
                    OrderTime = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Step 2: Link các bàn từ Reservation sang Order
                foreach (var resTable in reservation.ReservationTables)
                {
                    _context.OrderTables.Add(new OrderTable
                    {
                        OrderId = order.Id,
                        TableId = resTable.TableId
                    });

                    // Cập nhật status bàn
                    var table = await _context.Tables.FindAsync(resTable.TableId);
                    if (table != null)
                    {
                        table.Status = "Occupied";                     
                    }
                }

                // Step 3: Cập nhật Reservation
                reservation.Status = "Arrived";
                reservation.OrderId = order.Id;
                reservation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Reservation {reservation.ReservationNumber} arrived. Created Order {order.OrderNumber}");

                return order.Id;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error processing arrival for reservation {reservationId}");
                throw;
            }
        }

        public async Task<bool> CancelReservationAsync(int reservationId, int userId, string? cancelReason = null)
        {
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
            {
                throw new InvalidOperationException("Không tìm thấy đặt bàn");
            }

            if (reservation.Status == "Cancelled")
            {
                throw new InvalidOperationException("Đặt bàn đã bị hủy trước đó");
            }

            if (reservation.Status == "Arrived")
            {
                throw new InvalidOperationException("Không thể hủy đặt bàn khi khách đã đến");
            }

            // Check quyền hủy cho customer
            var isStaff = await IsStaffOrAdminAsync(userId);
            if (!isStaff)
            {
                var timeUntilReservation = reservation.ReservationTime - DateTime.UtcNow;
                if (timeUntilReservation.TotalMinutes < 30)
                {
                    throw new InvalidOperationException("Khách hàng chỉ có thể hủy đặt bàn trước ít nhất 30 phút");
                }
            }

            reservation.Status = "Cancelled";
            reservation.CancelReason = cancelReason;
            reservation.CancelledAt = DateTime.UtcNow;
            reservation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Cancelled reservation {reservation.ReservationNumber}. Reason: {cancelReason}");

            return true;
        }

        #endregion

        #region QUERY & READ

        public async Task<ReservationDetailDTO?> GetReservationByIdAsync(int reservationId)
        {
            var reservation = await _context.Reservations
                .Include(r => r.User)
                .Include(r => r.Customer)
                .Include(r => r.Order)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
                return null;

            var tables = reservation.ReservationTables
                .OrderBy(rt => rt.SortOrder)
                .Select(rt => new TableSuggestionDTO
                {
                    TableId = rt.TableId,
                    TableName = rt.Table.TableName,
                    Capacity = rt.Table.Capacity,
                    Location = rt.Table.Location ?? ""
                }).ToList();

            return MapToDetailDTO(reservation, tables);
        }

        public async Task<ReservationDetailDTO?> GetReservationByNumberAsync(string reservationNumber)
        {
            var reservation = await _context.Reservations
                .Include(r => r.User)
                .Include(r => r.Customer)
                .Include(r => r.Order)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .FirstOrDefaultAsync(r => r.ReservationNumber == reservationNumber);

            if (reservation == null)
                return null;

            var tables = reservation.ReservationTables
                .OrderBy(rt => rt.SortOrder)
                .Select(rt => new TableSuggestionDTO
                {
                    TableId = rt.TableId,
                    TableName = rt.Table.TableName,
                    Capacity = rt.Table.Capacity,
                    Location = rt.Table.Location ?? ""
                }).ToList();

            return MapToDetailDTO(reservation, tables);
        }

        public async Task<PagedReservationResponseDTO> GetReservationsAsync(ReservationQueryDTO query)
        {
            var queryable = _context.Reservations
                .Include(r => r.User)
                .Include(r => r.Customer)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .AsQueryable();

            // Apply filters
            if (query.FromDate.HasValue)
            {
                queryable = queryable.Where(r => r.ReservationTime >= query.FromDate.Value);
            }

            if (query.ToDate.HasValue)
            {
                queryable = queryable.Where(r => r.ReservationTime <= query.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(query.Status) && query.Status != "ALL")
            {
                queryable = queryable.Where(r => r.Status == query.Status);
            }

            // Search by customer name (from Customer entity)
            if (!string.IsNullOrEmpty(query.CustomerName))
            {
                queryable = queryable.Where(r => r.Customer != null && r.Customer.FullName.Contains(query.CustomerName));
            }

            // Search by customer phone (from Customer entity)
            if (!string.IsNullOrEmpty(query.CustomerPhone))
            {
                queryable = queryable.Where(r => r.Customer != null && r.Customer.Phone.Contains(query.CustomerPhone));
            }

            // Count total
            var totalCount = await queryable.CountAsync();

            // Apply sorting
            queryable = query.SortBy switch
            {
                "CreatedAt" => query.IsDescending
                    ? queryable.OrderByDescending(r => r.CreatedAt)
                    : queryable.OrderBy(r => r.CreatedAt),
                _ => query.IsDescending
                    ? queryable.OrderByDescending(r => r.ReservationTime)
                    : queryable.OrderBy(r => r.ReservationTime)
            };

            // Apply pagination
            var reservations = await queryable
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var data = reservations.Select(MapToListDTO).ToList();

            return new PagedReservationResponseDTO
            {
                Data = data,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };
        }

        public async Task<List<ReservationListDTO>> GetCustomerReservationsAsync(string customerPhone)
        {
            var reservations = await _context.Reservations
                .Include(r => r.Customer)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .Where(r => r.Customer != null && r.Customer.Phone == customerPhone)
                .OrderByDescending(r => r.ReservationTime)
                .ToListAsync();

            return reservations.Select(MapToListDTO).ToList();
        }

        public async Task<ReservationDashboardDTO> GetDashboardAsync(DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);

            var reservations = await _context.Reservations
                .Include(r => r.Customer)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .Where(r => r.ReservationTime >= startOfDay && r.ReservationTime < endOfDay)
                .ToListAsync();

            var now = DateTime.Now;
            var oneHourLater = now.AddHours(1);

            return new ReservationDashboardDTO
            {
                Date = date,
                TotalReservations = reservations.Count,
                PendingCount = reservations.Count(r => r.Status == "Pending"),
                ConfirmedCount = reservations.Count(r => r.Status == "Confirmed"),
                ArrivedCount = reservations.Count(r => r.Status == "Arrived"),
                CancelledCount = reservations.Count(r => r.Status == "Cancelled"),
                CurrentCapacityPercent = await GetCurrentCapacityPercentAsync(),
                UpcomingReservations = reservations
                    .Where(r => r.Status == "Confirmed" &&
                               r.ReservationTime >= now &&
                               r.ReservationTime <= oneHourLater)
                    .Select(MapToListDTO)
                    .ToList(),
                OverdueReservations = reservations
                    .Where(r => r.Status == "Confirmed" &&
                               r.ReservationTime < now.AddMinutes(-15))
                    .Select(MapToListDTO)
                    .ToList()
            };
        }

        public async Task<ReservationTimelineDTO> GetTimelineAsync(DateTime date)
        {
            var startOfDay = date.Date.AddHours(10); // 10:00
            var endOfDay = date.Date.AddHours(22);   // 22:00

            var reservations = await _context.Reservations
                .Include(r => r.Customer)
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.Table)
                .Where(r => r.ReservationTime >= startOfDay &&
                           r.ReservationTime < endOfDay &&
                           r.Status != "Cancelled")
                .ToListAsync();

            var allTables = await _context.Tables
                .Where(t => t.Status != "Unavailable")
                .OrderBy(t => t.TableNumber)
                .ToListAsync();

            var timeSlots = new List<TimeSlotDTO>();

            // Tạo time slots theo giờ (10:00, 11:00, ..., 21:00)
            for (int hour = 10; hour <= 21; hour++)
            {
                var slotStart = date.Date.AddHours(hour);
                var slotEnd = slotStart.AddHours(1);

                var tableReservations = new List<TableReservationDTO>();

                foreach (var table in allTables)
                {
                    var reservation = reservations
                        .FirstOrDefault(r => r.ReservationTime >= slotStart &&
                                           r.ReservationTime < slotEnd &&
                                           r.ReservationTables.Any(rt => rt.TableId == table.Id));

                    tableReservations.Add(new TableReservationDTO
                    {
                        TableId = table.Id,
                        TableName = table.TableName,
                        ReservationId = reservation?.Id,
                        ReservationNumber = reservation?.ReservationNumber,
                        CustomerName = reservation?.Customer?.FullName ?? "",
                        Status = reservation != null ? reservation.Status : "Available"
                    });
                }

                timeSlots.Add(new TimeSlotDTO
                {
                    StartTime = slotStart,
                    EndTime = slotEnd,
                    TableReservations = tableReservations
                });
            }

            return new ReservationTimelineDTO
            {
                Date = date,
                TimeSlots = timeSlots
            };
        }

        #endregion

        #region TABLE MANAGEMENT

        public async Task<List<TableSuggestionDTO>> SuggestTablesAsync(int numberOfGuests, DateTime reservationTime, string? preferredArea = null)
        {
            var bufferStart = reservationTime.AddHours(-1);
            var bufferEnd = reservationTime.AddHours(1);

            // Lấy các bàn đã được đặt trong khung buffer
            var bookedTableIds = await _context.ReservationTables
                .Include(rt => rt.Reservation)
                .Where(rt => rt.Reservation.Status != "Cancelled" &&
                            rt.Reservation.ReservationTime >= bufferStart &&
                            rt.Reservation.ReservationTime <= bufferEnd)
                .Select(rt => rt.TableId)
                .Distinct()
                .ToListAsync();

            // Lấy các bàn available
            var availableTablesQuery = _context.Tables
                .Where(t => t.Status == "Available" && !bookedTableIds.Contains(t.Id));

            // Filter theo area nếu có
            if (!string.IsNullOrEmpty(preferredArea))
            {
                availableTablesQuery = availableTablesQuery.Where(t => t.Location == preferredArea);
            }

            var availableTables = await availableTablesQuery
                .OrderBy(t => t.Capacity)
                .ToListAsync();

            // Strategy 1: Tìm 1 bàn vừa đủ (capacity >= guests && capacity <= guests + 2)
            var perfectTable = availableTables
                .FirstOrDefault(t => t.Capacity >= numberOfGuests && t.Capacity <= numberOfGuests + 2);

            if (perfectTable != null)
            {
                return new List<TableSuggestionDTO>
                {
                    new TableSuggestionDTO
                    {
                        TableId = perfectTable.Id,
                        TableName = perfectTable.TableName,
                        Capacity = perfectTable.Capacity,
                        Location = perfectTable.Location ?? ""
                    }
                };
            }

            // Strategy 2: Tìm tổ hợp 2-3 bàn
            var combination = FindTableCombination(availableTables, numberOfGuests);
            if (combination.Any())
            {
                return combination.Select(t => new TableSuggestionDTO
                {
                    TableId = t.Id,
                    TableName = t.TableName,
                    Capacity = t.Capacity,
                    Location = t.Location ?? ""
                }).ToList();
            }

            // Strategy 3: Lấy bàn lớn nhất available
            var largestTable = availableTables
                .OrderByDescending(t => t.Capacity)
                .FirstOrDefault();

            if (largestTable != null && largestTable.Capacity >= numberOfGuests * 0.7)
            {
                return new List<TableSuggestionDTO>
                {
                    new TableSuggestionDTO
                    {
                        TableId = largestTable.Id,
                        TableName = largestTable.TableName,
                        Capacity = largestTable.Capacity,
                        Location = largestTable.Location ?? ""
                    }
                };
            }

            return new List<TableSuggestionDTO>();
        }

        public async Task<bool> IsTableAvailableAsync(int tableId, DateTime reservationTime)
        {
            var bufferStart = reservationTime.AddHours(-1);
            var bufferEnd = reservationTime.AddHours(1);

            var isBooked = await _context.ReservationTables
                .Include(rt => rt.Reservation)
                .AnyAsync(rt => rt.TableId == tableId &&
                               rt.Reservation.Status != "Cancelled" &&
                               rt.Reservation.ReservationTime >= bufferStart &&
                               rt.Reservation.ReservationTime <= bufferEnd);

            return !isBooked;
        }

        public async Task<double> GetCurrentCapacityPercentAsync()
        {
            var now = DateTime.Now;
            var currentHourStart = new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0);
            var currentHourEnd = currentHourStart.AddHours(1);

            // Tổng số bàn available
            var totalTables = await _context.Tables
                .CountAsync(t => t.Status != "Unavailable");

            if (totalTables == 0)
                return 0;

            // Số bàn đã được đặt trong giờ hiện tại
            var bookedTablesCount = await _context.ReservationTables
                .Include(rt => rt.Reservation)
                .Where(rt => rt.Reservation.Status != "Cancelled" &&
                            rt.Reservation.ReservationTime >= currentHourStart &&
                            rt.Reservation.ReservationTime < currentHourEnd)
                .Select(rt => rt.TableId)
                .Distinct()
                .CountAsync();

            return (double)bookedTablesCount / totalTables;
        }

        #endregion

        #region BACKGROUND JOBS

        public async Task CancelOverdueReservationsAsync()
        {
            var fifteenMinutesAgo = DateTime.UtcNow.AddMinutes(-15);

            var overdueReservations = await _context.Reservations
                .Where(r => r.Status == "Confirmed" &&
                           r.ReservationTime < fifteenMinutesAgo)
                .ToListAsync();

            foreach (var reservation in overdueReservations)
            {
                reservation.Status = "Cancelled";
                reservation.CancelReason = "Tự động hủy: Quá 15 phút chưa đến";
                reservation.CancelledAt = DateTime.UtcNow;
                reservation.UpdatedAt = DateTime.UtcNow;

                _logger.LogInformation($"Auto-cancelled overdue reservation {reservation.ReservationNumber}");
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Auto-cancelled {overdueReservations.Count} overdue reservations");
        }

        public async Task SendReminderEmailsAsync()
        {
            var now = DateTime.UtcNow;
            var oneHourLater = now.AddHours(1);
            var oneHourAndTenMinutesLater = now.AddHours(1).AddMinutes(10);

            var upcomingReservations = await _context.Reservations
                .Include(r => r.Customer)
                .Where(r => r.Status == "Confirmed" &&
                           r.ReservationTime >= oneHourLater &&
                           r.ReservationTime <= oneHourAndTenMinutesLater &&
                           r.Customer != null &&
                           !string.IsNullOrEmpty(r.Customer.Email))
                .ToListAsync();

            foreach (var reservation in upcomingReservations)
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        reservation.Customer!.Email!,
                        "Nhắc nhở đặt bàn",
                        $"Xin chào {reservation.Customer.FullName},\n\n" +
                        $"Đây là lời nhắc về đặt bàn {reservation.ReservationNumber} của bạn.\n" +
                        $"Thời gian: {reservation.ReservationTime:dd/MM/yyyy HH:mm}\n" +
                        $"Số lượng khách: {reservation.NumberOfGuests}\n\n" +
                        $"Chúng tôi mong được phục vụ bạn!"
                    );

                    _logger.LogInformation($"Sent reminder email to {reservation.Customer.Email} for reservation {reservation.ReservationNumber}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to send reminder email for reservation {reservation.ReservationNumber}");
                }
            }

            _logger.LogInformation($"Processed {upcomingReservations.Count} reminder emails");
        }

        #endregion

        #region VALIDATION

        public bool ValidateReservationTime(DateTime reservationTime)
        {
            // Phải >= Now + 30 phút
            var minTime = DateTime.UtcNow.AddMinutes(30);
            if (reservationTime < minTime)
                return false;

            // Trong khung giờ 10:00 - 22:00
            var hour = reservationTime.Hour;
            if (hour < 10 || hour > 22)
                return false;

            return true;
        }

        public async Task<bool> CanCustomerCancelAsync(int reservationId, string customerPhone)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
                return false;

            // Check ownership - compare with customer phone
            if (reservation.Customer == null || reservation.Customer.Phone != customerPhone)
                return false;

            // Check status
            if (reservation.Status != "Pending" && reservation.Status != "Confirmed")
                return false;

            // Check time (>= 30 phút)
            var timeUntilReservation = reservation.ReservationTime - DateTime.Now;
            if (timeUntilReservation.TotalMinutes < 30)
                return false;

            return true;
        }

        #endregion

        #region HELPER METHODS

        private async Task<string> GenerateReservationNumberAsync()
        {
            var date = DateTime.Now.ToString("yyMMdd");
            var count = await _context.Reservations
                .CountAsync(r => r.ReservationNumber.StartsWith($"RSV{date}"));
            return $"RSV{date}{(count + 1):D3}";
        }

        private async Task<string> GenerateOrderNumberAsync()
        {
            var date = DateTime.Now.ToString("yyMMdd");
            var count = await _context.Orders
                .CountAsync(o => o.OrderNumber.StartsWith($"ORD{date}"));
            return $"ORD{date}{(count + 1):D3}";
        }

        private List<Table> FindTableCombination(List<Table> tables, int numberOfGuests)
        {
            // Thử 2 bàn
            for (int i = 0; i < tables.Count; i++)
            {
                for (int j = i + 1; j < tables.Count; j++)
                {
                    if (tables[i].Capacity + tables[j].Capacity >= numberOfGuests)
                    {
                        return new List<Table> { tables[i], tables[j] };
                    }
                }
            }

            // Thử 3 bàn
            for (int i = 0; i < tables.Count; i++)
            {
                for (int j = i + 1; j < tables.Count; j++)
                {
                    for (int k = j + 1; k < tables.Count; k++)
                    {
                        if (tables[i].Capacity + tables[j].Capacity + tables[k].Capacity >= numberOfGuests)
                        {
                            return new List<Table> { tables[i], tables[j], tables[k] };
                        }
                    }
                }
            }

            return new List<Table>();
        }

        private async Task<bool> IsStaffOrAdminAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            return user.Role.ToString() == "Staff" ||
                   user.Role.ToString() == "Admin" ||
                   user.Role.ToString() == "Manager";
        }

        private ReservationDetailDTO MapToDetailDTO(Models.Entities.Reservation reservation, List<TableSuggestionDTO> tables)
        {
            return new ReservationDetailDTO
            {
                Id = reservation.Id,
                ReservationNumber = reservation.ReservationNumber,
                CustomerId = reservation.CustomerId,
                CustomerName = reservation.Customer?.FullName ?? "",
                CustomerPhone = reservation.Customer?.Phone ?? "",
                CustomerEmail = reservation.Customer?.Email,
                NumberOfGuests = reservation.NumberOfGuests,
                ReservationTime = reservation.ReservationTime,
                Status = reservation.Status,
                Notes = reservation.Notes,
                PreferredArea = reservation.PreferredArea,
                SuggestedTables = tables,
                CreatedBy = reservation.CreatedBy,
                CreatedByName = reservation.User?.FullName,
                CreatedAt = reservation.CreatedAt,
                UpdatedAt = reservation.UpdatedAt,
                OrderId = reservation.OrderId,
                OrderNumber = reservation.Order?.OrderNumber
            };
        }

        private ReservationListDTO MapToListDTO(Models.Entities.Reservation reservation)
        {
            return new ReservationListDTO
            {
                Id = reservation.Id,
                ReservationNumber = reservation.ReservationNumber,
                CustomerName = reservation.Customer?.FullName ?? "",
                CustomerPhone = reservation.Customer?.Phone ?? "",
                NumberOfGuests = reservation.NumberOfGuests,
                ReservationTime = reservation.ReservationTime,
                Status = reservation.Status,
                TableCount = reservation.ReservationTables?.Count ?? 0,
                TableNames = reservation.ReservationTables != null
                    ? string.Join(", ", reservation.ReservationTables
                        .OrderBy(rt => rt.SortOrder)
                        .Select(rt => rt.Table?.TableName ?? ""))
                    : "",
                CreatedAt = reservation.CreatedAt
            };
        }

        #endregion
    }
}