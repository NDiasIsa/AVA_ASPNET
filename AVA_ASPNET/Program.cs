using AVA_ASPNET.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Banco de dados ─────────────────────────────────────────────
// SQLite para desenvolvimento (sem precisar instalar SQL Server)
// Para produção, troque pela linha SQL Server abaixo e configure
// a connection string em appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=quantumpinheiral.db"));

// SQL Server (produção):
// options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))

// ── Identity ───────────────────────────────────────────────────
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Redirecionar para login quando não autenticado
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.AccessDeniedPath = "/Account/AcessoNegado";
});

// ── MVC ────────────────────────────────────────────────────────
builder.Services.AddControllersWithViews();

var app = builder.Build();

// ── Pipeline ───────────────────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication(); // ANTES de UseAuthorization
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ── Seed inicial (roles + admin) ───────────────────────────────
using (var scope = app.Services.CreateScope())
{
    await SeedData.InicializarAsync(scope.ServiceProvider);
}

app.Run();
