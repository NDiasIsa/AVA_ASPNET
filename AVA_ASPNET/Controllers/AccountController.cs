using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using AVA_ASPNET.Services;
using Microsoft.AspNetCore.Authorization;
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
        private readonly EmailService _emailService;

        public AccountController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            AppDbContext db,
            EmailService emailService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _db = db;
            _emailService = emailService;
        }

        // ── Login ─────────────────────────────────────────────────

        [HttpGet]
        public IActionResult Login() => View(new LoginViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var user = model.Identificador.Contains('@')
                ? await _userManager.FindByEmailAsync(model.Identificador)
                : await _userManager.FindByNameAsync(model.Identificador.Trim());

            if (user == null)
            {
                ModelState.AddModelError(string.Empty, "Matrícula/e-mail ou senha inválidos.");
                return View(model);
            }

            var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (perfil != null && !perfil.Ativo)
            {
                ModelState.AddModelError(string.Empty, "Sua conta está inativa. Fale com o administrador.");
                return View(model);
            }

            var result = await _signInManager.PasswordSignInAsync(
                user.UserName!, model.Senha, model.LembrarMe, false);

            if (!result.Succeeded)
            {
                ModelState.AddModelError(string.Empty, "Matrícula/e-mail ou senha inválidos.");
                return View(model);
            }

            return RedirectToAction("Index", "Home");
        }

        // ── Logout ────────────────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction(nameof(Login));
        }

        // ── Primeiro acesso ───────────────────────────────────────

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> PrimeiroAcesso()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction(nameof(Login));

            var perfil = await _db.Perfis
                .Include(p => p.Turma)
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (perfil == null || !perfil.PrimeiroAcesso)
                return RedirectToAction("Index", "Home");

            return View(new PrimeiroAcessoViewModel
            {
                Matricula = perfil.Matricula ?? "",
                NomeCompleto = perfil.NomeCompleto,
                NomeTurma = perfil.Turma?.NomeExibicao ?? "—"
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize]
        public async Task<IActionResult> PrimeiroAcesso(PrimeiroAcessoViewModel model)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction(nameof(Login));

            var perfil = await _db.Perfis
                .Include(p => p.Turma)
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (perfil == null) return RedirectToAction(nameof(Login));

            model.NomeCompleto = perfil.NomeCompleto;
            model.Matricula = perfil.Matricula ?? "";
            model.NomeTurma = perfil.Turma?.NomeExibicao ?? "—";

            if (!ModelState.IsValid) return View(model);

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resultSenha = await _userManager.ResetPasswordAsync(user, token, model.Senha);
            if (!resultSenha.Succeeded)
            {
                foreach (var e in resultSenha.Errors)
                    ModelState.AddModelError(string.Empty, e.Description);
                return View(model);
            }

            perfil.PrimeiroAcesso = false;
            perfil.EmailPessoal = model.EmailPessoal;
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Bem-vindo(a), {perfil.NomeCompleto}!";
            return RedirectToAction("Index", "Home");
        }

        // ── Acesso negado ─────────────────────────────────────────

        public IActionResult AcessoNegado() => View();

        // ── Esqueci minha senha ───────────────────────────────────

        [HttpGet]
        [AllowAnonymous]
        public IActionResult EsqueciSenha() => View(new EsqueciSenhaViewModel());

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EsqueciSenha(EsqueciSenhaViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Identificador))
            {
                ModelState.AddModelError(string.Empty, "Digite sua matrícula ou e-mail.");
                return View(model);
            }

            IdentityUser? user = null;
            string? emailDestino = null;

            if (model.Identificador.Contains('@'))
            {
                // Professor — busca por e-mail
                user = await _userManager.FindByEmailAsync(model.Identificador);
                emailDestino = model.Identificador;
            }
            else
            {
                // Aluno — busca por matrícula
                user = await _userManager.FindByNameAsync(model.Identificador.Trim());
                if (user != null)
                {
                    var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
                    emailDestino = perfil?.EmailPessoal;
                }
            }

            if (user == null || string.IsNullOrEmpty(emailDestino))
            {
                TempData["Sucesso"] = "Se encontrarmos sua conta, enviaremos um e-mail com instruções.";
                return RedirectToAction(nameof(Login));
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var link = Url.Action(nameof(RedefinirSenha), "Account",
                new { userId = user.Id, token }, Request.Scheme);

            await _emailService.EnviarAsync(
                emailDestino,
                "Redefinição de senha — QuantumPinheiral",
                $@"<p>Olá!</p>
                   <p>Recebemos uma solicitação para redefinir sua senha no QuantumPinheiral.</p>
                   <p><a href='{link}' style='background:#005162;color:white;padding:10px 20px;
                      border-radius:5px;text-decoration:none;'>Redefinir minha senha</a></p>
                   <p>Se você não solicitou isso, ignore este e-mail.</p>
                   <p>O link expira em 24 horas.</p>"
            );

            TempData["Sucesso"] = "Se encontrarmos sua conta, enviaremos um e-mail com instruções.";
            return RedirectToAction(nameof(Login));
        }

        // ── Redefinir senha ───────────────────────────────────────

        [HttpGet]
        [AllowAnonymous]
        public IActionResult RedefinirSenha(string userId, string token)
        {
            return View(new RedefinirSenhaViewModel { UserId = userId, Token = token });
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RedefinirSenha(RedefinirSenhaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                TempData["Erro"] = "Link inválido ou expirado.";
                return RedirectToAction(nameof(Login));
            }

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.Senha);
            if (result.Succeeded)
            {
                var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (perfil != null) perfil.PrimeiroAcesso = false;
                await _db.SaveChangesAsync();

                TempData["Sucesso"] = "Senha redefinida com sucesso!";
                return RedirectToAction(nameof(Login));
            }

            foreach (var e in result.Errors)
                ModelState.AddModelError(string.Empty, e.Description);

            return View(model);
        }
    }
}
