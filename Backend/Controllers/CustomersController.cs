using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;

namespace Restaurant_Management.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly RestaurantDbContext _context;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(RestaurantDbContext context, ILogger<CustomersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ============================================
        // ?? GET: L?y danh sách customers (with pagination & filter)
        // ============================================
        /// <summary>
        /// GET: L?y danh sách khách hàng v?i filter, search, pagination
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedCustomerResponseDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PagedCustomerResponseDTO>> GetCustomers(
            [FromQuery] string? searchTerm,
            [FromQuery] string? sortBy = "Id",
            [FromQuery] bool isDescending = false,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] bool? hasOrders = null)
        {
            try
            {
                // Validate pagination
                if (pageNumber < 1 || pageSize < 1 || pageSize > 100)
                    return BadRequest(new { message = "PageNumber ph?i >= 1, PageSize ph?i t? 1-100" });

                // Build query
                var query = _context.Customer
                    .Include(c => c.Orders)
                    .Include(c => c.Reservations)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(c =>
                        c.FullName.Contains(searchTerm) ||
                        c.Phone.Contains(searchTerm) ||
                        c.Email.Contains(searchTerm));
                }

                // Date filter
                if (fromDate.HasValue)
                    query = query.Where(c => c.CreatedAt >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(c => c.CreatedAt <= toDate.Value);

                // Has orders filter
                if (hasOrders.HasValue)
                {
                    if (hasOrders.Value)
                        query = query.Where(c => c.Orders.Any());
                    else
                        query = query.Where(c => !c.Orders.Any());
                }

                // Count before pagination
                var totalCount = await query.CountAsync();

                // Sort
                var validSortFields = new[] { "Id", "FullName", "Phone", "Email", "CreatedAt", "UpdatedAt" };
                if (!validSortFields.Contains(sortBy))
                    sortBy = "Id";

                if (isDescending)
                {
                    query = sortBy switch
                    {
                        "FullName" => query.OrderByDescending(c => c.FullName),
                        "Phone" => query.OrderByDescending(c => c.Phone),
                        "Email" => query.OrderByDescending(c => c.Email),
                        "CreatedAt" => query.OrderByDescending(c => c.CreatedAt),
                        "UpdatedAt" => query.OrderByDescending(c => c.UpdatedAt),
                        _ => query.OrderByDescending(c => c.Id)
                    };
                }
                else
                {
                    query = sortBy switch
                    {
                        "FullName" => query.OrderBy(c => c.FullName),
                        "Phone" => query.OrderBy(c => c.Phone),
                        "Email" => query.OrderBy(c => c.Email),
                        "CreatedAt" => query.OrderBy(c => c.CreatedAt),
                        "UpdatedAt" => query.OrderBy(c => c.UpdatedAt),
                        _ => query.OrderBy(c => c.Id)
                    };
                }

                // Pagination
                var customers = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Map to DTO
                var customerDTOs = customers.Select(MapToDTO).ToList();

                var response = new PagedCustomerResponseDTO
                {
                    Data = customerDTOs,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customers");
                return StatusCode(500, new { message = "L?i khi l?y danh sách khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET by ID: L?y customer chi ti?t
        // ============================================
        /// <summary>
        /// GET: L?y thông tin chi ti?t 1 khách hàng (kèm Orders & Reservations)
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(CustomerDetailDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDetailDTO>> GetCustomer(int id)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Orders)
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                var dto = MapToDetailDTO(customer);
                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting customer {id}");
                return StatusCode(500, new { message = "L?i khi l?y thông tin khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET by Phone: L?y customer theo s? ?i?n tho?i
        // ============================================
        /// <summary>
        /// GET: Tìm khách hàng theo s? ?i?n tho?i
        /// </summary>
        [AllowAnonymous]
        [HttpGet("phone/{phone}")]
        [ProducesResponseType(typeof(CustomerDetailDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDetailDTO>> GetCustomerByPhone(string phone)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Orders)
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Phone == phone);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i s? ?i?n tho?i = {phone}" });

                var dto = MapToDetailDTO(customer);
                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting customer by phone {phone}");
                return StatusCode(500, new { message = "L?i khi tìm khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET by Email: L?y customer theo email
        // ============================================
        /// <summary>
        /// GET: Tìm khách hàng theo email
        /// </summary>
        [HttpGet("email/{email}")]
        [ProducesResponseType(typeof(CustomerDetailDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDetailDTO>> GetCustomerByEmail(string email)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Orders)
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Email == email);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i email = {email}" });

                var dto = MapToDetailDTO(customer);
                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting customer by email {email}");
                return StatusCode(500, new { message = "L?i khi tìm khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? POST: T?o customer m?i
        // ============================================
        /// <summary>
        /// POST: T?o khách hàng m?i
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(CustomerDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CustomerDTO>> PostCustomer([FromBody] CreateCustomerDTO dto)
        {
            try
            {
                // Validate
                if (string.IsNullOrWhiteSpace(dto.FullName))
                    return BadRequest(new { message = "FullName không ???c ?? tr?ng" });

                if (dto.FullName.Length > 100)
                    return BadRequest(new { message = "FullName không ???c v??t quá 100 ký t?" });

                if (!string.IsNullOrEmpty(dto.Phone) && dto.Phone.Length > 15)
                    return BadRequest(new { message = "Phone không ???c v??t quá 15 ký t?" });

                if (!string.IsNullOrEmpty(dto.Email) && dto.Email.Length > 100)
                    return BadRequest(new { message = "Email không ???c v??t quá 100 ký t?" });

                // Check duplicate phone
                if (!string.IsNullOrEmpty(dto.Phone))
                {
                    var existingPhone = await _context.Customer
                        .AnyAsync(c => c.Phone == dto.Phone);
                    if (existingPhone)
                        return Conflict(new { message = $"Khách hàng v?i s? ?i?n tho?i '{dto.Phone}' ?ã t?n t?i" });
                }

                // Check duplicate email
                if (!string.IsNullOrEmpty(dto.Email))
                {
                    var existingEmail = await _context.Customer
                        .AnyAsync(c => c.Email == dto.Email);
                    if (existingEmail)
                        return Conflict(new { message = $"Khách hàng v?i email '{dto.Email}' ?ã t?n t?i" });
                }

                var customer = new Customer
                {
                    FullName = dto.FullName.Trim(),
                    Phone = string.IsNullOrEmpty(dto.Phone) ? null : dto.Phone.Trim(),
                    Email = string.IsNullOrEmpty(dto.Email) ? null : dto.Email.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Customer.Add(customer);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created new customer: {customer.Id} - {customer.FullName}");

                var responseDTO = MapToDTO(customer);
                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, responseDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer");
                return StatusCode(500, new { message = "L?i khi t?o khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? PUT: C?p nh?t customer
        // ============================================
        /// <summary>
        /// PUT: C?p nh?t thông tin khách hàng
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> PutCustomer(int id, [FromBody] UpdateCustomerDTO dto)
        {
            try
            {
                if (id != dto.Id)
                    return BadRequest(new { message = "Id trong URL không kh?p v?i d? li?u g?i lên" });

                // Validate
                if (string.IsNullOrWhiteSpace(dto.FullName))
                    return BadRequest(new { message = "FullName không ???c ?? tr?ng" });

                if (dto.FullName.Length > 100)
                    return BadRequest(new { message = "FullName không ???c v??t quá 100 ký t?" });

                if (!string.IsNullOrEmpty(dto.Phone) && dto.Phone.Length > 15)
                    return BadRequest(new { message = "Phone không ???c v??t quá 15 ký t?" });

                if (!string.IsNullOrEmpty(dto.Email) && dto.Email.Length > 100)
                    return BadRequest(new { message = "Email không ???c v??t quá 100 ký t?" });

                var customer = await _context.Customer.FindAsync(id);
                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                // Check duplicate phone (n?u phone thay ??i)
                if (!string.IsNullOrEmpty(dto.Phone) && dto.Phone != customer.Phone)
                {
                    var existingPhone = await _context.Customer
                        .AnyAsync(c => c.Phone == dto.Phone && c.Id != id);
                    if (existingPhone)
                        return Conflict(new { message = $"Khách hàng v?i s? ?i?n tho?i '{dto.Phone}' ?ã t?n t?i" });
                }

                // Check duplicate email (n?u email thay ??i)
                if (!string.IsNullOrEmpty(dto.Email) && dto.Email != customer.Email)
                {
                    var existingEmail = await _context.Customer
                        .AnyAsync(c => c.Email == dto.Email && c.Id != id);
                    if (existingEmail)
                        return Conflict(new { message = $"Khách hàng v?i email '{dto.Email}' ?ã t?n t?i" });
                }

                // Update
                customer.FullName = dto.FullName.Trim();
                customer.Phone = string.IsNullOrEmpty(dto.Phone) ? null : dto.Phone.Trim();
                customer.Email = string.IsNullOrEmpty(dto.Email) ? null : dto.Email.Trim();
                customer.UpdatedAt = DateTime.UtcNow;

                _context.Entry(customer).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Updated customer: {id} - {customer.FullName}");

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await CustomerExistsAsync(id))
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                _logger.LogError($"Concurrency error updating customer {id}");
                return StatusCode(500, new { message = "L?i concurrency, vui lòng th? l?i" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating customer {id}");
                return StatusCode(500, new { message = "L?i khi c?p nh?t khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? DELETE: Xóa customer
        // ============================================
        /// <summary>
        /// DELETE: Xóa khách hàng
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Orders)
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                // Check if customer has orders
                if (customer.Orders.Any())
                    return BadRequest(new { message = "Không th? xóa khách hàng có ??n hàng" });

                // Check if customer has reservations
                if (customer.Reservations.Any())
                    return BadRequest(new { message = "Không th? xóa khách hàng có l?ch ??t bàn" });

                _context.Customer.Remove(customer);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Deleted customer: {id}");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting customer {id}");
                return StatusCode(500, new { message = "L?i khi xóa khách hàng", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET: L?y orders c?a customer
        // ============================================
        /// <summary>
        /// GET: L?y danh sách orders c?a khách hàng
        /// </summary>
        [HttpGet("{id}/orders")]
        [ProducesResponseType(typeof(List<CustomerOrderDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<List<CustomerOrderDTO>>> GetCustomerOrders(int id)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Orders)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                var orders = customer.Orders
                    .OrderByDescending(o => o.OrderTime)
                    .Select(o => new CustomerOrderDTO
                    {
                        Id = o.Id,
                        OrderNumber = o.OrderNumber,
                        TotalAmount = o.TotalAmount,
                        Status = o.Status,
                        OrderTime = o.OrderTime
                    })
                    .ToList();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting orders for customer {id}");
                return StatusCode(500, new { message = "L?i khi l?y danh sách orders", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET: L?y reservations c?a customer
        // ============================================
        /// <summary>
        /// GET: L?y danh sách reservations c?a khách hàng
        /// </summary>
        [HttpGet("{id}/reservations")]
        [ProducesResponseType(typeof(List<CustomerReservationDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<List<CustomerReservationDTO>>> GetCustomerReservations(int id)
        {
            try
            {
                var customer = await _context.Customer
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                    return NotFound(new { message = $"Không tìm th?y khách hàng v?i Id = {id}" });

                var reservations = customer.Reservations
                    .OrderByDescending(r => r.ReservationTime)
                    .Select(r => new CustomerReservationDTO
                    {
                        Id = r.Id,
                        ReservationNumber = r.ReservationNumber,
                        ReservationTime = r.ReservationTime,
                        Status = r.Status,
                        NumberOfGuests = r.NumberOfGuests
                    })
                    .ToList();

                return Ok(reservations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting reservations for customer {id}");
                return StatusCode(500, new { message = "L?i khi l?y danh sách reservations", error = ex.Message });
            }
        }

        // ============================================
        // ?? GET: Th?ng kê customer
        // ============================================
        /// <summary>
        /// GET: L?y th?ng kê các khách hàng
        /// </summary>
        [HttpGet("statistics/overview")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> GetStatistics()
        {
            try
            {
                var totalCustomers = await _context.Customer.CountAsync();
                var customersWithOrders = await _context.Customer
                    .Where(c => c.Orders.Any())
                    .CountAsync();
                var customersWithReservations = await _context.Customer
                    .Where(c => c.Reservations.Any())
                    .CountAsync();
                var totalSpent = await _context.Orders
                    .SumAsync(o => o.TotalAmount);
                var recentCustomers = await _context.Customer
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(5)
                    .Select(c => new { c.Id, c.FullName, c.Phone, c.CreatedAt })
                    .ToListAsync();

                return Ok(new
                {
                    totalCustomers,
                    customersWithOrders,
                    customersWithReservations,
                    totalSpent = Math.Round(totalSpent, 2),
                    recentCustomers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return StatusCode(500, new { message = "L?i khi l?y th?ng kê", error = ex.Message });
            }
        }

        // ============================================
        // ?? Helper Methods
        // ============================================

        private CustomerDTO MapToDTO(Customer customer)
        {
            return new CustomerDTO
            {
                Id = customer.Id,
                FullName = customer.FullName,
                Phone = customer.Phone,
                Email = customer.Email,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt,
                TotalOrders = customer.Orders?.Count ?? 0,
                TotalReservations = customer.Reservations?.Count ?? 0,
                TotalSpent = customer.Orders?.Sum(o => o.TotalAmount) ?? 0
            };
        }

        private CustomerDetailDTO MapToDetailDTO(Customer customer)
        {
            return new CustomerDetailDTO
            {
                Id = customer.Id,
                FullName = customer.FullName,
                Phone = customer.Phone,
                Email = customer.Email,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt,
                TotalOrders = customer.Orders?.Count ?? 0,
                TotalReservations = customer.Reservations?.Count ?? 0,
                TotalSpent = customer.Orders?.Sum(o => o.TotalAmount) ?? 0,
                Orders = customer.Orders?.Select(o => new CustomerOrderDTO
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    OrderTime = o.OrderTime
                }).OrderByDescending(o => o.OrderTime).ToList() ?? new(),
                Reservations = customer.Reservations?.Select(r => new CustomerReservationDTO
                {
                    Id = r.Id,
                    ReservationNumber = r.ReservationNumber,
                    ReservationTime = r.ReservationTime,
                    Status = r.Status,
                    NumberOfGuests = r.NumberOfGuests
                }).OrderByDescending(r => r.ReservationTime).ToList() ?? new()
            };
        }

        private async Task<bool> CustomerExistsAsync(int id)
        {
            return await _context.Customer.AnyAsync(e => e.Id == id);
        }
    }
}
