using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Restaurant_Management.Data;
using Restaurant_Management.Models.DTO;
using Restaurant_Management.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Restaurant_Management.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryLogsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public HistoryLogsController(RestaurantDbContext context)
        {
            _context = context;
        }
        #region CURD

        // GET: api/HistoryLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoryLog>>> GetHistoryLogs()
        {
            var logs = await _context.HistoryLogs
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(logs);
        }

        // GET: api/HistoryLogs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<HistoryLog>> GetHistoryLog(int id)
        {
            var historyLog = await _context.HistoryLogs.FindAsync(id);

            if (historyLog == null)
            {
                return NotFound();
            }

            return historyLog;
        }

        // PUT: api/HistoryLogs/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutHistoryLog(int id, HistoryLog historyLog)
        {
            if (id != historyLog.Id)
            {
                return BadRequest();
            }

            _context.Entry(historyLog).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HistoryLogExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/HistoryLogs
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754

        //[HttpPost]
        //public async Task<ActionResult<HistoryLog>> PostHistoryLog(HistoryLog historyLog)
        //{
        //    _context.HistoryLogs.Add(historyLog);
        //    await _context.SaveChangesAsync();

        //    return CreatedAtAction("GetHistoryLog", new { id = historyLog.Id }, historyLog);
        //}

        // DELETE: api/HistoryLogs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHistoryLog(int id)
        {
            var historyLog = await _context.HistoryLogs.FindAsync(id);
            if (historyLog == null)
            {
                return NotFound();
            }

            _context.HistoryLogs.Remove(historyLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool HistoryLogExists(int id)
        {
            return _context.HistoryLogs.Any(e => e.Id == id);
        }

        #endregion       

        [HttpPost]
        public async Task<IActionResult> Create(CreateHistoryLogDTO dto)
        {
            var log = new HistoryLog
            {
                Entity = dto.Entity,
                EntityId = dto.EntityId,
                Action = dto.Action,
                OldData = dto.OldData,
                NewData = dto.NewData,
                Description = dto.Description,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.HistoryLogs.Add(log);
            await _context.SaveChangesAsync();

            return Ok(log);
        }

    }
}
