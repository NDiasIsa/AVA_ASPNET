using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;

namespace AVA_ASPNET.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
        {
            var apiKey = _config["SendGrid:ApiKey"];
            var client = new SendGridClient(apiKey);

            var from = new EmailAddress(
                _config["SendGrid:RemetenteEmail"],
                _config["SendGrid:RemetenteNome"]
            );
            var to = new EmailAddress(destinatario);

            var msg = MailHelper.CreateSingleEmail(from, to, assunto, null, corpoHtml);
            await client.SendEmailAsync(msg);
        }
    }
}
