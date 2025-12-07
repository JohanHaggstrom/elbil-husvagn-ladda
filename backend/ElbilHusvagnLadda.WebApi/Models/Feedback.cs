using System.ComponentModel.DataAnnotations;

namespace ElbilHusvagnLadda.WebApi.Models;

public class Feedback
{
    public int Id { get; set; }

    [Required]
    public FeedbackType Type { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [EmailAddress]
    [MaxLength(255)]
    public string? Email { get; set; }

    public bool IsHandled { get; set; } = false;

    [MaxLength(2000)]
    public string? AdminResponse { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
