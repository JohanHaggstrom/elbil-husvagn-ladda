using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChargingPointsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ChargingPointsController> _logger;

    public ChargingPointsController(AppDbContext context, ILogger<ChargingPointsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChargingPoint>>> GetChargingPoints()
    {
        try
        {
            var chargingPoints = await _context.ChargingPoints.ToListAsync();
            return Ok(chargingPoints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching charging points");
            return StatusCode(500, "An error occurred while fetching charging points");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ChargingPoint>> GetChargingPoint(int id)
    {
        var chargingPoint = await _context.ChargingPoints.FindAsync(id);

        if (chargingPoint == null)
        {
            return NotFound();
        }

        return chargingPoint;
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> PutChargingPoint(int id, ChargingPoint chargingPoint)
    {
        if (id != chargingPoint.Id)
        {
            return BadRequest();
        }

        // Preserve existing image data if not provided in update
        var existingPoint = await _context.ChargingPoints.AsNoTracking().FirstOrDefaultAsync(cp => cp.Id == id);
        if (existingPoint != null)
        {
            if (chargingPoint.ImageData == null && existingPoint.ImageData != null)
            {
                chargingPoint.ImageData = existingPoint.ImageData;
                chargingPoint.ImageContentType = existingPoint.ImageContentType;
            }
        }

        _context.Entry(chargingPoint).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ChargingPointExists(id))
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

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ChargingPoint>> PostChargingPoint(ChargingPoint chargingPoint)
    {
        _context.ChargingPoints.Add(chargingPoint);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetChargingPoint", new { id = chargingPoint.Id }, chargingPoint);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteChargingPoint(int id)
    {
        var chargingPoint = await _context.ChargingPoints.FindAsync(id);

        if (chargingPoint == null)
        {
            return NotFound();
        }

        _context.ChargingPoints.Remove(chargingPoint);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ChargingPointExists(int id)
    {
        return _context.ChargingPoints.Any(e => e.Id == id);
    }

    /// <summary>
    /// Upload image for charging point - admin only
    /// </summary>
    [HttpPost("{id}/image")]
    [Authorize]
    public async Task<IActionResult> UploadImage(int id, IFormFile image)
    {
        try
        {
            var chargingPoint = await _context.ChargingPoints.FindAsync(id);
            if (chargingPoint == null)
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
                chargingPoint.ImageData = memoryStream.ToArray();
                chargingPoint.ImageContentType = image.ContentType;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Image uploaded for charging point {Id}", id);
            return Ok(new { message = "Image uploaded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for charging point {Id}", id);
            return StatusCode(500, "An error occurred while uploading the image");
        }
    }

    /// <summary>
    /// Get image for charging point
    /// </summary>
    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetImage(int id)
    {
        var chargingPoint = await _context.ChargingPoints.FindAsync(id);
        if (chargingPoint == null || chargingPoint.ImageData == null)
        {
            return NotFound();
        }

        var contentType = chargingPoint.ImageContentType;
        if (string.IsNullOrEmpty(contentType))
        {
            contentType = "image/jpeg"; // Fallback for legacy data
        }

        return File(chargingPoint.ImageData, contentType);
    }

    /// <summary>
    /// Delete image for charging point - admin only
    /// </summary>
    [HttpDelete("{id}/image")]
    [Authorize]
    public async Task<IActionResult> DeleteImage(int id)
    {
        try
        {
            var chargingPoint = await _context.ChargingPoints.FindAsync(id);
            if (chargingPoint == null)
            {
                return NotFound();
            }

            if (chargingPoint.ImageData == null)
            {
                return BadRequest("No image to delete");
            }

            chargingPoint.ImageData = null;
            chargingPoint.ImageContentType = null;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Image deleted for charging point {Id}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image for charging point {Id}", id);
            return StatusCode(500, "An error occurred while deleting the image");
        }
    }
}
