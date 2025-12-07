using Restaurant_Management.Services.Email;
using System.Net;
using System.Net.Mail;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var emailSettings = _config.GetSection("EmailSettings");

        var mailMessage = new MailMessage
        {
            From = new MailAddress(emailSettings["Email"], emailSettings["DisplayName"]),
            Subject = subject,
            Body = body,
            IsBodyHtml = true 
        };

        mailMessage.To.Add(toEmail);

        using var smtpClient = new SmtpClient(emailSettings["Host"], int.Parse(emailSettings["Port"]))
        {
            Credentials = new NetworkCredential(emailSettings["Email"], emailSettings["Password"]),
            EnableSsl = true
        };

        await smtpClient.SendMailAsync(mailMessage);
    }
}