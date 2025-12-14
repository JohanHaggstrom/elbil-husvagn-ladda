namespace ElbilHusvagnLadda.WebApi.Models;

public class UserExportDto
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Role { get; set; }
    public DateTime CreatedAt { get; set; }
}
