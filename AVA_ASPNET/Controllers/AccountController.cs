using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly AppDbContext _db;

        public AccountController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            AppDbContext db)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _db = db;
        }

        // ── Login ─────────────────────────────────────────────────
        // Identificador: matrícula (aluno) ou e-mail (professor/admin)

        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            if (!ModelState.IsValid) return View(model);

            // Descobrir se é matrícula ou e-mail
            var user = model.Identificador.Contains('@')
                ? await _userManager.FindByEmailAsync(model.Identificador)
                : await _userManager.FindByNameAsync(model.Identificador); // username = matrícula

            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Matrícula/e-mail ou senha inválidos.");
                return View(model);
            }

            var result = await _signInManager.PasswordSignInAsync(
                user.UserName!, model.Senha, model.LembrarMe, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                // Verificar primeiro acesso do aluno
                var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (perfil != null && perfil.PrimeiroAcesso && perfil.TipoUsuario == "Aluno")
                    return RedirectToAction(nameof(PrimeiroAcesso));

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                    return Redirect(returnUrl);

                return RedirectToAction("Index", "Home");
            }

            ModelState.AddModelError(string.Empty, "Matrícula/e-mail ou senha inválidos.");
            return View(model);
        }

        // ── Primeiro acesso do aluno (define senha + escolhe turma) ──

        [HttpGet]
        public async Task<IActionResult> PrimeiroAcesso()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction(nameof(Login));

            var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (perfil == null || !perfil.PrimeiroAcesso)
                return RedirectToAction("Index", "Home");

            var turmas = await _db.Turmas
                .OrderBy(t => t.Ano).ThenBy(t => t.Codigo)
                .ToListAsync();

            return View(new PrimeiroAcessoViewModel
            {
                Matricula = perfil.Matricula ?? "",
                NomeCompleto = perfil.NomeCompleto,
                TurmasDisponiveis = turmas
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PrimeiroAcesso(PrimeiroAcessoViewModel model)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction(nameof(Login));

            var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (perfil == null) return RedirectToAction(nameof(Login));

            // Recarregar turmas para exibição se der erro
            model.NomeCompleto = perfil.NomeCompleto;
            model.Matricula = perfil.Matricula ?? "";
            model.TurmasDisponiveis = await _db.Turmas
                .OrderBy(t => t.Ano).ThenBy(t => t.Codigo).ToListAsync();

            if (!ModelState.IsValid) return View(model);

            // Atualizar senha
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resultSenha = await _userManager.ResetPasswordAsync(user, token, model.Senha);
            if (!resultSenha.Succeeded)
            {
                foreach (var e in resultSenha.Errors)
                    ModelState.AddModelError(string.Empty, e.Description);
                return View(model);
            }

            // Salvar turma e marcar primeiro acesso concluído
            perfil.TurmaId = model.TurmaId;
            perfil.PrimeiroAcesso = false;
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Bem-vindo(a), {perfil.NomeCompleto}! Seu cadastro está completo.";
            return RedirectToAction("Index", "Home");
        }

        // ── Logout ────────────────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }

        // ── Acesso negado ─────────────────────────────────────────
        public IActionResult AcessoNegado() => View();
    }
}
