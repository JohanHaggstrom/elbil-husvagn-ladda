using System.ComponentModel.DataAnnotations;

namespace ElbilHusvagnLadda.WebApi.Models;

public class IgnoredChargingPoint
{
    public int Id { get; set; }

    [Required]
    public required string ExternalId { get; set; }

    [Required]
    public required string ExternalSource { get; set; }
}
