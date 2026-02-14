using System.Text.Json;
using System.Text.Json.Serialization;
using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Services;

public class NobilService : INobilService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NobilService> _logger;
    private readonly IConfiguration _configuration;

    public NobilService(AppDbContext context, IHttpClientFactory httpClientFactory, ILogger<NobilService> logger, IConfiguration configuration)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<IEnumerable<NobilDumpStation>> SearchStationsAsync(string countryCode)
    {
        var apiKey = _configuration["Nobil:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("NOBIL API Key is missing");
            // Proceeding without key if NOBIL allows public dump download, but usually it requires key.
        }

        var client = _httpClientFactory.CreateClient();

        // Using the Nobil simplified dump endpoint or search endpoint.
        // For this implementation, we'll try to fetch a dump or search.
        // Documentation says: https://nobil.no/api/server/datadump.php?apikey=...&countrycode=NOR&format=json&file=false

        var url = $"https://nobil.no/api/server/datadump.php?apikey={apiKey}&countrycode={countryCode}&format=json&file=false";

        try
        {
            var response = await client.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();

            // Deserialize the response to the raw API model
            var result = JsonSerializer.Deserialize<NobilApiResponse>(content);

            // Log summary instead of entire response to avoid crashing
            if (result?.chargerstations == null)
            {
                _logger.LogWarning("NOBIL API returned no charging stations. Response length: {Length} bytes", content.Length);
                return Enumerable.Empty<NobilDumpStation>();
            }

            _logger.LogInformation("NOBIL API Response: Retrieved {Count} charging stations. Response size: {Size} bytes",
                result.chargerstations.Count, content.Length);



            // Filter out existing and ignored stations
            var externalIds = result.chargerstations.Select(s => s.csmd.uuid.ToString()).ToList();

            var existingExternalIds = await _context.ChargingPoints
                .Where(cp => cp.ExternalSource == "NOBIL" && externalIds.Contains(cp.ExternalId))
                .Select(cp => cp.ExternalId)
                .ToListAsync();

            var ignoredExternalIds = await _context.IgnoredChargingPoints
                .Where(ip => ip.ExternalSource == "NOBIL" && externalIds.Contains(ip.ExternalId))
                .Select(ip => ip.ExternalId)
                .ToListAsync();

            var filteredStations = result.chargerstations
                .Where(s => !existingExternalIds.Contains(s.csmd.uuid.ToString()) && !ignoredExternalIds.Contains(s.csmd.uuid.ToString()))
                .Select(s => new NobilDumpStation
                {
                    uuid = s.csmd.uuid,
                    name = s.csmd.name,
                    street = s.csmd.street,
                    house_number = s.csmd.house_number,
                    zipcode = s.csmd.zipcode,
                    city = s.csmd.city,
                    municipality = s.csmd.municipality,
                    country_code = s.csmd.country_code,
                    description = s.csmd.description,
                    geolocation = s.csmd.geolocation,
                    number_charging_points = s.csmd.number_charging_points
                })
                .ToList();

            return filteredStations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching data from NOBIL");
            throw;
        }
    }

    public async Task ImportStationAsync(NobilDumpStation station)
    {
        if (await _context.ChargingPoints.AnyAsync(cp => cp.ExternalId == station.uuid.ToString() && cp.ExternalSource == "NOBIL"))
        {
            return; // Already exists
        }

        var newPoint = new ChargingPoint
        {
            Title = station.name,
            Address1 = string.IsNullOrEmpty(station.street) ? station.name : (station.street + " " + station.house_number).Trim(),
            City = station.city,
            PostalCode = station.zipcode,
            Country = station.country_code,
            Comments = station.description, // using description as comments
            MapCoordinates = ParseGeolocation(station.geolocation), // Lat, Long
            NumberOfChargePoints = station.number_charging_points,
            Capacity = 0, // Need to parse connectors to get max capacity, defaulting to 0 for now
            ExternalId = station.uuid.ToString(),
            ExternalSource = "NOBIL"
        };

        _context.ChargingPoints.Add(newPoint);
        await _context.SaveChangesAsync();
    }

    public async Task IgnoreStationAsync(string externalId, string externalSource)
    {
        if (await _context.IgnoredChargingPoints.AnyAsync(ip => ip.ExternalId == externalId && ip.ExternalSource == externalSource))
        {
            return;
        }

        _context.IgnoredChargingPoints.Add(new IgnoredChargingPoint
        {
            ExternalId = externalId,
            ExternalSource = externalSource
        });
        await _context.SaveChangesAsync();
    }

    private string ParseGeolocation(string geolocation)
    {
        if (string.IsNullOrEmpty(geolocation)) return "0, 0";

        // Format is "(59.93255,10.71514)"
        try
        {
            var trimmed = geolocation.Trim('(', ')');
            var parts = trimmed.Split(',');
            if (parts.Length == 2)
            {
                return $"{parts[0].Trim()}, {parts[1].Trim()}";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing geolocation: {Geolocation}", geolocation);
        }

        return "0, 0";
    }
}

// Wrapper classes for NOBIL JSON structure (Internal use for deserialization)
public class NobilApiResponse
{
    public List<NobilApiStationContainer> chargerstations { get; set; }
}

public class NobilApiStationContainer
{
    public NobilApiStation csmd { get; set; }
    // attr stubs if needed
}

public class NobilApiStation
{
    [JsonPropertyName("id")]
    public int uuid { get; set; }

    [JsonPropertyName("name")]
    public string name { get; set; }

    [JsonPropertyName("Street")]
    public string street { get; set; }

    [JsonPropertyName("House_number")]
    public string house_number { get; set; }

    [JsonPropertyName("Zipcode")]
    public string zipcode { get; set; }

    [JsonPropertyName("City")]
    public string city { get; set; }

    [JsonPropertyName("Municipality")]
    public string municipality { get; set; }

    [JsonPropertyName("Land_code")]
    public string country_code { get; set; }

    [JsonPropertyName("Description_of_location")]
    public string description { get; set; }

    [JsonPropertyName("Position")]
    public string geolocation { get; set; } // "(lat,long)"

    [JsonPropertyName("Number_charging_points")]
    public int number_charging_points { get; set; }
}
