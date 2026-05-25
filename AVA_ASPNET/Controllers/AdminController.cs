using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public AdminController(AppDbContext db, UserManager<IdentityUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // ── Dashboard ─────────────────────────────────────────────

        public async Task<IActionResult> Index()
        {
            ViewBag.TotalAlunos = await _db.Perfis.CountAsync(p => p.TipoUsuario == "Aluno");
            ViewBag.TotalProfessores = await _db.Perfis.CountAsync(p => p.TipoUsuario == "Professor");
            ViewBag.TotalTurmas = await _db.Turmas.CountAsync();
            return View();
        }

        // ── Criar professor ───────────────────────────────────────

        [HttpGet]
        public IActionResult CriarProfessor() => View(new CriarProfessorViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CriarProfessor(CriarProfessorViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            if (await _userManager.FindByEmailAsync(model.Email) != null)
            {
                ModelState.AddModelError("Email", "Já existe um professor com este e-mail.");
                return View(model);
            }

            var user = new IdentityUser
            {
                UserName = model.Email,
                Email = model.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Senha);
            if (!result.Succeeded)
            {
                foreach (var e in result.Errors)
                    ModelState.AddModelError(string.Empty, e.Description);
                return View(model);
            }

            await _userManager.AddToRoleAsync(user, "Professor");
            _db.Perfis.Add(new Perfil
            {
                UserId = user.Id,
                TipoUsuario = "Professor",
                NomeCompleto = model.NomeCompleto,
                Matricula = model.Matricula,
                PrimeiroAcesso = false
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Professor {model.NomeCompleto} cadastrado com sucesso!";
            return RedirectToAction(nameof(Usuarios));
        }

        // ── Usuários ─────────────────────────────────────────────

        public async Task<IActionResult> Usuarios()
        {
            var perfis = await _db.Perfis
                .Include(p => p.Turma)
                .OrderBy(p => p.TipoUsuario)
                .ThenBy(p => p.NomeCompleto)
                .ToListAsync();
            return View(perfis);
        }

        // ── Turmas ────────────────────────────────────────────────

        public async Task<IActionResult> Turmas()
        {
            var turmas = await _db.Turmas
                .Include(t => t.Professor)
                .Include(t => t.Alunos)
                .OrderBy(t => t.Ano).ThenBy(t => t.Codigo)
                .ToListAsync();
            return View(turmas);
        }
    }
}
