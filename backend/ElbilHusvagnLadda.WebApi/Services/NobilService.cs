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
        try
        {
            var apiKey = _configuration["Nobil:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("NOBIL API Key is missing");
                // Proceeding without key if NOBIL allows public dump download, but usually it requires key.
            }

            var allStations = await FetchNobilDumpAsync(countryCode);

            // Filter out existing and ignored stations
            var externalIds = allStations.Select(s => s.uuid.ToString()).ToList();

            var existingExternalIds = await _context.ChargingPoints
                .Where(cp => cp.ExternalSource == "NOBIL" && externalIds.Contains(cp.ExternalId))
                .Select(cp => cp.ExternalId)
                .ToListAsync();

            var ignoredExternalIds = await _context.IgnoredChargingPoints
                .Where(ip => ip.ExternalSource == "NOBIL" && externalIds.Contains(ip.ExternalId))
                .Select(ip => ip.ExternalId)
                .ToListAsync();

            var filteredStations = allStations
                .Where(s => !existingExternalIds.Contains(s.uuid.ToString()) && !ignoredExternalIds.Contains(s.uuid.ToString()))
                // Conversion is already done in FetchNobilDumpAsync
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

    public async Task<IEnumerable<NobilStationMatch>> FindStationMatchesAsync(string countryCode)
    {
        // 1. Get all local stations that are NOT linked to NOBIL
        var localStations = await _context.ChargingPoints
            .Where(cp => cp.ExternalSource != "NOBIL")
            .ToListAsync();

        if (!localStations.Any())
        {
            return Enumerable.Empty<NobilStationMatch>();
        }

        // 2. Get all Nobil stations
        var nobilStations = await FetchNobilDumpAsync(countryCode);

        // 3. Find matches based on distance
        var matches = new List<NobilStationMatch>();

        foreach (var local in localStations)
        {
            // Parse local coordinates
            var (localLat, localLon) = ParseCoordinates(local.MapCoordinates);
            if (localLat == 0 && localLon == 0) continue;

            foreach (var nobil in nobilStations)
            {
                var (nobilLat, nobilLon) = ParseCoordinates(ParseGeolocation(nobil.geolocation));

                var distance = CalculateDistance(localLat, localLon, nobilLat, nobilLon);

                // Match if closer than 100 meters
                if (distance < 100)
                {
                    matches.Add(new NobilStationMatch
                    {
                        LocalStation = local,
                        NobilStation = nobil,
                        DistanceMeters = distance
                    });
                }
            }
        }

        // Sort by distance
        return matches.OrderBy(m => m.DistanceMeters);
    }

    public async Task LinkStationAsync(int localId, string nobilId)
    {
        var station = await _context.ChargingPoints.FindAsync(localId);
        if (station == null)
        {
            throw new Exception("Local station not found");
        }

        station.ExternalId = nobilId;
        station.ExternalSource = "NOBIL";

        await _context.SaveChangesAsync();
    }

    private async Task<List<NobilDumpStation>> FetchNobilDumpAsync(string countryCode)
    {
        var cacheDays = _configuration.GetValue<int>("Nobil:CacheDays", 7);
        var cacheExpiry = DateTime.UtcNow.AddDays(-cacheDays);

        var cached = await _context.NobilCaches
            .Where(c => c.CountryCode == countryCode && c.FetchedAt > cacheExpiry)
            .OrderByDescending(c => c.FetchedAt)
            .FirstOrDefaultAsync();

        if (cached != null)
        {
            _logger.LogInformation("Returning cached NOBIL data for {CountryCode} (fetched {FetchedAt})", countryCode, cached.FetchedAt);
            return JsonSerializer.Deserialize<List<NobilDumpStation>>(cached.JsonData) ?? new List<NobilDumpStation>();
        }

        _logger.LogInformation("Cache miss for NOBIL {CountryCode} – fetching from API", countryCode);
        var stations = await FetchFromNobilApiAsync(countryCode);

        // Upsert cache
        var existingCache = await _context.NobilCaches
            .FirstOrDefaultAsync(c => c.CountryCode == countryCode);

        if (existingCache != null)
        {
            existingCache.JsonData = JsonSerializer.Serialize(stations);
            existingCache.FetchedAt = DateTime.UtcNow;
        }
        else
        {
            _context.NobilCaches.Add(new NobilCache
            {
                CountryCode = countryCode,
                JsonData = JsonSerializer.Serialize(stations),
                FetchedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return stations;
    }

    private async Task<List<NobilDumpStation>> FetchFromNobilApiAsync(string countryCode)
    {
        var apiKey = _configuration["Nobil:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("NOBIL API Key is missing");
        }

        var client = _httpClientFactory.CreateClient();
        var url = $"https://nobil.no/api/server/datadump.php?apikey={apiKey}&countrycode={countryCode}&format=json&file=false";

        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<NobilApiResponse>(content);

        if (result?.chargerstations == null)
        {
            return new List<NobilDumpStation>();
        }

        return result.chargerstations.Select(s => new NobilDumpStation
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
        }).ToList();
    }

    private (double, double) ParseCoordinates(string coordString)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(coordString)) return (0,0);
            var parts = coordString.Split(',');
            if (parts.Length == 2 &&
                double.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double lat) &&
                double.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double lon))
            {
                return (lat, lon);
            }
        }
        catch {}
        return (0, 0);
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371e3; // metres
        var φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        var φ2 = lat2 * Math.PI / 180;
        var Δφ = (lat2 - lat1) * Math.PI / 180;
        var Δλ = (lon2 - lon1) * Math.PI / 180;

        var a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
                Math.Cos(φ1) * Math.Cos(φ2) *
                Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        var d = R * c; // in metres
        return d;
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
