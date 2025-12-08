namespace ElbilHusvagnLadda.WebApi.Models;

public class ChargingPoint
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Address1 { get; set; }
    public string? Address2 { get; set; }
    public required string PostalCode { get; set; }
    public required string City { get; set; }
    public required string Country { get; set; }
    public string? Comments { get; set; }
    public required string MapCoordinates { get; set; }
    public int? NumberOfChargePoints { get; set; }
    public int Capacity { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public byte[]? ImageData { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public string? ImageContentType { get; set; }

    public bool HasImage => ImageData != null && ImageData.Length > 0;
}
