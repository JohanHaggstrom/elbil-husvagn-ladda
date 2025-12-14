using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<BackupController> _logger;

    public BackupController(AppDbContext context, ILogger<BackupController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportChargingPoints()
    {
        try
        {
            var chargingPoints = await _context.ChargingPoints
                .Include(cp => cp.ChargePointComments)
                .ToListAsync();

            var users = await _context.Users.ToListAsync();

            var exportDto = new BackupExportDto
            {
                ExportDate = DateTime.UtcNow,
                TotalChargingPoints = chargingPoints.Count,
                TotalComments = chargingPoints.Sum(cp => cp.ChargePointComments?.Count ?? 0),
                TotalUsers = users.Count
            };

            foreach (var point in chargingPoints)
            {
                var pointDto = new ChargingPointExportDto
                {
                    Id = point.Id,
                    Name = point.Title,
                    Location = $"{point.Address1}, {point.PostalCode} {point.City}, {point.Country}",
                    Latitude = 0, // MapCoordinates містить обидва, тому парсимо
                    Longitude = 0,
                    ConnectorCount = point.NumberOfChargePoints ?? 0,
                    CreatedAt = DateTime.UtcNow,
                    ImageBase64 = null
                };

                // Parse MapCoordinates to get lat/long
                if (!string.IsNullOrEmpty(point.MapCoordinates))
                {
                    var coords = point.MapCoordinates.Split(',');
                    if (coords.Length == 2 && double.TryParse(coords[0], out var lat) && double.TryParse(coords[1], out var lon))
                    {
                        pointDto.Latitude = lat;
                        pointDto.Longitude = lon;
                    }
                }

                // Convert image to base64 if it exists
                if (point.ImageData != null && point.ImageData.Length > 0)
                {
                    pointDto.ImageBase64 = Convert.ToBase64String(point.ImageData);
                }

                // Add comments
                if (point.ChargePointComments != null)
                {
                    foreach (var comment in point.ChargePointComments)
                    {
                        pointDto.Comments.Add(new ChargePointCommentExportDto
                        {
                            Id = comment.Id,
                            Comment = comment.Comment,
                            VoteType = comment.Vote.ToString(),
                            CreatedAt = comment.CreatedAt
                        });
                    }
                }

                exportDto.ChargingPoints.Add(pointDto);
            }

            // Add users
            foreach (var user in users)
            {
                exportDto.Users.Add(new UserExportDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role.ToString(),
                    CreatedAt = user.CreatedAt
                });
            }

            var json = JsonSerializer.Serialize(exportDto, new JsonSerializerOptions { WriteIndented = true });
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);

            return File(bytes, "application/json", $"charging-points-backup-{DateTime.UtcNow:yyyy-MM-dd-HHmmss}.json");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error exporting backup: {ex.Message}");
            return BadRequest("Could not export backup data.");
        }
    }
}

