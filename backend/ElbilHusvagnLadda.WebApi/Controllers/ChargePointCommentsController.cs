using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[ApiController]
[Route("api/chargingpoints/{chargePointId}/comments")]
public class ChargePointCommentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ChargePointCommentsController> _logger;

    public ChargePointCommentsController(
        AppDbContext context,
        ILogger<ChargePointCommentsController> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChargePointComment>>> GetComments(int chargePointId)
    {
        try
        {
            var comments = await _context
                .ChargePointComments.Where(c => c.ChargePointId == chargePointId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error fetching comments for charge point {ChargePointId}",
                chargePointId
            );
            return StatusCode(500, "An error occurred while fetching comments");
        }
    }

    [HttpPost]
    public async Task<ActionResult<ChargePointComment>> CreateComment(
        int chargePointId,
        [FromBody] CreateCommentRequest request
    )
    {
        try
        {
            // Verify charge point exists
            var chargePointExists = await _context.ChargingPoints.AnyAsync(cp =>
                cp.Id == chargePointId
            );
            if (!chargePointExists)
            {
                return NotFound($"Charge point with ID {chargePointId} not found");
            }

            var comment = new ChargePointComment
            {
                ChargePointId = chargePointId,
                Comment = request.Comment,
                Vote = request.Vote,
                CreatedAt = DateTime.UtcNow,
            };

            _context.ChargePointComments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetComments), new { chargePointId }, comment);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error creating comment for charge point {ChargePointId}",
                chargePointId
            );
            return StatusCode(500, "An error occurred while creating the comment");
        }
    }

    [HttpDelete("{commentId}")]
    public async Task<ActionResult> DeleteComment(int chargePointId, int commentId)
    {
        try
        {
            var comment = await _context.ChargePointComments.FirstOrDefaultAsync(c =>
                c.Id == commentId && c.ChargePointId == chargePointId
            );

            if (comment == null)
            {
                return NotFound($"Comment with ID {commentId} not found");
            }

            _context.ChargePointComments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
            return StatusCode(500, "An error occurred while deleting the comment");
        }
    }
}
