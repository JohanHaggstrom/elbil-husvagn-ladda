using System.ComponentModel.DataAnnotations;

namespace ElbilHusvagnLadda.WebApi.Models;

public class CreateUserRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }
}
