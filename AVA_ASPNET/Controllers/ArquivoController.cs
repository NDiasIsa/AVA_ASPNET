using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using AVA_ASPNET.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize]
    public class ArquivoController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IWebHostEnvironment _env;

        public ArquivoController(AppDbContext db, UserManager<IdentityUser> userManager, IWebHostEnvironment env)
        {
            _db = db;
            _userManager = userManager;
            _env = env;
        }

        private async Task<Perfil?> GetPerfilAtualAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return null;
            return await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user.Id);
        }

        // ── Servir entrega do aluno ───────────────────────────────
        // Só o próprio aluno e o professor da turma podem acessar

        public async Task<IActionResult> Entrega(int entregaId)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return Forbid();

            var entrega = await _db.EntregasAtividade
                .Include(e => e.Atividade)
                    .ThenInclude(a => a!.Secao)
                        .ThenInclude(s => s!.Turma)
                .FirstOrDefaultAsync(e => e.Id == entregaId);

            if (entrega == null) return NotFound();

            var turma = entrega.Atividade?.Secao?.Turma;
            if (turma == null) return NotFound();

            bool ehProfessorDaTurma = User.IsInRole(UsuarioRole.Admin) ||
                                      (User.IsInRole(UsuarioRole.Professor) && turma.ProfessorId == perfil.Id);
            bool ehOProprioAluno = entrega.AlunoId == perfil.Id;

            if (!ehProfessorDaTurma && !ehOProprioAluno)
                return Forbid();

            if (string.IsNullOrEmpty(entrega.ArquivoUrl))
                return NotFound();

            var caminhoFisico = Path.Combine(_env.WebRootPath, entrega.ArquivoUrl.TrimStart('/'));
            if (!System.IO.File.Exists(caminhoFisico))
                return NotFound();

            var contentType = GetContentType(entrega.NomeArquivo ?? "arquivo");
            return PhysicalFile(caminhoFisico, contentType, entrega.NomeArquivo);
        }

        // ── Servir material/atividade da turma ────────────────────
        // Qualquer usuário logado da turma pode acessar

        public async Task<IActionResult> Material(int publicacaoId)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return Forbid();

            var pub = await _db.Publicacoes
                .Include(p => p.Secao)
                    .ThenInclude(s => s!.Turma)
                .FirstOrDefaultAsync(p => p.Id == publicacaoId);

            if (pub == null) return NotFound();

            var turma = pub.Secao?.Turma;
            if (turma == null) return NotFound();

            bool temAcesso = User.IsInRole(UsuarioRole.Admin) ||
                             (User.IsInRole(UsuarioRole.Professor) && turma.ProfessorId == perfil.Id) ||
                             (User.IsInRole(UsuarioRole.Aluno) && perfil.TurmaId == turma.Id);

            if (!temAcesso) return Forbid();

            if (string.IsNullOrEmpty(pub.Url))
                return NotFound();

            var caminhoFisico = Path.Combine(_env.WebRootPath, pub.Url.TrimStart('/'));
            if (!System.IO.File.Exists(caminhoFisico))
                return NotFound();

            var contentType = GetContentType(pub.NomeArquivo ?? "arquivo");
            return PhysicalFile(caminhoFisico, contentType, pub.NomeArquivo);
        }

        private static string GetContentType(string nomeArquivo)
        {
            var ext = Path.GetExtension(nomeArquivo).ToLower();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".mp4" => "video/mp4",
                ".zip" => "application/zip",
                _ => "application/octet-stream"
            };
        }
    }
}