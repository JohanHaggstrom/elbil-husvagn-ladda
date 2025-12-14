using System.ComponentModel.DataAnnotations;

namespace ElbilHusvagnLadda.WebApi.Models;

public class ChangePasswordRequest
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}
