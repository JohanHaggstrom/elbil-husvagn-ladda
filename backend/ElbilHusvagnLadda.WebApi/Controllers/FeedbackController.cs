using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using ElbilHusvagnLadda.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class FeedbackController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<FeedbackController> _logger;
    private readonly IEmailService _emailService;

    public FeedbackController(
        AppDbContext context,
        ILogger<FeedbackController> logger,
        IEmailService emailService
    )
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    /// <summary>
    /// Submit feedback - accessible to everyone
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<Feedback>> CreateFeedback(Feedback feedback)
    {
        try
        {
            feedback.CreatedAt = DateTime.UtcNow;
            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "New feedback created: {Type} - {Title}",
                feedback.Type,
                feedback.Title
            );
            return CreatedAtAction(nameof(GetFeedback), new { id = feedback.Id }, feedback);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating feedback");
            return StatusCode(500, "An error occurred while submitting feedback");
        }
    }

    /// <summary>
    /// Get all feedback - admin only
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllFeedback(
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null
    )
    {
        try
        {
            var query = _context.Feedbacks.OrderByDescending(f => f.CreatedAt);

            if (page is null && pageSize is null)
            {
                var all = await query.ToListAsync();
                return Ok(all);
            }

            var pageNumber = page is > 0 ? page.Value : 1;
            var size = pageSize is > 0 ? pageSize.Value : 20;
            if (size > 200)
            {
                size = 200;
            }

            var total = await query.CountAsync();
            var items = await query.Skip((pageNumber - 1) * size).Take(size).ToListAsync();

            return Ok(
                new PagedResult<Feedback>
                {
                    Items = items,
                    Total = total,
                    Page = pageNumber,
                    PageSize = size,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving feedback");
            return StatusCode(500, "An error occurred while retrieving feedback");
        }
    }

    /// <summary>
    /// Get single feedback by ID - admin only
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Feedback>> GetFeedback(int id)
    {
        try
        {
            var feedback = await _context.Feedbacks.FindAsync(id);

            if (feedback == null)
            {
                return NotFound();
            }

            return Ok(feedback);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving feedback {Id}", id);
            return StatusCode(500, "An error occurred while retrieving the feedback");
        }
    }

    /// <summary>
    /// Delete feedback - admin only
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFeedback(int id)
    {
        try
        {
            var feedback = await _context.Feedbacks.FindAsync(id);

            if (feedback == null)
            {
                return NotFound();
            }

            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Feedback deleted: {Id}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting feedback {Id}", id);
            return StatusCode(500, "An error occurred while deleting the feedback");
        }
    }

    /// <summary>
    /// Mark feedback as handled - admin only
    /// </summary>
    [HttpPatch("{id}/handle")]
    public async Task<IActionResult> MarkAsHandled(int id, [FromBody] bool isHandled)
    {
        try
        {
            var feedback = await _context.Feedbacks.FindAsync(id);

            if (feedback == null)
            {
                return NotFound();
            }

            feedback.IsHandled = isHandled;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Feedback {Id} marked as {Status}",
                id,
                isHandled ? "handled" : "unhandled"
            );
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating feedback {Id} status", id);
            return StatusCode(500, "An error occurred while updating the feedback status");
        }
    }

    /// <summary>
    /// Update admin response - admin only
    /// </summary>
    [HttpPatch("{id}/response")]
    public async Task<IActionResult> UpdateAdminResponse(int id, [FromBody] string response)
    {
        try
        {
            var feedback = await _context.Feedbacks.FindAsync(id);

            if (feedback == null)
            {
                return NotFound();
            }

            feedback.AdminResponse = response;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Admin response added to feedback {Id}", id);

            // Send email if user provided an email address
            if (!string.IsNullOrEmpty(feedback.Email))
            {
                await _emailService.SendFeedbackResponseAsync(
                    feedback.Email,
                    feedback.Title,
                    response
                );
                _logger.LogInformation(
                    "Email notification sent to {Email} for feedback {Id}",
                    feedback.Email,
                    id
                );
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating admin response for feedback {Id}", id);
            return StatusCode(500, "An error occurred while updating the admin response");
        }
    }

    /// <summary>
    /// Get count of unhandled feedback - admin only
    /// </summary>
    [HttpGet("unhandled/count")]
    public async Task<ActionResult<int>> GetUnhandledCount()
    {
        try
        {
            var count = await _context.Feedbacks.CountAsync(f => !f.IsHandled);
            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unhandled feedback count");
            return StatusCode(500, "An error occurred while getting the unhandled count");
        }
    }
}
