using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using AVA_ASPNET.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize(Roles = UsuarioRole.AdminEProfessor)]
    public class ProfessorController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public ProfessorController(AppDbContext db, UserManager<IdentityUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        private async Task<Perfil?> GetPerfilAtualAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return null;
            return await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
        }

        // ── Minhas turmas ─────────────────────────────────────────

        public async Task<IActionResult> MinhasTurmas()
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            List<Turma> turmas;

            if (User.IsInRole(UsuarioRole.Admin))
            {
                turmas = await _db.Turmas
                    .Include(t => t.Alunos)
                    .Include(t => t.Professor)
                    .OrderBy(t => t.Ano).ThenBy(t => t.Codigo)
                    .ToListAsync();
            }
            else
            {
                turmas = await _db.Turmas
                    .Where(t => t.ProfessorId == perfil.Id)
                    .Include(t => t.Alunos)
                    .OrderBy(t => t.Ano).ThenBy(t => t.Codigo)
                    .ToListAsync();
            }

            return View(turmas);
        }

        // ── Alunos da turma ───────────────────────────────────────

        public async Task<IActionResult> AlunosDaTurma(int turmaId)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            // Professor só acessa turmas dele; admin acessa todas
            var turma = User.IsInRole(UsuarioRole.Admin)
                ? await _db.Turmas
                    .Include(t => t.Alunos)
                    .FirstOrDefaultAsync(t => t.Id == turmaId)
                : await _db.Turmas
                    .Include(t => t.Alunos)
                    .FirstOrDefaultAsync(t => t.Id == turmaId && t.ProfessorId == perfil.Id);

            if (turma == null) return NotFound();
            return View(turma);
        }

        public async Task<IActionResult> VisaoGeral()
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            List<Turma> turmas;

            if (User.IsInRole(UsuarioRole.Admin))
            {
                turmas = await _db.Turmas
                    .Include(t => t.Alunos.Where(a => a.Ativo))
                    .Include(t => t.Secoes)
                        .ThenInclude(s => s.Atividades)
                            .ThenInclude(a => a.Entregas)
                    .Include(t => t.Quizzes.Where(q => q.Ativo))
                    .ToListAsync();
            }
            else
            {
                turmas = await _db.Turmas
                    .Where(t => t.ProfessorId == perfil.Id)
                    .Include(t => t.Alunos.Where(a => a.Ativo))
                    .Include(t => t.Secoes)
                        .ThenInclude(s => s.Atividades)
                            .ThenInclude(a => a.Entregas)
                    .Include(t => t.Quizzes.Where(q => q.Ativo))
                    .ToListAsync();
            }

            var resumo = turmas.Select(t => new ResumTurmaViewModel
            {
                TurmaId = t.Id,
                NomeTurma = t.NomeExibicao,
                TotalAlunos = t.Alunos.Count,
                AtividadesPendentes = t.Secoes
                    .SelectMany(s => s.Atividades)
                    .Count(a => a.Prazo.HasValue && a.Prazo > DateTime.Now),
                EntregasPendenteCorrecao = t.Secoes
                    .SelectMany(s => s.Atividades)
                    .SelectMany(a => a.Entregas)
                    .Count(e => !e.Corrigida),
                QuizzesAtivos = t.Quizzes.Count
            }).ToList();

            return View(new VisaoGeralViewModel { Turmas = resumo });
        }
    }
}
