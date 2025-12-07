using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using Restaurant_Management.Services.Reservation;
using System.Security.Claims;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _reservationService;
        private readonly ILogger<ReservationsController> _logger;
        private readonly RestaurantDbContext _context;

        public ReservationsController( IReservationService reservationService,  ILogger<ReservationsController> logger, RestaurantDbContext context )
        {
            _reservationService = reservationService;
            _logger = logger;
            _context = context;
        }

        #region PUBLIC/CUSTOMER APIs     
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDTO dto)
        {
            try
            {
                // Validate request
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "INVALID_INPUT",
                            Message = "Dữ liệu đầu vào không hợp lệ",
                            Details = ModelState
                        }
                    });
                }

                // Validate: CustomerId hoặc (CustomerName + CustomerPhone) phải có
                if (!dto.CustomerId.HasValue && (string.IsNullOrEmpty(dto.CustomerName) || string.IsNullOrEmpty(dto.CustomerPhone)))
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "MISSING_CUSTOMER_INFO",
                            Message = "Vui lòng cung cấp CustomerId hoặc cả CustomerName và CustomerPhone"
                        }
                    });
                }

                // Validate thời gian đặt bàn
                if (!_reservationService.ValidateReservationTime(dto.ReservationTime))
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "INVALID_RESERVATION_TIME",
                            Message = "Thời gian đặt bàn không hợp lệ. Vui lòng đặt trước ít nhất 30 phút và trong khung giờ 10:00 - 22:00."
                        }
                    });
                }

                int? userId = null;

                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var id))
                    {
                        userId = id; 
                    }
                }

                var result = await _reservationService.CreateReservationAsync(dto, userId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(
                    nameof(GetReservationById),
                    new { id = result.Data!.Id },
                    result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule violation when creating reservation");
                return BadRequest(new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "BUSINESS_RULE_VIOLATION",
                        Message = ex.Message
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating reservation");
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi tạo đặt bàn. Vui lòng thử lại sau."
                    }
                });
            }
        }

        /// <summary>
        /// [PUBLIC] Lấy thông tin đặt bàn theo ID
        /// GET /api/reservations/{id}
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReservationById(int id)
        {
            try
            {
                var reservation = await _reservationService.GetReservationByIdAsync(id);

                if (reservation == null)
                {
                    return NotFound(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "NOT_FOUND",
                            Message = "Không tìm thấy đặt bàn"
                        }
                    });
                }

                return Ok(new { success = true, data = reservation });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservation by id {Id}", id);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy thông tin đặt bàn"
                    }
                });
            }
        }

        /// <summary>
        /// [PUBLIC] Lấy thông tin đặt bàn theo mã số (ReservationNumber)
        /// GET /api/reservations/by-number/{reservationNumber}
        /// </summary>
        [HttpGet("by-number/{reservationNumber}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReservationByNumber(string reservationNumber)
        {
            try
            {
                var reservation = await _reservationService.GetReservationByNumberAsync(reservationNumber);

                if (reservation == null)
                {
                    return NotFound(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "NOT_FOUND",
                            Message = "Không tìm thấy đặt bàn với mã số này"
                        }
                    });
                }

                return Ok(new { success = true, data = reservation });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservation by number {Number}", reservationNumber);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy thông tin đặt bàn"
                    }
                });
            }
        }

        /// <summary>
        /// [PUBLIC] Lấy danh sách đặt bàn của khách hàng theo số điện thoại
        /// GET /api/reservations/my-reservations?phone=0901234567
        /// </summary>
        [HttpGet("my-reservations")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMyReservations([FromQuery] string phone)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(phone))
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "INVALID_PHONE",
                            Message = "Số điện thoại không hợp lệ"
                        }
                    });
                }

                var reservations = await _reservationService.GetCustomerReservationsAsync(phone);

                return Ok(new { success = true, data = reservations });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer reservations for phone {Phone}", phone);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy danh sách đặt bàn"
                    }
                });
            }
        }

        /// <summary>
        /// [PUBLIC] Xác nhận đặt bàn (Pending -> Confirmed)
        /// PUT /api/reservations/{id}/confirm
        /// </summary>
        [HttpPut("{id}/confirm")]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> ConfirmReservation(int id)
        {
            try
            {
                // Lấy userId nếu đã đăng nhập
                User? staff = null;
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(staffIdClaim))
                {
                    staff = await _context.Users.FirstOrDefaultAsync(s => s.Username == staffIdClaim);
                }
                int userId = staff != null ? staff.Id : 0;

                var success = await _reservationService.ConfirmReservationAsync(id, userId);

                if (!success)
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "CANNOT_CONFIRM",
                            Message = "Không thể xác nhận đặt bàn này"
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Xác nhận đặt bàn thành công. Email xác nhận đã được gửi."
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INVALID_OPERATION",
                        Message = ex.Message
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming reservation {Id}", id);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi xác nhận đặt bàn"
                    }
                });
            }
        }

        /// <summary>
        /// [PUBLIC] Hủy đặt bàn
        /// DELETE /api/reservations/{id}
        /// </summary>       
        [HttpDelete("{id}")]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> CancelReservation(int id, [FromBody] CancelReservationDTO? dto = null)
        {
            try
            {
                User? staff = null;
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(staffIdClaim))
                {
                    staff = await _context.Users.FirstOrDefaultAsync(s => s.Username == staffIdClaim);                    
                }
                int userId = staff != null ? staff.Id : 0;

                var success = await _reservationService.CancelReservationAsync(id, userId, dto?.CancelReason);

                if (!success)
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "CANNOT_CANCEL",
                            Message = "Không thể hủy đặt bàn này"
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã hủy đặt bàn thành công"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INVALID_OPERATION",
                        Message = ex.Message
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling reservation {Id}", id);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi hủy đặt bàn"
                    }
                });
            }
        }

        #endregion

        #region STAFF/ADMIN APIs

        [HttpGet]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> GetReservations([FromQuery] ReservationQueryDTO query)
        {
            try
            {
                var result = await _reservationService.GetReservationsAsync(query);

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reservations list");
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy danh sách đặt bàn"
                    }
                });
            }
        }
      
        [HttpPost("{id}/arrive")]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> ArriveReservation(int id)
        {
            try
            {
                User? staff = null;
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!string.IsNullOrEmpty(staffIdClaim))
                {
                    staff = await _context.Users.FirstOrDefaultAsync(s => s.Username == staffIdClaim);
                }
                int staffId = staff != null ? staff.Id : 0;

                var orderId = await _reservationService.ArriveReservationAsync(id, staffId);

                if (orderId == 0)
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "CANNOT_ARRIVE",
                            Message = "Không thể xác nhận khách đến cho đặt bàn này"
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Khách đã đến. Order đã được tạo tự động.",
                    data = new { orderId }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INVALID_OPERATION",
                        Message = ex.Message
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking reservation {Id} as arrived", id);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi xác nhận khách đến"
                    }
                });
            }
        }
      
        [HttpGet("dashboard")]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> GetDashboard([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var dashboard = await _reservationService.GetDashboardAsync(targetDate);

                return Ok(new { success = true, data = dashboard });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard for date {Date}", date);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy thông tin dashboard"
                    }
                });
            }
        }
   
        [HttpGet("timeline")]
        [Authorize(Roles = "Staff,Admin,Manager")]
        public async Task<IActionResult> GetTimeline([FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;
                var timeline = await _reservationService.GetTimelineAsync(targetDate);

                return Ok(new { success = true, data = timeline });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting timeline for date {Date}", date);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi lấy timeline"
                    }
                });
            }
        }

        #endregion

        #region UTILITY APIs

        /// <summary>
        /// [PUBLIC] Gợi ý bàn phù hợp
        /// GET /api/reservations/suggest-tables?guests=8&time=2024-11-26T19:00:00&area=Tầng 1
        /// </summary>
        [HttpGet("suggest-tables")]
        [AllowAnonymous]
        public async Task<IActionResult> SuggestTables([FromQuery] int numberOfGuests, [FromQuery] DateTime reservationTime, [FromQuery] string? preferredArea = null)
        {
            try
            {
                if (numberOfGuests < 1 || numberOfGuests > 20)
                {
                    return BadRequest(new ErrorResponseDTO
                    {
                        Error = new ErrorDetailDTO
                        {
                            Code = "INVALID_GUESTS",
                            Message = "Số lượng khách phải từ 1-20 người"
                        }
                    });
                }

                var tables = await _reservationService.SuggestTablesAsync(numberOfGuests, reservationTime, preferredArea);

                if (!tables.Any())
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Không có bàn khả dụng trong khung giờ này",
                        data = new List<TableSuggestionDTO>()
                    });
                }

                return Ok(new { success = true, data = tables });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error suggesting tables for {Guests} guests at {Time}", numberOfGuests, reservationTime);
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi gợi ý bàn"
                    }
                });
            }
        }

        /// <summary>    
        /// GET /api/reservations/capacity
        /// </summary>
        [HttpGet("capacity")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCurrentCapacity()
        {
            try
            {
                var capacity = await _reservationService.GetCurrentCapacityPercentAsync();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        capacityPercent = Math.Round(capacity * 100, 2),
                        isAvailable = capacity < 0.5,
                        message = capacity >= 0.5
                            ? "Nhà hàng đang quá tải"
                            : "Nhà hàng còn chỗ trống"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current capacity");
                return StatusCode(500, new ErrorResponseDTO
                {
                    Error = new ErrorDetailDTO
                    {
                        Code = "INTERNAL_ERROR",
                        Message = "Có lỗi xảy ra khi kiểm tra công suất"
                    }
                });
            }
        }

        #endregion
    }
}