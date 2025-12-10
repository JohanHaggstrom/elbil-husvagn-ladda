using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace ElbilHusvagnLadda.WebApi.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string APIKEYNAME = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Apply API key validation to GET /api/chargingpoints AND all /api/suggestedchargingpoints
        bool isProtectedChargingPoints = context.Request.Path.StartsWithSegments("/api/chargingpoints") &&
                                         context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase);

        bool isProtectedSuggestions = context.Request.Path.StartsWithSegments("/api/suggestedchargingpoints");

        if (!isProtectedChargingPoints && !isProtectedSuggestions)
        {
            await _next(context);
            return;
        }

        // Exclude image endpoints from API Key validation so <img> tags work
        if (context.Request.Path.Value?.EndsWith("/image", StringComparison.OrdinalIgnoreCase) == true)
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(APIKEYNAME, out var extractedApiKey))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("API Key was not provided.");
            return;
        }

        var appSettings = context.RequestServices.GetRequiredService<IConfiguration>();
        var apiKey = appSettings.GetValue<string>("ApiKey");

        if (string.IsNullOrEmpty(apiKey) || !apiKey.Equals(extractedApiKey))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Unauthorized client.");
            return;
        }

        await _next(context);
    }
}
