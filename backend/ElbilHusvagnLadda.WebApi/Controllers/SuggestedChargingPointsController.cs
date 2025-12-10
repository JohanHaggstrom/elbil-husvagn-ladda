using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuggestedChargingPointsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<SuggestedChargingPointsController> _logger;

    public SuggestedChargingPointsController(AppDbContext context, ILogger<SuggestedChargingPointsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/SuggestedChargingPoints
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<SuggestedChargingPoint>>> GetSuggestedChargingPoints()
    {
        return await _context.SuggestedChargingPoints.ToListAsync();
    }

    // GET: api/SuggestedChargingPoints/count
    [HttpGet("count")]
    [Authorize]
    public async Task<ActionResult<int>> GetSuggestedCount()
    {
        return await _context.SuggestedChargingPoints.CountAsync();
    }

    // GET: api/SuggestedChargingPoints/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<SuggestedChargingPoint>> GetSuggestedChargingPoint(int id)
    {
        var suggestedChargingPoint = await _context.SuggestedChargingPoints.FindAsync(id);

        if (suggestedChargingPoint == null)
        {
            return NotFound();
        }

        return suggestedChargingPoint;
    }

    // POST: api/SuggestedChargingPoints
    [HttpPost]
    public async Task<ActionResult<SuggestedChargingPoint>> PostSuggestedChargingPoint(SuggestedChargingPoint suggestedChargingPoint)
    {
        _context.SuggestedChargingPoints.Add(suggestedChargingPoint);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetSuggestedChargingPoint", new { id = suggestedChargingPoint.Id }, suggestedChargingPoint);
    }

    // DELETE: api/SuggestedChargingPoints/5
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteSuggestedChargingPoint(int id)
    {
        var suggestedChargingPoint = await _context.SuggestedChargingPoints.FindAsync(id);
        if (suggestedChargingPoint == null)
        {
            return NotFound();
        }

        _context.SuggestedChargingPoints.Remove(suggestedChargingPoint);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/SuggestedChargingPoints/5/approve
    [HttpPost("{id}/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveSuggestedChargingPoint(int id)
    {
        var suggestion = await _context.SuggestedChargingPoints.FindAsync(id);
        if (suggestion == null)
        {
            return NotFound();
        }

        // Create new ChargingPoint from suggestion
        var chargingPoint = new ChargingPoint
        {
            Title = suggestion.Title,
            Address1 = suggestion.Address1,
            Address2 = suggestion.Address2,
            PostalCode = suggestion.PostalCode,
            City = suggestion.City,
            Country = suggestion.Country,
            Comments = suggestion.Comments,
            MapCoordinates = suggestion.MapCoordinates,
            NumberOfChargePoints = suggestion.NumberOfChargePoints,
            Capacity = suggestion.Capacity,
            ImageData = suggestion.ImageData,
            ImageContentType = suggestion.ImageContentType
        };

        _context.ChargingPoints.Add(chargingPoint);
        _context.SuggestedChargingPoints.Remove(suggestion);
        await _context.SaveChangesAsync();

        return Ok(chargingPoint);
    }

    [HttpPost("{id}/image")]
    public async Task<IActionResult> UploadImage(int id, IFormFile image)
    {
        try
        {
            var suggestion = await _context.SuggestedChargingPoints.FindAsync(id);
            if (suggestion == null)
            {
                return NotFound();
            }

            if (image == null || image.Length == 0)
            {
                return BadRequest("No image file provided");
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(image.ContentType))
            {
                return BadRequest("Invalid image type. Allowed: JPG, PNG, WebP");
            }

            // Validate size (5MB)
            if (image.Length > 5 * 1024 * 1024)
            {
                return BadRequest("Image too large. Max 5MB");
            }

            using (var memoryStream = new MemoryStream())
            {
                await image.CopyToAsync(memoryStream);
                suggestion.ImageData = memoryStream.ToArray();
                suggestion.ImageContentType = image.ContentType;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Image uploaded for suggested charging point {Id}", id);
            return Ok(new { message = "Image uploaded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for suggested charging point {Id}", id);
            return StatusCode(500, "An error occurred while uploading the image");
        }
    }

    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetImage(int id)
    {
        var suggestion = await _context.SuggestedChargingPoints.FindAsync(id);
        if (suggestion == null || suggestion.ImageData == null)
        {
            return NotFound();
        }

        var contentType = suggestion.ImageContentType ?? "image/jpeg";
        return File(suggestion.ImageData, contentType);
    }
}
