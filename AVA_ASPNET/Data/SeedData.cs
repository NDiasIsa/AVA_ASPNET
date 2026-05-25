using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Identity;

namespace AVA_ASPNET.Data
{
    public static class SeedData
    {
        public static async Task InicializarAsync(IServiceProvider services)
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
            var db = services.GetRequiredService<AppDbContext>();

            await db.Database.EnsureCreatedAsync();

            // Roles
            foreach (var role in new[] { "Admin", "Professor", "Aluno" })
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));

            // Admin padrão
            const string adminEmail = "admin@quantumpinheiral.ifrj.edu.br";
            const string adminSenha = "Admin@123"; 

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
        }
    }
}
