namespace ElbilHusvagnLadda.WebApi.Models;

public class ChargingPointExportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int ConnectorCount { get; set; }
    public string? ImageBase64 { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ChargePointCommentExportDto> Comments { get; set; } = new();
}

public class ChargePointCommentExportDto
{
    public int Id { get; set; }
    public string? Comment { get; set; }
    public string VoteType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class BackupExportDto
{
    public DateTime ExportDate { get; set; }
    public int TotalChargingPoints { get; set; }
    public int TotalComments { get; set; }
    public int TotalUsers { get; set; }
    public List<ChargingPointExportDto> ChargingPoints { get; set; } = new();
    public List<UserExportDto> Users { get; set; } = new();
}
