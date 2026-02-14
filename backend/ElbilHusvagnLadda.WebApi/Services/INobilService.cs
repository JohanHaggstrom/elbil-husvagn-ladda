using ElbilHusvagnLadda.WebApi.Models;
using System.Text.Json.Serialization;

namespace ElbilHusvagnLadda.WebApi.Services;

public interface INobilService
{
    Task<IEnumerable<NobilDumpStation>> SearchStationsAsync(string countryCode);
    Task ImportStationAsync(NobilDumpStation station);
    Task IgnoreStationAsync(string externalId, string externalSource);
}

// DTO for frontend communication (clean structure)
public class NobilDumpStation
{
    public int uuid { get; set; }
    public string name { get; set; }
    public string street { get; set; }
    public string house_number { get; set; }
    public string zipcode { get; set; }
    public string city { get; set; }
    public string municipality { get; set; }
    public string country_code { get; set; }
    public string description { get; set; }
    public string geolocation { get; set; } // "(lat,long)"
    public int number_charging_points { get; set; }
}
