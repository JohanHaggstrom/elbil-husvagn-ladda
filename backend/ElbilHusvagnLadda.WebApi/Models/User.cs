using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ElbilHusvagnLadda.WebApi.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Username { get; set; } = string.Empty;

    [JsonIgnore]
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; } = Role.User;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
