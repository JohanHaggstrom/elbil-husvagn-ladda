using System.Text.RegularExpressions;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.Extensions.Options;

namespace ElbilHusvagnLadda.WebApi.Services;

public interface IPasswordValidationService
{
    PasswordValidationResult Validate(string password);
}

public class PasswordValidationService : IPasswordValidationService
{
    private readonly PasswordPolicy _policy;

    public PasswordValidationService(IOptions<PasswordPolicy> options)
    {
        _policy = options.Value;
    }

    public PasswordValidationResult Validate(string password)
    {
        var result = new PasswordValidationResult();

        if (string.IsNullOrEmpty(password))
        {
            result.Errors.Add("Lösenordet kan inte vara tomt");
            return result;
        }

        // Check minimum length
        result.HasMinLength = password.Length >= _policy.MinLength;
        if (!result.HasMinLength)
        {
            result.Errors.Add($"Lösenordet måste innehålla minst {_policy.MinLength} tecken");
        }

        // Check for uppercase
        result.HasUppercase = _policy.RequireUppercase ? Regex.IsMatch(password, "[A-Z]") : true;
        if (_policy.RequireUppercase && !result.HasUppercase)
        {
            result.Errors.Add("Lösenordet måste innehålla minst en versal (A-Z)");
        }

        // Check for lowercase
        result.HasLowercase = _policy.RequireLowercase ? Regex.IsMatch(password, "[a-z]") : true;
        if (_policy.RequireLowercase && !result.HasLowercase)
        {
            result.Errors.Add("Lösenordet måste innehålla minst en gemen (a-z)");
        }

        // Check for digits
        result.HasDigits = _policy.RequireDigits ? Regex.IsMatch(password, "[0-9]") : true;
        if (_policy.RequireDigits && !result.HasDigits)
        {
            result.Errors.Add("Lösenordet måste innehålla minst en siffra (0-9)");
        }

        // Check for special characters
        result.HasSpecialCharacters = _policy.RequireSpecialCharacters ? Regex.IsMatch(password, "[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>?]") : true;
        if (_policy.RequireSpecialCharacters && !result.HasSpecialCharacters)
        {
            result.Errors.Add("Lösenordet måste innehålla minst ett specialtecken (!@#$%^&*)");
        }

        result.IsValid = result.Errors.Count == 0;
        return result;
    }
}
