using AVA_ASPNET.Data;
using AVA_ASPNET.Models;
using AVA_ASPNET.Models.Enums;
using AVA_ASPNET.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Controllers
{
    [Authorize]
    public class TurmaController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public TurmaController(AppDbContext db, UserManager<IdentityUser> userManager)
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

        // ── Página da turma ───────────────────────────────────────

        public async Task<IActionResult> Index(int turmaId)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            if (User.IsInRole(UsuarioRole.Aluno) && perfil.TurmaId != turmaId)
                return Forbid();

            var turma = await _db.Turmas
                .Include(t => t.Professor)
                .Include(t => t.Alunos.Where(a => a.Ativo))
                .Include(t => t.Avisos.OrderByDescending(a => a.DataPublicacao))
                    .ThenInclude(a => a.Autor)
                .Include(t => t.Secoes.OrderBy(s => s.Ordem))
                    .ThenInclude(s => s.Publicacoes.OrderByDescending(p => p.DataPublicacao))
                        .ThenInclude(p => p.Autor)
                .Include(t => t.Secoes.OrderBy(s => s.Ordem))
                    .ThenInclude(s => s.Atividades.OrderByDescending(a => a.DataPublicacao))
                        .ThenInclude(a => a.Autor)
                .Include(t => t.Quizzes.Where(q => q.Ativo).OrderByDescending(q => q.DataPublicacao))
                    .ThenInclude(q => q.Autor)
                .Include(t => t.Quizzes.Where(q => q.Ativo).OrderByDescending(q => q.DataPublicacao))
                    .ThenInclude(q => q.Questoes)
                .FirstOrDefaultAsync(t => t.Id == turmaId);

            if (turma == null) return NotFound();

            var ehProfessor = User.IsInRole(UsuarioRole.Professor) ||
                              User.IsInRole(UsuarioRole.Admin);

            var atividadesEntregues = new HashSet<int>();
            var atividadesCorrigidas = new HashSet<int>();

            if (!ehProfessor)
            {
                var atividadeIds = turma.Secoes
                    .SelectMany(s => s.Atividades)
                    .Select(a => a.Id)
                    .ToList();

                var entregas = await _db.EntregasAtividade
                    .Where(e => e.AlunoId == perfil.Id && atividadeIds.Contains(e.AtividadeId))
                    .ToListAsync();

                var respostasAval = await _db.RespostasAtividade
                    .Where(r => r.AlunoId == perfil.Id && atividadeIds.Contains(r.AtividadeId))
                    .Select(r => r.AtividadeId)
                    .ToListAsync();

                atividadesEntregues = entregas.Select(e => e.AtividadeId)
                    .Concat(respostasAval)
                    .ToHashSet();

                atividadesCorrigidas = entregas
                    .Where(e => e.Corrigida)
                    .Select(e => e.AtividadeId)
                    .ToHashSet();
            }

            var turmasDoProfe = ehProfessor
                ? await _db.Turmas
                    .Include(t => t.Secoes)
                    .Where(t => t.ProfessorId == perfil!.Id && t.Id != turmaId)
                    .OrderBy(t => t.Ano).ThenBy(t => t.Codigo)
                    .ToListAsync()
                : new List<Turma>();

            return View(new TurmaPageViewModel
            {
                Turma = turma,
                Avisos = turma.Avisos.ToList(),
                Secoes = turma.Secoes.ToList(),
                Quizzes = turma.Quizzes.ToList(),
                EhProfessor = ehProfessor,
                AtividadesEntregues = atividadesEntregues,
                AtividadesCorrigidas = atividadesCorrigidas,
                TurmasDoProfe = turmasDoProfe
            });
        }

        // ── Painel ────────────────────────────────────────────────

        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> Painel(int turmaId)
        {
            var turma = await _db.Turmas
                .Include(t => t.Alunos.Where(a => a.Ativo))
                .Include(t => t.Secoes)
                    .ThenInclude(s => s.Atividades)
                        .ThenInclude(a => a.Entregas)
                .Include(t => t.Secoes)
                    .ThenInclude(s => s.Atividades)
                        .ThenInclude(a => a.Questoes)
                .Include(t => t.Quizzes.Where(q => q.Ativo))
                    .ThenInclude(q => q.Resultados)
                .FirstOrDefaultAsync(t => t.Id == turmaId);

            if (turma == null) return NotFound();

            var totalAlunos = turma.Alunos.Count;

            var atividadeIds = turma.Secoes
                .SelectMany(s => s.Atividades)
                .Select(a => a.Id)
                .ToList();

            var respostasAval = await _db.RespostasAtividade
                .Where(r => atividadeIds.Contains(r.AtividadeId))
                .ToListAsync();

            var atividades = turma.Secoes
                .SelectMany(s => s.Atividades)
                .Select(a => new PainelAtividadeViewModel
                {
                    AtividadeId = a.Id,
                    Titulo = a.Titulo,
                    Prazo = a.Prazo,
                    TotalAlunos = totalAlunos,
                    Entregaram = a.Tipo == "Avaliativa"
                        ? respostasAval.Count(r => r.AtividadeId == a.Id)
                        : a.Entregas.Count,
                    PendenteCorrecao = a.Tipo == "Avaliativa"
                        ? 0
                        : a.Entregas.Count(e => !e.Corrigida),
                    EmAtraso = a.Prazo.HasValue && a.Prazo < DateTime.Now
                        ? totalAlunos - (a.Tipo == "Avaliativa"
                            ? respostasAval.Count(r => r.AtividadeId == a.Id)
                            : a.Entregas.Count)
                        : 0
                }).ToList();

            var quizzes = turma.Quizzes
                .Select(q => new PainelQuizViewModel
                {
                    QuizId = q.Id,
                    Titulo = q.Titulo,
                    TotalAlunos = totalAlunos,
                    FizeramQuiz = q.Resultados.Select(r => r.AlunoId).Distinct().Count(),
                    MediaPontuacao = q.Resultados.Any()
                        ? Math.Round(q.Resultados
                            .GroupBy(r => r.AlunoId)
                            .Average(g => g.Max(r => r.Pontuacao)), 1)
                        : 0,
                    MelhorNota = q.Resultados.Any()
                        ? q.Resultados.GroupBy(r => r.AlunoId).Max(g => g.Max(r => r.Pontuacao))
                        : 0,
                    PiorNota = q.Resultados.Any()
                        ? q.Resultados.GroupBy(r => r.AlunoId).Min(g => g.Max(r => r.Pontuacao))
                        : 0
                }).ToList();

            return View(new PainelTurmaViewModel
            {
                Turma = turma,
                Atividades = atividades,
                Quizzes = quizzes
            });
        }

        // ── Mural de avisos ───────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> PostarAviso(int turmaId, string texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
            {
                TempData["Erro"] = "O aviso não pode estar vazio.";
                return RedirectToAction(nameof(Index), new { turmaId });
            }

            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            _db.Avisos.Add(new Aviso
            {
                Texto = texto.Trim(),
                TurmaId = turmaId,
                AutorId = perfil.Id,
                DataPublicacao = DateTime.Now
            });
            await _db.SaveChangesAsync();

            return RedirectToAction(nameof(Index), new { turmaId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> ExcluirAviso(int avisoId, int turmaId)
        {
            var aviso = await _db.Avisos.FindAsync(avisoId);
            if (aviso != null)
            {
                _db.Avisos.Remove(aviso);
                await _db.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index), new { turmaId });
        }

        // ── Seções ────────────────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarSecao(SecaoViewModel model)
        {
            if (!ModelState.IsValid)
            {
                TempData["Erro"] = "Nome da seção inválido.";
                return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
            }

            var ultimaOrdem = await _db.Secoes
                .Where(s => s.TurmaId == model.TurmaId)
                .MaxAsync(s => (int?)s.Ordem) ?? 0;

            _db.Secoes.Add(new Secao
            {
                Nome = model.Nome,
                Ordem = ultimaOrdem + 1,
                TurmaId = model.TurmaId,
                Tipo = model.Tipo
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Seção '{model.Nome}' criada!";
            return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> ExcluirSecao(int secaoId, int turmaId)
        {
            var secao = await _db.Secoes.FindAsync(secaoId);
            if (secao != null)
            {
                _db.Secoes.Remove(secao);
                await _db.SaveChangesAsync();
                TempData["Sucesso"] = "Seção excluída.";
            }
            return RedirectToAction(nameof(Index), new { turmaId });
        }

        // ── Publicações ───────────────────────────────────────────

        [HttpGet]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarPublicacao(int secaoId, int turmaId)
        {
            var secao = await _db.Secoes.FindAsync(secaoId);
            if (secao == null) return NotFound();

            return View(new PublicacaoViewModel
            {
                SecaoId = secaoId,
                TurmaId = turmaId,
                NomeSecao = secao.Nome
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarPublicacao(PublicacaoViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            string? url = null;
            string? nomeArquivo = null;

            if (model.Tipo == "Arquivo" && model.Arquivo != null && model.Arquivo.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.Arquivo))
                {
                    ModelState.AddModelError("Arquivo", "Arquivo inválido ou corrompido.");
                    return View(model);
                }
                var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "materiais");
                Directory.CreateDirectory(pasta);
                nomeArquivo = model.Arquivo.FileName;
                var nomeUnico = $"{Guid.NewGuid()}_{nomeArquivo}";
                var caminho = Path.Combine(pasta, nomeUnico);
                using var stream = new FileStream(caminho, FileMode.Create);
                await model.Arquivo.CopyToAsync(stream);
                url = $"/uploads/materiais/{nomeUnico}";
            }
            else if (model.Tipo == "Link")
            {
                url = model.Link;
            }

            _db.Publicacoes.Add(new Publicacao
            {
                Titulo = model.Titulo,
                Descricao = model.Descricao,
                Tipo = model.Tipo,
                Url = url,
                NomeArquivo = nomeArquivo,
                SecaoId = model.SecaoId,
                AutorId = perfil.Id,
                DataPublicacao = DateTime.Now
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Material publicado!";
            return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
        }

        [HttpGet]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> EditarPublicacao(int id, int turmaId)
        {
            var pub = await _db.Publicacoes.Include(p => p.Secao).FirstOrDefaultAsync(p => p.Id == id);
            if (pub == null) return NotFound();

            return View(new PublicacaoViewModel
            {
                Id = pub.Id,
                SecaoId = pub.SecaoId,
                TurmaId = turmaId,
                NomeSecao = pub.Secao?.Nome ?? "",
                Titulo = pub.Titulo,
                Descricao = pub.Descricao,
                Tipo = pub.Tipo,
                UrlAtual = pub.Url,
                NomeArquivoAtual = pub.NomeArquivo
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> EditarPublicacao(PublicacaoViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            var pub = await _db.Publicacoes.FindAsync(model.Id);
            if (pub == null) return NotFound();

            if (model.Tipo == "Arquivo" && model.Arquivo != null && model.Arquivo.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.Arquivo))
                {
                    ModelState.AddModelError("Arquivo", "Arquivo inválido ou corrompido.");
                    return View(model);
                }
                var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "materiais");
                Directory.CreateDirectory(pasta);
                var nomeUnico = $"{Guid.NewGuid()}_{model.Arquivo.FileName}";
                var caminho = Path.Combine(pasta, nomeUnico);
                using var stream = new FileStream(caminho, FileMode.Create);
                await model.Arquivo.CopyToAsync(stream);
                pub.Url = $"/uploads/materiais/{nomeUnico}";
                pub.NomeArquivo = model.Arquivo.FileName;
            }
            else if (model.Tipo == "Link")
            {
                pub.Url = model.Link;
                pub.NomeArquivo = null;
            }

            pub.Titulo = model.Titulo;
            pub.Descricao = model.Descricao;
            pub.Tipo = model.Tipo;

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = "Material atualizado!";
            return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> ExcluirPublicacao(int id, int turmaId)
        {
            var pub = await _db.Publicacoes.FindAsync(id);
            if (pub != null)
            {
                if (pub.Tipo == "Arquivo" && !string.IsNullOrEmpty(pub.Url))
                {
                    var caminho = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", pub.Url.TrimStart('/'));
                    if (System.IO.File.Exists(caminho))
                        System.IO.File.Delete(caminho);
                }
                _db.Publicacoes.Remove(pub);
                await _db.SaveChangesAsync();
                TempData["Sucesso"] = "Material excluído.";
            }
            return RedirectToAction(nameof(Index), new { turmaId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CopiarPublicacao(int publicacaoId, int secaoDestinoId, int turmaId)
        {
            var pub = await _db.Publicacoes.FindAsync(publicacaoId);
            if (pub == null) return NotFound();

            _db.Publicacoes.Add(new Publicacao
            {
                Titulo = pub.Titulo,
                Descricao = pub.Descricao,
                Tipo = pub.Tipo,
                Url = pub.Url,
                NomeArquivo = pub.NomeArquivo,
                SecaoId = secaoDestinoId,
                AutorId = pub.AutorId,
                DataPublicacao = DateTime.Now
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Material copiado com sucesso!";
            return RedirectToAction(nameof(Index), new { turmaId });
        }

        // ── Atividades ────────────────────────────────────────────

        [HttpGet]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarAtividade(int secaoId, int turmaId)
        {
            var secao = await _db.Secoes.FindAsync(secaoId);
            if (secao == null) return NotFound();

            return View(new AtividadeViewModel
            {
                SecaoId = secaoId,
                TurmaId = turmaId,
                NomeSecao = secao.Nome,
                Prazo = DateTime.Now.AddDays(7)
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarAtividade(AtividadeViewModel model)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            string? arquivoUrl = null;
            string? nomeArquivo = null;

            if (model.Arquivo != null && model.Arquivo.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.Arquivo))
                {
                    ModelState.AddModelError("Arquivo", "Arquivo inválido ou corrompido.");
                    return View(model);
                }
                var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "atividades");
                Directory.CreateDirectory(pasta);
                nomeArquivo = model.Arquivo.FileName;
                var nomeUnico = $"{Guid.NewGuid()}_{nomeArquivo}";
                var caminho = Path.Combine(pasta, nomeUnico);
                using var stream = new FileStream(caminho, FileMode.Create);
                await model.Arquivo.CopyToAsync(stream);
                arquivoUrl = $"/uploads/atividades/{nomeUnico}";
            }

            var atividade = new Atividade
            {
                Titulo = model.Titulo,
                Descricao = model.Descricao,
                ArquivoUrl = arquivoUrl,
                NomeArquivo = nomeArquivo,
                Prazo = model.Prazo,
                ValorMaximo = model.ValorMaximo,
                Tipo = model.Tipo,
                SecaoId = model.SecaoId,
                AutorId = perfil.Id,
                DataPublicacao = DateTime.Now
            };

            if (model.Tipo == "Avaliativa")
            {
                for (int i = 0; i < model.Questoes.Count; i++)
                {
                    var q = model.Questoes[i];
                    if (string.IsNullOrWhiteSpace(q.Enunciado)) continue;

                    var questao = new QuestaoAtividade
                    {
                        Enunciado = q.Enunciado,
                        Ordem = i
                    };

                    if (q.Imagem != null && q.Imagem.Length > 0)
                    {
                        if (!FileValidationService.ValidarArquivo(q.Imagem))
                        {
                            ModelState.AddModelError(string.Empty, $"Questão {i + 1}: imagem inválida.");
                            return View(model);
                        }
                        var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "atividades");
                        Directory.CreateDirectory(pasta);
                        var nomeUnico = $"{Guid.NewGuid()}{Path.GetExtension(q.Imagem.FileName)}";
                        var caminho = Path.Combine(pasta, nomeUnico);
                        using var stream = new FileStream(caminho, FileMode.Create);
                        await q.Imagem.CopyToAsync(stream);
                        questao.ImagemUrl = $"/uploads/atividades/{nomeUnico}";
                    }

                    for (int ai = 0; ai < q.Alternativas.Count; ai++)
                    {
                        var alt = q.Alternativas[ai];
                        if (string.IsNullOrWhiteSpace(alt.Texto)) continue;
                        questao.Alternativas.Add(new AlternativaAtividade
                        {
                            Texto = alt.Texto,
                            Correta = alt.Correta
                        });
                    }

                    atividade.Questoes.Add(questao);
                }
            }

            _db.Atividades.Add(atividade);
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Atividade publicada!";
            return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
        }

        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> VerAtividade(int atividadeId, int turmaId)
        {
            var atividade = await _db.Atividades
                .Include(a => a.Autor)
                .Include(a => a.Entregas)
                    .ThenInclude(e => e.Aluno)
                .Include(a => a.Questoes)
                .FirstOrDefaultAsync(a => a.Id == atividadeId);

            if (atividade == null) return NotFound();

            if (atividade.Tipo == "Avaliativa")
            {
                var respostas = await _db.RespostasAtividade
                    .Include(r => r.Aluno)
                    .Where(r => r.AtividadeId == atividadeId)
                    .ToListAsync();

                ViewBag.Respostas = respostas;
            }

            ViewBag.TurmaId = turmaId;
            return View(atividade);
        }

        [HttpGet]
        [Authorize(Roles = "Aluno")]
        public async Task<IActionResult> EntregarAtividade(int atividadeId, int turmaId)
        {
            var atividade = await _db.Atividades
                .Include(a => a.Entregas)
                .FirstOrDefaultAsync(a => a.Id == atividadeId);

            if (atividade == null) return NotFound();

            var perfil = await GetPerfilAtualAsync();
            var entregaExistente = atividade.Entregas.FirstOrDefault(e => e.AlunoId == perfil!.Id);

            return View(new EntregarAtividadeViewModel
            {
                AtividadeId = atividadeId,
                TurmaId = turmaId,
                TituloAtividade = atividade.Titulo,
                DescricaoAtividade = atividade.Descricao,
                Prazo = atividade.Prazo,
                ValorMaximo = atividade.ValorMaximo,
                ArquivoAtividadeUrl = atividade.ArquivoUrl,
                EntregaExistente = entregaExistente
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Aluno")]
        public async Task<IActionResult> EntregarAtividade(EntregarAtividadeViewModel model)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            var entregaExistente = await _db.EntregasAtividade
                .FirstOrDefaultAsync(e => e.AtividadeId == model.AtividadeId && e.AlunoId == perfil.Id);

            if (entregaExistente != null && entregaExistente.Corrigida)
            {
                TempData["Erro"] = "Esta atividade já foi corrigida e não pode ser reenviada.";
                return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
            }

            string? arquivoUrl = null;
            string? nomeArquivo = null;

            if (model.Arquivo != null && model.Arquivo.Length > 0)
            {
                if (!FileValidationService.ValidarArquivo(model.Arquivo))
                {
                    ModelState.AddModelError("Arquivo", "Arquivo inválido ou corrompido.");
                    return View(model);
                }
                var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "entregas");
                Directory.CreateDirectory(pasta);
                nomeArquivo = model.Arquivo.FileName;
                var nomeUnico = $"{Guid.NewGuid()}_{nomeArquivo}";
                var caminho = Path.Combine(pasta, nomeUnico);
                using var stream = new FileStream(caminho, FileMode.Create);
                await model.Arquivo.CopyToAsync(stream);
                arquivoUrl = $"/uploads/entregas/{nomeUnico}";
            }

            if (entregaExistente != null)
            {
                if (arquivoUrl != null) { entregaExistente.ArquivoUrl = arquivoUrl; entregaExistente.NomeArquivo = nomeArquivo; }
                if (model.TextoResposta != null) entregaExistente.TextoResposta = model.TextoResposta;
                entregaExistente.DataEntrega = DateTime.Now;
                entregaExistente.Corrigida = false;
            }
            else
            {
                _db.EntregasAtividade.Add(new EntregaAtividade
                {
                    AtividadeId = model.AtividadeId,
                    AlunoId = perfil.Id,
                    ArquivoUrl = arquivoUrl,
                    NomeArquivo = nomeArquivo,
                    TextoResposta = model.TextoResposta,
                    DataEntrega = DateTime.Now
                });
            }

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = "Atividade entregue!";
            return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
        }

        [HttpGet]
        [Authorize(Roles = "Aluno")]
        public async Task<IActionResult> ResponderAtividadeAval(int atividadeId, int turmaId)
        {
            var atividade = await _db.Atividades
                .Include(a => a.Questoes.OrderBy(q => q.Ordem))
                    .ThenInclude(q => q.Alternativas)
                .FirstOrDefaultAsync(a => a.Id == atividadeId && a.Tipo == "Avaliativa");

            if (atividade == null) return NotFound();

            var perfil = await GetPerfilAtualAsync();

            var jaRespondeu = await _db.RespostasAtividade
                .AnyAsync(r => r.AtividadeId == atividadeId && r.AlunoId == perfil!.Id);

            if (jaRespondeu)
            {
                TempData["Erro"] = "Você já respondeu esta atividade.";
                return RedirectToAction(nameof(Index), new { turmaId });
            }

            return View(new ResponderAtividadeAvalViewModel
            {
                AtividadeId = atividadeId,
                TurmaId = turmaId,
                Titulo = atividade.Titulo,
                Descricao = atividade.Descricao,
                Prazo = atividade.Prazo,
                ValorMaximo = atividade.ValorMaximo,
                Questoes = atividade.Questoes.Select(q => new QuestaoResponderAtivViewModel
                {
                    QuestaoId = q.Id,
                    Enunciado = q.Enunciado,
                    ImagemUrl = q.ImagemUrl,
                    Alternativas = q.Alternativas.Select(a => new AlternativaResponderAtivViewModel
                    {
                        AlternativaId = a.Id,
                        Texto = a.Texto
                    }).ToList()
                }).ToList()
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = "Aluno")]
        public async Task<IActionResult> ResponderAtividadeAval(ResponderAtividadeAvalViewModel model)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            var atividade = await _db.Atividades
                .Include(a => a.Questoes)
                    .ThenInclude(q => q.Alternativas)
                .FirstOrDefaultAsync(a => a.Id == model.AtividadeId);

            if (atividade == null) return NotFound();

            var jaRespondeu = await _db.RespostasAtividade
                .AnyAsync(r => r.AtividadeId == model.AtividadeId && r.AlunoId == perfil.Id);

            if (jaRespondeu)
            {
                TempData["Erro"] = "Você já respondeu esta atividade.";
                return RedirectToAction(nameof(Index), new { turmaId = model.TurmaId });
            }

            int acertos = 0;
            var questoesResultado = new List<QuestaoResultadoAtivViewModel>();

            foreach (var qResp in model.Questoes)
            {
                var questao = atividade.Questoes.FirstOrDefault(q => q.Id == qResp.QuestaoId);
                if (questao == null) continue;

                var alternativaCorreta = questao.Alternativas.FirstOrDefault(a => a.Correta);
                var alternativaEscolhida = questao.Alternativas
                    .FirstOrDefault(a => a.Id == qResp.AlternativaSelecionada);

                bool acertou = alternativaEscolhida?.Correta == true;
                if (acertou) acertos++;

                questoesResultado.Add(new QuestaoResultadoAtivViewModel
                {
                    Enunciado = questao.Enunciado,
                    AlternativaEscolhida = alternativaEscolhida?.Texto ?? "Não respondida",
                    AlternativaCorreta = alternativaCorreta?.Texto ?? "",
                    Acertou = acertou
                });
            }

            decimal nota = atividade.Questoes.Count > 0
                ? Math.Round((decimal)acertos / atividade.Questoes.Count * atividade.ValorMaximo, 1)
                : 0;

            _db.RespostasAtividade.Add(new RespostaAtividade
            {
                AtividadeId = model.AtividadeId,
                AlunoId = perfil.Id,
                TotalQuestoes = atividade.Questoes.Count,
                TotalAcertos = acertos,
                Nota = nota,
                DataResposta = DateTime.Now
            });
            await _db.SaveChangesAsync();

            return View("ResultadoAtividadeAval", new ResultadoAtividadeAvalViewModel
            {
                AtividadeId = model.AtividadeId,
                TurmaId = model.TurmaId,
                Titulo = atividade.Titulo,
                TotalQuestoes = atividade.Questoes.Count,
                TotalAcertos = acertos,
                Nota = nota,
                ValorMaximo = atividade.ValorMaximo,
                Questoes = questoesResultado
            });
        }

        [HttpGet]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CorrigirEntrega(int entregaId, int turmaId)
        {
            var entrega = await _db.EntregasAtividade
                .Include(e => e.Aluno)
                .Include(e => e.Atividade)
                .FirstOrDefaultAsync(e => e.Id == entregaId);

            if (entrega == null) return NotFound();

            return View(new CorrigirEntregaViewModel
            {
                EntregaId = entregaId,
                TurmaId = turmaId,
                NomeAluno = entrega.Aluno?.NomeCompleto ?? "",
                TituloAtividade = entrega.Atividade?.Titulo ?? "",
                ArquivoUrl = entrega.ArquivoUrl,
                NomeArquivo = entrega.NomeArquivo,
                TextoResposta = entrega.TextoResposta,
                DataEntrega = entrega.DataEntrega,
                ValorMaximo = entrega.Atividade?.ValorMaximo ?? 10,
                Nota = entrega.Nota,
                Feedback = entrega.Feedback
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CorrigirEntrega(CorrigirEntregaViewModel model)
        {
            var entrega = await _db.EntregasAtividade.FindAsync(model.EntregaId);
            if (entrega == null) return NotFound();

            entrega.Nota = model.Nota;
            entrega.Feedback = model.Feedback;
            entrega.Corrigida = true;

            await _db.SaveChangesAsync();
            TempData["Sucesso"] = "Entrega corrigida!";
            return RedirectToAction(nameof(VerAtividade),
                new { atividadeId = entrega.AtividadeId, turmaId = model.TurmaId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CopiarAtividade(int atividadeId, int secaoDestinoId, int turmaId)
        {
            var ativ = await _db.Atividades.FindAsync(atividadeId);
            if (ativ == null) return NotFound();

            _db.Atividades.Add(new Atividade
            {
                Titulo = ativ.Titulo,
                Descricao = ativ.Descricao,
                ArquivoUrl = ativ.ArquivoUrl,
                NomeArquivo = ativ.NomeArquivo,
                Prazo = ativ.Prazo,
                ValorMaximo = ativ.ValorMaximo,
                Tipo = ativ.Tipo,
                SecaoId = secaoDestinoId,
                AutorId = ativ.AutorId,
                DataPublicacao = DateTime.Now
            });
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Atividade copiada com sucesso!";
            return RedirectToAction(nameof(Index), new { turmaId });
        }
    }
}
