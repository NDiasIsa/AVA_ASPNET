using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AVA_ASPNET.Data
{
    public static class SeedData
    {
        public static async Task InicializarAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var config = serviceProvider.GetRequiredService<IConfiguration>();
            var db = serviceProvider.GetRequiredService<AppDbContext>();

            // Criar roles
            string[] roles = { "Admin", "Professor", "Aluno" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));
            }

            // Ler credenciais dos User Secrets
            var adminEmail = config["AdminEmail"]
                ?? throw new InvalidOperationException("AdminEmail não configurado nos User Secrets.");
            var adminSenha = config["AdminSenha"]
                ?? throw new InvalidOperationException("AdminSenha não configurado nos User Secrets.");

            // Criar admin se não existir
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new IdentityUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminSenha);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Garante que o Perfil do admin existe, mesmo que o usuário Identity
            // já existisse de uma execução anterior que tenha falhado antes de criar o Perfil
            if (adminUser != null)
            {
                var adminPerfilExiste = await db.Perfis.AnyAsync(p => p.UserId == adminUser.Id);
                if (!adminPerfilExiste)
                {
                    db.Perfis.Add(new Perfil
                    {
                        UserId = adminUser.Id,
                        TipoUsuario = "Admin",
                        NomeCompleto = "Administrador",
                        PrimeiroAcesso = false,
                        Ativo = true
                    });
                    await db.SaveChangesAsync();
                }
            }
            // Criar ano letivo inicial se não existir
            var anoLetivoExiste = await db.AnosLetivos.AnyAsync();
            if (!anoLetivoExiste)
            {
                db.AnosLetivos.Add(new AnoLetivo
                {
                    Ano = DateTime.Now.Year,
                    Ativo = true,
                    DataInicio = DateTime.Now
                });
                await db.SaveChangesAsync();
            }
        }
    }
}