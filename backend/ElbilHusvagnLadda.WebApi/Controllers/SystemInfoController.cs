using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using ElbilHusvagnLadda.WebApi.Data;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystemInfoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SystemInfoController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("version")]
        public async Task<IActionResult> GetVersion()
        {
            var assembly = Assembly.GetExecutingAssembly();
            var backendVersion = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                                ?? assembly.GetName().Version?.ToString()
                                ?? "1.0.0";

            string? lastMigration = null;
            try
            {
                var migrations = await _context.Database.GetAppliedMigrationsAsync();
                lastMigration = migrations.LastOrDefault();
            }
            catch (Exception)
            {
                // Fallback if DB check fails
            }

            return Ok(new
            {
                BackendVersion = backendVersion,
                LastMigration = lastMigration
            });
        }
    }
}
