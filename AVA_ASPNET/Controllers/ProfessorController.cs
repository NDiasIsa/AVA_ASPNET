using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize(Roles = "Professor,Admin")]
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

            if (User.IsInRole("Admin"))
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

        // ── Criar turma ───────────────────────────────────────────

        [HttpGet]
        public IActionResult CriarTurma() => View(new TurmaViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CriarTurma(TurmaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            _db.Turmas.Add(new Turma
            {
                Codigo = model.Codigo.ToUpper(),
                Descricao = model.Descricao,
                Ano = model.Ano,
                AnoLetivo = model.AnoLetivo,
                ProfessorId = perfil.Id
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Turma {model.Codigo.ToUpper()} criada!";
            return RedirectToAction(nameof(MinhasTurmas));
        }

        // ── Importar alunos por lista CSV ─────────────────────────

        [HttpGet]
        public async Task<IActionResult> ImportarAlunos(int turmaId)
        {
            var turma = await _db.Turmas.FindAsync(turmaId);
            if (turma == null) return NotFound();

            return View(new ImportarAlunosViewModel
            {
                TurmaId = turmaId,
                NomeTurma = turma.NomeExibicao
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ImportarAlunos(ImportarAlunosViewModel model)
        {
            var turma = await _db.Turmas.FindAsync(model.TurmaId);
            if (turma == null) return NotFound();
            model.NomeTurma = turma.NomeExibicao;

            if (!ModelState.IsValid) return View(model);

            int importados = 0, ignorados = 0;
            var linhas = model.ListaCSV
                .Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var linha in linhas)
            {
                var partes = linha.Trim().Split(';');
                if (partes.Length < 2) { ignorados++; continue; }

                var nome = partes[0].Trim();
                var matricula = partes[1].Trim();

                if (string.IsNullOrEmpty(nome) || string.IsNullOrEmpty(matricula))
                { ignorados++; continue; }

                // Já existe?
                if (await _userManager.FindByNameAsync(matricula) != null)
                { ignorados++; continue; }

                // Criar IdentityUser com username = matrícula
                // Senha temporária bloqueada — aluno define no primeiro acesso
                var user = new IdentityUser
                {
                    UserName = matricula,
                    Email = $"{matricula}@aluno.quantumpinheiral.ifrj.edu.br",
                    EmailConfirmed = true
                };

                // Senha temporária: matrícula + "@Qp" (será trocada no primeiro acesso)
                var senhaTemp = $"{matricula}@Qp1";
                var result = await _userManager.CreateAsync(user, senhaTemp);
                if (!result.Succeeded) { ignorados++; continue; }

                await _userManager.AddToRoleAsync(user, "Aluno");
                _db.Perfis.Add(new Perfil
                {
                    UserId = user.Id,
                    TipoUsuario = "Aluno",
                    NomeCompleto = nome,
                    Matricula = matricula,
                    PrimeiroAcesso = true,  // vai definir senha no primeiro login
                    TurmaId = model.TurmaId
                });
                importados++;
            }

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = $"{importados} aluno(s) importado(s). {ignorados} linha(s) ignorada(s) (duplicata ou formato inválido).";
            return RedirectToAction(nameof(MinhasTurmas));
        }

        // ── Alunos da turma ───────────────────────────────────────

        public async Task<IActionResult> AlunosDaTurma(int turmaId)
        {
            var turma = await _db.Turmas
                .Include(t => t.Alunos)
                .FirstOrDefaultAsync(t => t.Id == turmaId);

            if (turma == null) return NotFound();
            return View(turma);
        }
    }
}
