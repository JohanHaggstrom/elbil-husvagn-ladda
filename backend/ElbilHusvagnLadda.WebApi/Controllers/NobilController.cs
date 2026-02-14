using ElbilHusvagnLadda.WebApi.Models;
using ElbilHusvagnLadda.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class NobilController : ControllerBase
{
    private readonly INobilService _nobilService;
    private readonly ILogger<NobilController> _logger;

    public NobilController(INobilService nobilService, ILogger<NobilController> logger)
    {
        _nobilService = nobilService;
        _logger = logger;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<NobilDumpStation>>> Search([FromQuery] string countryCode = "SWE")
    {
        try
        {
            var stations = await _nobilService.SearchStationsAsync(countryCode);
            return Ok(stations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching NOBIL stations");
            return StatusCode(500, "Error communicating with NOBIL API");
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import([FromBody] NobilDumpStation station)
    {
        try
        {
            await _nobilService.ImportStationAsync(station);
            return Ok(new { message = "Station imported successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing station {Uuid}", station.uuid);
            return StatusCode(500, "Error importing station");
        }
    }

    [HttpPost("ignore")]
    public async Task<IActionResult> Ignore([FromBody] IgnoreRequest request)
    {
        try
        {
            await _nobilService.IgnoreStationAsync(request.ExternalId, "NOBIL");
            return Ok(new { message = "Station ignored" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ignoring station {ExternalId}", request.ExternalId);
            return StatusCode(500, "Error ignoring station");
        }
    }

    public class IgnoreRequest
    {
        public string ExternalId { get; set; }
    }
}
