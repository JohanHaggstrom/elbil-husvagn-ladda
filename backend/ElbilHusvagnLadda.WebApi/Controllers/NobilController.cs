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
    public async Task<ActionResult<IEnumerable<NobilDumpStation>>> Search(
        [FromQuery] string countryCode = "SWE"
    )
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

    [HttpGet("matches")]
    public async Task<ActionResult<IEnumerable<NobilStationMatch>>> GetMatches(
        [FromQuery] string countryCode = "SWE"
    )
    {
        try
        {
            var matches = await _nobilService.FindStationMatchesAsync(countryCode);
            return Ok(matches);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding matches");
            return StatusCode(500, "Error finding matches");
        }
    }

    [HttpPost("link")]
    public async Task<IActionResult> Link([FromBody] LinkRequest request)
    {
        try
        {
            await _nobilService.LinkStationAsync(request.LocalId, request.NobilId);
            return Ok(new { message = "Station linked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error linking station {LocalId} to {NobilId}",
                request.LocalId,
                request.NobilId
            );
            return StatusCode(500, "Error linking station");
        }
    }

    public class IgnoreRequest
    {
        public string ExternalId { get; set; }
    }

    public class LinkRequest
    {
        public int LocalId { get; set; }
        public string NobilId { get; set; }
    }
}
