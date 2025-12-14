using ElbilHusvagnLadda.WebApi.Data;
using ElbilHusvagnLadda.WebApi.Models;
using ElbilHusvagnLadda.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace ElbilHusvagnLadda.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IPasswordValidationService _passwordValidationService;

    public AccountController(AppDbContext context, IPasswordService passwordService, IPasswordValidationService passwordValidationService)
    {
        _context = context;
        _passwordService = passwordService;
        _passwordValidationService = passwordValidationService;
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized();

        if (!_passwordService.VerifyPassword(request.OldPassword, user.PasswordHash))
        {
            return BadRequest("Incorrect old password.");
        }

        // Validate new password against policy
        var validationResult = _passwordValidationService.Validate(request.NewPassword);
        if (!validationResult.IsValid)
        {
            return BadRequest(new { errors = validationResult.Errors });
        }

        user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized();

        return Ok(new
        {
            id = user.Id,
            username = user.Username,
            email = user.Email,
            role = user.Role,
            createdAt = user.CreatedAt
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized();

        // Check if new email is already taken by another user
        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            var emailExists = await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != user.Id);
            if (emailExists)
            {
                return BadRequest("Email is already in use.");
            }
            user.Email = request.Email;
        }

        // Check if new username is already taken by another user
        if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
        {
            var usernameExists = await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != user.Id);
            if (usernameExists)
            {
                return BadRequest("Username is already in use.");
            }
            user.Username = request.Username;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Profile updated successfully.", user = new { username = user.Username, email = user.Email, role = user.Role } });
    }

    [AllowAnonymous]
    [HttpPost("validate-password")]
    public IActionResult ValidatePassword([FromBody] PasswordValidationRequest request)
    {
        if (string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("Password cannot be empty.");
        }

        var result = _passwordValidationService.Validate(request.Password);
        return Ok(result);
    }
}
