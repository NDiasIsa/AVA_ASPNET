using AVA_ASPNET.Models;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Identity;
using System.Globalization;

namespace AVA_ASPNET.Data
{
    public static class SeedData
    {
        public static async Task InicializarAsync(IServiceProvider services)
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
            var db = services.GetRequiredService<AppDbContext>();
            var streams = new Stream[]
            {
                //bota os arquivos CSV que você quer ler aq (já ta na raiz do projeto aí)
                File.OpenRead(/*bota o caminho aq*/),
            };

            await db.Database.EnsureCreatedAsync();

            // Roles
            foreach (var role in new[] { "Admin", "Professor", "Aluno" })
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));

            // Admin padrão
            const string adminEmail = "admin@quantumpinheiral.ifrj.edu.br";
            const string adminSenha = "[Admin@123]"; 

            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new IdentityUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminSenha);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    db.Perfis.Add(new Perfil
                    {
                        UserId = adminUser.Id,
                        TipoUsuario = "Admin",
                        NomeCompleto = "Administrador",
                        Matricula = null,
                        PrimeiroAcesso = false
                    });
                    await db.SaveChangesAsync();
                }
            }

            //aq ele já lê o CSV e cria os usuários
            LerCsv(streams, userManager, roleManager, db).Wait();
        }

        public static async Task LerCsv(Stream[] streams, UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager, AppDbContext db)
        {
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                Delimiter = ";",
                HeaderValidated = null,
                MissingFieldFound = null
            };
            foreach (var stream in streams)
            {
                using var reader = new StreamReader(stream);
                using var csv = new CsvHelper.CsvReader(reader, config);
                var records = csv.GetRecords<LinhaCsvDto>().ToList();

                foreach (var record in records)
                {
                    if (await userManager.FindByEmailAsync(record.Matricula + "@quantumpinheiral.ifrj.edu.br") == null)
                    {
                        var user = new IdentityUser
                        {
                            UserName = record.Matricula,
                            Email = record.Matricula + "@quantumpinheiral.ifrj.edu.br",
                            EmailConfirmed = true
                        };
                        var result = await userManager.CreateAsync(user, "[Aluno@123]");
                        if (result.Succeeded)
                        {
                            await userManager.AddToRoleAsync(user, "Aluno");
                            db.Perfis.Add(new Perfil
                            {
                                UserId = user.Id,
                                TipoUsuario = "Aluno",
                                NomeCompleto = record.NomeAluno,
                                Matricula = record.Matricula,
                                PrimeiroAcesso = true
                            });
                            await db.SaveChangesAsync();
                        }
                    }
                }
            }
        }
    }
}
