namespace ElbilHusvagnLadda.WebApi.Models;

public class PasswordValidationResult
{
    public bool IsValid { get; set; }
    public bool HasMinLength { get; set; }
    public bool HasUppercase { get; set; }
    public bool HasLowercase { get; set; }
    public bool HasDigits { get; set; }
    public bool HasSpecialCharacters { get; set; }
    public List<string> Errors { get; set; } = new();
}
