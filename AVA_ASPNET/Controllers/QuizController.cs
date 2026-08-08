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
    public class QuizController : Controller
    {
        private readonly AppDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public QuizController(AppDbContext db, UserManager<IdentityUser> userManager)
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

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CriarQuiz(QuizViewModel model)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            var quiz = new Quiz
            {
                Titulo = model.Titulo,
                Descricao = model.Descricao,
                TurmaId = model.TurmaId,
                AutorId = perfil.Id,
                Ativo = model.Ativo,
                DataPublicacao = DateTime.Now
            };

            for (int i = 0; i < model.Questoes.Count; i++)
            {
                var q = model.Questoes[i];
                if (string.IsNullOrWhiteSpace(q.Enunciado)) continue;

                var questao = new Questao
                {
                    Enunciado = q.Enunciado,
                    Explicacao = q.Explicacao,
                    TipoExplicacao = q.TipoExplicacao,
                    Ordem = i
                };

                // Salva imagem do enunciado
                if (q.Imagem != null && q.Imagem.Length > 0)
                {
                    if (!FileValidationService.ValidarArquivo(q.Imagem))
                    {
                        ModelState.AddModelError(string.Empty, $"Questão {i + 1}: imagem do enunciado inválida.");
                        return View(model);
                    }
                    var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "quiz");
                    Directory.CreateDirectory(pasta);
                    var nomeUnico = $"{Guid.NewGuid()}{Path.GetExtension(q.Imagem.FileName)}";
                    var caminho = Path.Combine(pasta, nomeUnico);
                    using var stream = new FileStream(caminho, FileMode.Create);
                    await q.Imagem.CopyToAsync(stream);
                    questao.ImagemUrl = $"/uploads/quiz/{nomeUnico}";
                }

                // Salva mídia da explicação
                if (q.TipoExplicacao == "Imagem" && q.ExplicacaoImagem != null && q.ExplicacaoImagem.Length > 0)
                {
                    if (!FileValidationService.ValidarArquivo(q.ExplicacaoImagem))
                    {
                        ModelState.AddModelError(string.Empty, $"Questão {i + 1}: imagem da explicação inválida.");
                        return View(model);
                    }
                    var pasta = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "quiz");
                    Directory.CreateDirectory(pasta);
                    var nomeUnico = $"exp_{Guid.NewGuid()}{Path.GetExtension(q.ExplicacaoImagem.FileName)}";
                    var caminho = Path.Combine(pasta, nomeUnico);
                    using var stream = new FileStream(caminho, FileMode.Create);
                    await q.ExplicacaoImagem.CopyToAsync(stream);
                    questao.ExplicacaoMidiaUrl = $"/uploads/quiz/{nomeUnico}";
                }
                else if (q.TipoExplicacao == "Video")
                {
                    questao.ExplicacaoMidiaUrl = q.ExplicacaoVideoUrl;
                }

                for (int ai = 0; ai < q.Alternativas.Count; ai++)
                {
                    var alt = q.Alternativas[ai];
                    if (string.IsNullOrWhiteSpace(alt.Texto)) continue;
                    questao.Alternativas.Add(new Alternativa
                    {
                        Texto = alt.Texto,
                        Correta = alt.Correta
                    });
                }

                quiz.Questoes.Add(questao);
            }

            _db.Quizzes.Add(quiz);
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = "Quiz criado!";
            return RedirectToAction("Index", "Turma", new { turmaId = model.TurmaId });
        }

        // ── Responder quiz (aluno) ────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> Responder(int quizId, int turmaId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questoes.OrderBy(q => q.Ordem))
                    .ThenInclude(q => q.Alternativas)
                .FirstOrDefaultAsync(q => q.Id == quizId && q.Ativo);

            if (quiz == null) return NotFound();

            var model = new ResponderQuizViewModel
            {
                QuizId = quizId,
                TurmaId = turmaId,
                Titulo = quiz.Titulo,
                Descricao = quiz.Descricao,
                Questoes = quiz.Questoes.Select(q => new QuestaoResponderViewModel
                {
                    QuestaoId = q.Id,
                    Enunciado = q.Enunciado,
                    ImagemUrl = q.ImagemUrl,
                    Alternativas = q.Alternativas.Select(a => new AlternativaResponderViewModel
                    {
                        AlternativaId = a.Id,
                        Texto = a.Texto
                    }).ToList()
                }).ToList()
            };

            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Responder(ResponderQuizViewModel model)
        {
            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            var quiz = await _db.Quizzes
                .Include(q => q.Questoes)
                    .ThenInclude(q => q.Alternativas)
                .FirstOrDefaultAsync(q => q.Id == model.QuizId);

            if (quiz == null) return NotFound();

            int acertos = 0;
            var questoesResultado = new List<QuestaoResultadoViewModel>();

            foreach (var qResp in model.Questoes)
            {
                var questao = quiz.Questoes.FirstOrDefault(q => q.Id == qResp.QuestaoId);
                if (questao == null) continue;

                var alternativaCorreta = questao.Alternativas.FirstOrDefault(a => a.Correta);
                var alternativaEscolhida = questao.Alternativas
                    .FirstOrDefault(a => a.Id == qResp.AlternativaSelecionada);

                bool acertou = alternativaEscolhida?.Correta == true;
                if (acertou) acertos++;

                questoesResultado.Add(new QuestaoResultadoViewModel
                {
                    Enunciado = questao.Enunciado,
                    AlternativaEscolhida = alternativaEscolhida?.Texto ?? "Não respondida",
                    AlternativaCorreta = alternativaCorreta?.Texto ?? "",
                    Acertou = acertou,
                    Explicacao = questao.Explicacao,
                    TipoExplicacao = questao.TipoExplicacao,
                    ExplicacaoMidiaUrl = questao.ExplicacaoMidiaUrl
                });
            }

            decimal pontuacao = quiz.Questoes.Count > 0
                ? Math.Round((decimal)acertos / quiz.Questoes.Count * 100, 2)
                : 0;

            // Salva o resultado (sempre — tentativas ilimitadas)
            _db.ResultadosQuiz.Add(new ResultadoQuiz
            {
                QuizId = model.QuizId,
                AlunoId = perfil.Id,
                TotalQuestoes = quiz.Questoes.Count,
                TotalAcertos = acertos,
                Pontuacao = pontuacao,
                DataRealizacao = DateTime.Now
            });
            await _db.SaveChangesAsync();

            return View("Resultado", new ResultadoQuizViewModel
            {
                QuizId = model.QuizId,
                TituloQuiz = quiz.Titulo,
                TurmaId = model.TurmaId,
                TotalQuestoes = quiz.Questoes.Count,
                TotalAcertos = acertos,
                Pontuacao = pontuacao,
                Questoes = questoesResultado
            });
        }

        // ── Ver resultados (professor) ────────────────────────────

        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> VerResultados(int quizId, int turmaId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Resultados)
                    .ThenInclude(r => r.Aluno)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null) return NotFound();

            ViewBag.TurmaId = turmaId;
            return View(quiz);
        }

        // ── Excluir quiz ──────────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> ExcluirQuiz(int quizId, int turmaId)
        {
            var quiz = await _db.Quizzes.FindAsync(quizId);
            if (quiz != null)
            {
                _db.Quizzes.Remove(quiz);
                await _db.SaveChangesAsync();
                TempData["Sucesso"] = "Quiz excluído.";
            }
            return RedirectToAction("Index", "Turma", new { turmaId });
        }

        // ── Copiar quiz ───────────────────────────────────────────────

        [HttpPost]
        [ValidateAntiForgeryToken]
        [Authorize(Roles = UsuarioRole.AdminEProfessor)]
        public async Task<IActionResult> CopiarQuiz(int quizId, int turmaDestinoId, int turmaId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questoes)
                    .ThenInclude(q => q.Alternativas)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null) return NotFound();

            var perfil = await GetPerfilAtualAsync();
            if (perfil == null) return RedirectToAction("Login", "Account");

            var novoQuiz = new Quiz
            {
                Titulo = quiz.Titulo,
                Descricao = quiz.Descricao,
                TurmaId = turmaDestinoId,
                AutorId = perfil.Id,
                Ativo = quiz.Ativo,
                DataPublicacao = DateTime.Now
            };

            foreach (var q in quiz.Questoes.OrderBy(q => q.Ordem))
            {
                var novaQuestao = new Questao
                {
                    Enunciado = q.Enunciado,
                    Explicacao = q.Explicacao,
                    TipoExplicacao = q.TipoExplicacao,
                    ExplicacaoMidiaUrl = q.ExplicacaoMidiaUrl,
                    ImagemUrl = q.ImagemUrl,
                    Ordem = q.Ordem
                };

                foreach (var alt in q.Alternativas)
                {
                    novaQuestao.Alternativas.Add(new Alternativa
                    {
                        Texto = alt.Texto,
                        Correta = alt.Correta
                    });
                }

                novoQuiz.Questoes.Add(novaQuestao);
            }

            _db.Quizzes.Add(novoQuiz);
            await _db.SaveChangesAsync();

            TempData["Sucesso"] = $"Quiz copiado para a turma com sucesso!";
            return RedirectToAction("Index", "Turma", new { turmaId });
        }
    }
}
