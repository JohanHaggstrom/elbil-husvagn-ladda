namespace ElbilHusvagnLadda.WebApi.Models;

public class NobilCache
{
    public int Id { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public string JsonData { get; set; } = string.Empty;
    public DateTime FetchedAt { get; set; }
}
