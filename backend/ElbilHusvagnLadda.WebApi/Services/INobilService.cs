using System.Text.Json.Serialization;
using ElbilHusvagnLadda.WebApi.Models;

namespace ElbilHusvagnLadda.WebApi.Services;

public interface INobilService
{
    Task<IEnumerable<NobilDumpStation>> SearchStationsAsync(string countryCode);
    Task<IEnumerable<NobilStationMatch>> FindStationMatchesAsync(string countryCode);
    Task LinkStationAsync(int localId, string nobilId);
    Task ImportStationAsync(NobilDumpStation station);
    Task IgnoreStationAsync(string externalId, string externalSource);
}

public class NobilStationMatch
{
    public ChargingPoint LocalStation { get; set; }
    public NobilDumpStation NobilStation { get; set; }
    public double DistanceMeters { get; set; }
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
    public int capacity { get; set; }
}
