using System.ComponentModel.DataAnnotations;

namespace ElbilHusvagnLadda.WebApi.Models;

public class UpdateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }
}
