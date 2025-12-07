using System.Net;
using System.Net.Mail;
using ElbilHusvagnLadda.WebApi.Models;
using Microsoft.Extensions.Options;

namespace ElbilHusvagnLadda.WebApi.Services;

public interface IEmailService
{
    Task SendFeedbackResponseAsync(string toEmail, string feedbackTitle, string adminResponse);
}

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendFeedbackResponseAsync(string toEmail, string feedbackTitle, string adminResponse)
    {
        try
        {
            // Skip if email settings are not configured
            if (string.IsNullOrEmpty(_emailSettings.SmtpServer) ||
                string.IsNullOrEmpty(_emailSettings.FromEmail))
            {
                _logger.LogWarning("Email settings not configured. Skipping email send.");
                return;
            }

            using var smtpClient = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
            {
                Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword),
                EnableSsl = _emailSettings.EnableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                Subject = $"Svar på din feedback: {feedbackTitle}",
                Body = BuildEmailBody(feedbackTitle, adminResponse),
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
            _logger.LogInformation("Feedback response email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send feedback response email to {Email}", toEmail);
            // Don't throw - we don't want email failures to break the API response
        }
    }

    private string BuildEmailBody(string feedbackTitle, string adminResponse)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background-color: #1976d2;
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
        }}
        .content {{
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
        }}
        .feedback-title {{
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }}
        .response {{
            background-color: white;
            padding: 15px;
            border-left: 4px solid #1976d2;
            margin-top: 15px;
        }}
        .footer {{
            margin-top: 20px;
            font-size: 0.9em;
            color: #666;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class='header'>
        <h2>Elbil. Husvagn. Ladda.</h2>
        <p>Svar på din feedback</p>
    </div>
    <div class='content'>
        <p>Hej!</p>
        <p>Tack för din feedback. Vi har svarat på din förfrågan:</p>

        <div class='feedback-title'>
            Din feedback: {System.Web.HttpUtility.HtmlEncode(feedbackTitle)}
        </div>

        <div class='response'>
            <strong>Vårt svar:</strong><br/>
            {System.Web.HttpUtility.HtmlEncode(adminResponse).Replace("\n", "<br/>")}
        </div>

        <p style='margin-top: 20px;'>Med vänliga hälsningar,<br/>Elbil. Husvagn. Ladda.</p>
    </div>
    <div class='footer'>
        <p>Detta är ett automatiskt genererat e-postmeddelande. Vänligen svara inte på detta meddelande.</p>
    </div>
</body>
</html>";
    }
}
