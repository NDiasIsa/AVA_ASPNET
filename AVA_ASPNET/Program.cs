using AVA_ASPNET.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Serviço de e-mail
builder.Services.AddSingleton<AVA_ASPNET.Services.EmailService>();

// Sessão
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(8);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.AccessDeniedPath = "/Account/AcessoNegado";
});

builder.Services.AddControllersWithViews();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();

app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true &&
        context.User.IsInRole("Aluno"))
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        var liberadas = new[] {
            "/account/primeiroacesso",
            "/account/logout",
            "/account/login",
            "/account/esquecisenha",
            "/account/redefinirsenha"
        };

        bool ehLiberada = liberadas.Any(l => path.StartsWith(l)) ||
                          path.StartsWith("/uploads") ||
                          path.StartsWith("/imagens") ||
                          path.StartsWith("/css") ||
                          path.StartsWith("/js") ||
                          path.StartsWith("/lib");

        if (!ehLiberada)
        {
            var jaChecou = context.Session.GetString("primeiroAcessoChecado");
            if (jaChecou == null)
            {
                // Usa o claim do usuário em vez de ir ao banco pelo UserManager
                var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (userId != null)
                {
                    var db = context.RequestServices.GetRequiredService<AVA_ASPNET.Data.AppDbContext>();
                    var perfil = await db.Perfis.FirstOrDefaultAsync(p => p.UserId == userId);
                    if (perfil != null && perfil.PrimeiroAcesso)
                    {
                        context.Response.Redirect("/Account/PrimeiroAcesso");
                        return;
                    }
                }
                context.Session.SetString("primeiroAcessoChecado", "true");
            }
        }
    }

    await next();
});

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

using (var scope = app.Services.CreateScope())
{
    await SeedData.InicializarAsync(scope.ServiceProvider);
}

app.Run();