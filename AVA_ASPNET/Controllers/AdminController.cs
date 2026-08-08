using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using AVA_ASPNET.Services;
using CsvHelper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ganss.Xss;

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

        // ── Painel ────────────────────────────────────────────────

        public async Task<IActionResult> Index()
        {
            ViewBag.TotalAlunos = await _db.Perfis.CountAsync(p => p.TipoUsuario == "Aluno" && p.Ativo);
            ViewBag.TotalAlunosInativos = await _db.Perfis.CountAsync(p => p.TipoUsuario == "Aluno" && !p.Ativo);
            ViewBag.TotalProfessores = await _db.Perfis.CountAsync(p => p.TipoUsuario == "Professor");
            ViewBag.TotalTurmas = await _db.Turmas.CountAsync();
            ViewBag.AnoLetivo = await _db.AnosLetivos.Where(a => a.Ativo).Select(a => a.Ano).FirstOrDefaultAsync();
            return View();
        }

        // ── Usuários ──────────────────────────────────────────────

        public async Task<IActionResult> Usuarios()
        {
            var perfis = await _db.Perfis
                .Include(p => p.Usuario)
                .Include(p => p.Turma)
                .OrderBy(p => p.TipoUsuario)
                .ThenBy(p => p.NomeCompleto)
                .ToListAsync();
            return View(perfis);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ExcluirUsuario(int perfilId)
        {
            var perfil = await _db.Perfis.FindAsync(perfilId);
            if (perfil == null) return NotFound();

            var userAtual = await _userManager.GetUserAsync(User);
            if (perfil.UserId == userAtual?.Id)
            {
                TempData["Erro"] = "Você não pode excluir sua própria conta.";
                return RedirectToAction(nameof(Usuarios));
            }

            if (perfil.TipoUsuario == "Professor")
            {
                var turmasDoProf = await _db.Turmas
                    .Where(t => t.ProfessorId == perfil.Id)
                    .ToListAsync();

                var adminPerfil = await _db.Perfis.FirstAsync(p => p.TipoUsuario == "Admin");
                foreach (var turma in turmasDoProf)
                    turma.ProfessorId = adminPerfil.Id;

                await _db.SaveChangesAsync();
            }

            var userId = perfil.UserId;
            var nome = perfil.NomeCompleto;

            _db.Perfis.Remove(perfil);
            await _db.SaveChangesAsync();

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
                await _userManager.DeleteAsync(user);

            TempData["Sucesso"] = $"Usuário {nome} excluído.";
            return RedirectToAction(nameof(Usuarios));
        }

        // ── Criar professor ───────────────────────────────────────

        [HttpGet]
        public IActionResult CriarProfessor() => View(new CriarProfessorViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CriarProfessor(CriarProfessorViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var userExistente = await _userManager.FindByEmailAsync(model.Email);
            if (userExistente != null)
            {
                ModelState.AddModelError("Email", "Este e-mail já está cadastrado.");
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
                PrimeiroAcesso = false,
                Ativo = true
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Professor {model.NomeCompleto} cadastrado!";
            return RedirectToAction(nameof(Usuarios));
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

        [HttpGet]
        public IActionResult CriarTurma() => View(new TurmaViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CriarTurma(TurmaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var anoAtivo = await _db.AnosLetivos
                .Where(a => a.Ativo).Select(a => a.Ano).FirstOrDefaultAsync();

            var adminPerfil = await _db.Perfis.FirstAsync(p => p.TipoUsuario == "Admin");

            var turma = new Turma
            {
                Codigo = model.Codigo.ToUpper(),
                Descricao = model.Descricao,
                Ano = model.Ano,
                AnoLetivo = anoAtivo > 0 ? anoAtivo : DateTime.Now.Year,
                ProfessorId = adminPerfil.Id
            };
            _db.Turmas.Add(turma);
            await _db.SaveChangesAsync();

            var secoesPadrao = new[]
            {
                ("1º Bimestre", "Completa"),
                ("2º Bimestre", "Completa"),
                ("3º Bimestre", "Completa"),
                ("4º Bimestre", "Completa")
            };

            for (int i = 0; i < secoesPadrao.Length; i++)
            {
                _db.Secoes.Add(new Secao
                {
                    Nome = secoesPadrao[i].Item1,
                    Tipo = secoesPadrao[i].Item2,
                    Ordem = i,
                    TurmaId = turma.Id
                });
            }
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Turma {model.Codigo.ToUpper()} criada!";
            return RedirectToAction(nameof(Turmas));
        }

        [HttpGet]
        public async Task<IActionResult> EditarTurma(int id)
        {
            var turma = await _db.Turmas.FindAsync(id);
            if (turma == null) return NotFound();

            return View(new TurmaViewModel
            {
                Id = turma.Id,
                Codigo = turma.Codigo,
                Descricao = turma.Descricao,
                Ano = turma.Ano
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarTurma(TurmaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var turma = await _db.Turmas.FindAsync(model.Id);
            if (turma == null) return NotFound();

            turma.Codigo = model.Codigo.ToUpper();
            turma.Descricao = model.Descricao;
            turma.Ano = model.Ano;

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = "Turma atualizada!";
            return RedirectToAction(nameof(Turmas));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ExcluirTurma(int id)
        {
            var turma = await _db.Turmas
                .Include(t => t.Alunos)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (turma == null) return NotFound();

            foreach (var aluno in turma.Alunos)
            {
                aluno.TurmaId = null;
                aluno.Ativo = false;
            }

            _db.Turmas.Remove(turma);
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Turma {turma.Codigo} excluída.";
            return RedirectToAction(nameof(Turmas));
        }

        // ── Associar professor ────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> AssociarProfessor(int turmaId)
        {
            var turma = await _db.Turmas.Include(t => t.Professor)
                .FirstOrDefaultAsync(t => t.Id == turmaId);
            if (turma == null) return NotFound();

            var professores = await _db.Perfis
                .Where(p => p.TipoUsuario == "Professor")
                .OrderBy(p => p.NomeCompleto)
                .ToListAsync();

            return View(new AssociarProfessorViewModel
            {
                TurmaId = turmaId,
                NomeTurma = turma.NomeExibicao,
                ProfessorId = turma.ProfessorId,
                ProfessoresDisponiveis = professores
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AssociarProfessor(AssociarProfessorViewModel model)
        {
            var turma = await _db.Turmas.FindAsync(model.TurmaId);
            if (turma == null) return NotFound();

            turma.ProfessorId = model.ProfessorId;
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Professor associado com sucesso!";
            return RedirectToAction(nameof(Turmas));
        }

        // ── Importar alunos ───────────────────────────────────────

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

            var extensao = Path.GetExtension(model.ArquivoCSV.FileName).ToLower();
            if (extensao != ".csv")
            {
                ModelState.AddModelError("ArquivoCSV", "Apenas arquivos .csv são aceitos.");
                return View(model);
            }

            var config = new CsvHelper.Configuration.CsvConfiguration(System.Globalization.CultureInfo.InvariantCulture)
            {
                Delimiter = ";",
                HeaderValidated = null,
                MissingFieldFound = null
            };

            using var stream = model.ArquivoCSV.OpenReadStream();
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
            using var reader = new StreamReader(stream, System.Text.Encoding.GetEncoding("windows-1252"), detectEncodingFromByteOrderMarks: true);
            using var csv = new CsvHelper.CsvReader(reader, config);

            var records = csv.GetRecords<LinhaCsvDto>().ToList();

            int criados = 0, reativados = 0, ignorados = 0;

            foreach (var record in records)
            {
                if (string.IsNullOrWhiteSpace(record.Matricula) ||
                    string.IsNullOrWhiteSpace(record.NomeAluno))
                { ignorados++; continue; }

                var matricula = record.Matricula.Trim();
                var userExistente = await _userManager.FindByNameAsync(matricula);

                if (userExistente != null)
                {
                    var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == userExistente.Id);
                    if (perfil != null)
                    {
                        perfil.TurmaId = model.TurmaId;
                        perfil.Ativo = true;
                        perfil.NomeCompleto = record.NomeAluno.Trim();
                        reativados++;
                    }
                }
                else
                {
                    var user = new IdentityUser
                    {
                        UserName = matricula,
                        Email = $"{matricula}@aluno.quantumpinheiral.ifrj.edu.br",
                        EmailConfirmed = true
                    };

                    var result = await _userManager.CreateAsync(user, "[Aluno@123]");
                    if (!result.Succeeded) { ignorados++; continue; }

                    await _userManager.AddToRoleAsync(user, "Aluno");
                    _db.Perfis.Add(new Perfil
                    {
                        UserId = user.Id,
                        TipoUsuario = "Aluno",
                        NomeCompleto = record.NomeAluno.Trim(),
                        Matricula = matricula,
                        PrimeiroAcesso = true,
                        Ativo = true,
                        TurmaId = model.TurmaId
                    });
                    criados++;
                }
            }

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = $"{criados} novo(s), {reativados} reativado(s), {ignorados} ignorado(s).";
            return RedirectToAction(nameof(Turmas));
        }

        // ── Ano letivo ────────────────────────────────────────────

        [HttpGet]
        public IActionResult IniciarAnoLetivo() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> IniciarAnoLetivo(int ano)
        {
            var alunos = await _db.Perfis.Where(p => p.TipoUsuario == "Aluno").ToListAsync();
            foreach (var aluno in alunos)
            {
                aluno.TurmaId = null;
                aluno.Ativo = false;
            }

            var anoAtivo = await _db.AnosLetivos.FirstOrDefaultAsync(a => a.Ativo);
            if (anoAtivo != null) anoAtivo.Ativo = false;

            _db.AnosLetivos.Add(new AnoLetivo { Ano = ano, Ativo = true });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Ano letivo {ano} iniciado!";
            return RedirectToAction(nameof(Index));
        }

        // ── Notícias ──────────────────────────────────────────────

        public async Task<IActionResult> Noticias()
        {
            var noticias = await _db.Noticias
                .Include(n => n.Autor)
                .OrderByDescending(n => n.DataPublicacao)
                .ToListAsync();
            return View(noticias);
        }

        [HttpGet]
        public IActionResult CriarNoticia() => View(new NoticiaViewModel());

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CriarNoticia(NoticiaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var user = await _userManager.GetUserAsync(User);
            var perfil = await _db.Perfis.FirstOrDefaultAsync(p => p.UserId == user!.Id);

            var sanitizer = new HtmlSanitizer();
            model.Conteudo = sanitizer.Sanitize(model.Conteudo);

            string? imagemUrl = null;
            if (model.ImagemCapa != null && model.ImagemCapa.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.ImagemCapa))
                {
                    ModelState.AddModelError("ImagemCapa", "Imagem de capa inválida.");
                    return View(model);
                }
                imagemUrl = await SalvarImagemAsync(model.ImagemCapa);
            }

            string? imagemCardUrl = null;
            if (model.ImagemCard != null && model.ImagemCard.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.ImagemCard))
                {
                    ModelState.AddModelError("ImagemCard", "Imagem do card inválida.");
                    return View(model);
                }
                imagemCardUrl = await SalvarImagemAsync(model.ImagemCard);
            }

            _db.Noticias.Add(new Noticia
            {
                Titulo = model.Titulo,
                Resumo = model.Resumo,
                Conteudo = model.Conteudo,
                ImagemUrl = imagemUrl,
                ImagemCardUrl = imagemCardUrl,
                AutorId = perfil!.Id,
                DataPublicacao = DateTime.Now,
                Publicada = model.Publicada,
                Destaque = model.Destaque,
                Card = model.Card,
                CorTitulo = model.CorTitulo
            });

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = model.Publicada ? "Notícia publicada!" : "Rascunho salvo!";
            return RedirectToAction(nameof(Noticias));
        }

        [HttpGet]
        public async Task<IActionResult> EditarNoticia(int id)
        {
            var noticia = await _db.Noticias.FindAsync(id);
            if (noticia == null) return NotFound();

            return View(new NoticiaViewModel
            {
                Id = noticia.Id,
                Titulo = noticia.Titulo,
                Resumo = noticia.Resumo,
                Conteudo = noticia.Conteudo,
                ImagemUrlAtual = noticia.ImagemUrl,
                ImagemCardUrlAtual = noticia.ImagemCardUrl,
                Publicada = noticia.Publicada,
                Destaque = noticia.Destaque,
                Card = noticia.Card,
                CorTitulo = noticia.CorTitulo
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarNoticia(NoticiaViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var noticia = await _db.Noticias.FindAsync(model.Id);
            if (noticia == null) return NotFound();

            var sanitizer = new HtmlSanitizer();
            model.Conteudo = sanitizer.Sanitize(model.Conteudo);

            if (model.ImagemCapa != null && model.ImagemCapa.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.ImagemCapa))
                {
                    ModelState.AddModelError("ImagemCapa", "Imagem de capa inválida.");
                    return View(model);
                }
                noticia.ImagemUrl = await SalvarImagemAsync(model.ImagemCapa);
            }

            if (model.ImagemCard != null && model.ImagemCard.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.ImagemCard))
                {
                    ModelState.AddModelError("ImagemCard", "Imagem do card inválida.");
                    return View(model);
                }
                noticia.ImagemCardUrl = await SalvarImagemAsync(model.ImagemCard);
            }

            noticia.Titulo = model.Titulo;
            noticia.Resumo = model.Resumo;
            noticia.Conteudo = model.Conteudo;
            noticia.Publicada = model.Publicada;
            noticia.Destaque = model.Destaque;
            noticia.Card = model.Card;
            noticia.CorTitulo = model.CorTitulo;

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = "Notícia atualizada!";
            return RedirectToAction(nameof(Noticias));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ExcluirNoticia(int id)
        {
            var noticia = await _db.Noticias.FindAsync(id);
            if (noticia == null) return NotFound();

            if (!string.IsNullOrEmpty(noticia.ImagemUrl))
            {
                var caminhoFisico = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", noticia.ImagemUrl.TrimStart('/'));
                if (System.IO.File.Exists(caminhoFisico))
                    System.IO.File.Delete(caminhoFisico);
            }

            _db.Noticias.Remove(noticia);
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Notícia excluída.";
            return RedirectToAction(nameof(Noticias));
        }

        // ── Helper: salvar imagem ─────────────────────────────────

        private async Task<string> SalvarImagemAsync(IFormFile arquivo)
        {
            var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "imagens", "noticias");
            Directory.CreateDirectory(pasta);

            var nomeArquivo = $"{Guid.NewGuid()}{Path.GetExtension(arquivo.FileName)}";
            var caminho = Path.Combine(pasta, nomeArquivo);

            using var stream = new FileStream(caminho, FileMode.Create);
            await arquivo.CopyToAsync(stream);

            return $"/imagens/noticias/{nomeArquivo}";
        }
    }
}