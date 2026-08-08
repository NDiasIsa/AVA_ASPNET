using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AVA_ASPNET.Models
{
    // ─── Home ────────────────────────────────────────────────────
    public class HomeViewModel
    {
        public List<Noticia> Destaques { get; set; } = new();
        public List<Noticia> Cards { get; set; } = new();
    }

    // ─── Login: tela única com campo adaptativo ───────────────────
    // Aluno digita matrícula; professor/admin digita e-mail
    public class LoginViewModel
    {
        [Required]
        [Display(Name = "Matrícula ou e-mail")]
        public string Identificador { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        [Display(Name = "Senha")]
        public string Senha { get; set; } = string.Empty;

        [Display(Name = "Lembrar-me")]
        public bool LembrarMe { get; set; }
    }

    // ─── Primeiro acesso do aluno (só define senha) ───────────────
    public class PrimeiroAcessoViewModel
    {
        [Required]
        public string Matricula { get; set; } = string.Empty;

        public string NomeCompleto { get; set; } = string.Empty;
        public string NomeTurma { get; set; } = string.Empty;

        [Required, MinLength(8)]
        [DataType(DataType.Password)]
        [Display(Name = "Definir senha")]
        public string Senha { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        [Compare(nameof(Senha), ErrorMessage = "As senhas não coincidem.")]
        [Display(Name = "Confirmar senha")]
        public string ConfirmarSenha { get; set; } = string.Empty;

        [Required, EmailAddress]
        [Display(Name = "E-mail pessoal (para recuperação de senha)")]
        public string EmailPessoal { get; set; } = string.Empty;
    }

    // ─── Esqueci minha senha ──────────────────────────────────────
    public class EsqueciSenhaViewModel
    {
        [Display(Name = "Matrícula (aluno) ou E-mail (professor)")]
        public string Identificador { get; set; } = string.Empty;
    }

    // ─── Redefinir senha ──────────────────────────────────────────
    public class RedefinirSenhaViewModel
    {
        public string UserId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;

        [Required, MinLength(8)]
        [DataType(DataType.Password)]
        [Display(Name = "Nova senha")]
        public string Senha { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        [Compare(nameof(Senha), ErrorMessage = "As senhas não coincidem.")]
        [Display(Name = "Confirmar nova senha")]
        public string ConfirmarSenha { get; set; } = string.Empty;
    }

    // ─── Admin: criar professor ───────────────────────────────────
    public class CriarProfessorViewModel
    {
        [Required, MaxLength(150)]
        [Display(Name = "Nome completo")]
        public string NomeCompleto { get; set; } = string.Empty;

        [Required, EmailAddress]
        [Display(Name = "E-mail")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(20)]
        [Display(Name = "Matrícula funcional")]
        public string? Matricula { get; set; }

        [Required, MinLength(6)]
        [DataType(DataType.Password)]
        [Display(Name = "Senha inicial")]
        public string Senha { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        [Compare(nameof(Senha), ErrorMessage = "As senhas não coincidem.")]
        [Display(Name = "Confirmar senha")]
        public string ConfirmarSenha { get; set; } = string.Empty;
    }

    // ─── Professor/Admin: importar alunos ────────────────────────
    public class ImportarAlunosViewModel
    {
        public int TurmaId { get; set; }
        public string NomeTurma { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Arquivo CSV")]
        public IFormFile ArquivoCSV { get; set; } = null!;
    }

    // ─── Admin: criar/editar turma ────────────────────────────────
    public class TurmaViewModel
    {
        public int Id { get; set; }

        [Required, MaxLength(10)]
        [Display(Name = "Código da turma")]
        public string Codigo { get; set; } = string.Empty;

        [MaxLength(100)]
        [Display(Name = "Descrição")]
        public string? Descricao { get; set; }

        [Required, Range(1, 3)]
        [Display(Name = "Ano (1º, 2º ou 3º EM)")]
        public int Ano { get; set; }

        [Required]
        [Display(Name = "Ano letivo")]
        public int AnoLetivo { get; set; }
    }

    public class IniciarAnoLetivoViewModel
    {
        public int AnoAtual { get; set; }
        public int AnoNovo { get; set; }
        public int TotalAlunosAtivos { get; set; }
        public int TotalTurmas { get; set; }
    }
    // ─── Admin: associar professor à turma ───────────────────────
    public class AssociarProfessorViewModel
    {
        public int TurmaId { get; set; }
        public string NomeTurma { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Professor")]
        public int ProfessorId { get; set; }

        public List<Perfil> ProfessoresDisponiveis { get; set; } = new();
    }
    // ─── Admin: criar/editar notícia ──────────────────────────────
    public class NoticiaViewModel
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        [Display(Name = "Título")]
        public string Titulo { get; set; } = string.Empty;

        [MaxLength(300)]
        [Display(Name = "Resumo")]
        public string? Resumo { get; set; }

        [Required]
        [Display(Name = "Conteúdo")]
        public string Conteudo { get; set; } = string.Empty;

        [Display(Name = "Imagem de capa (carousel)")]
        public IFormFile? ImagemCapa { get; set; }
        public string? ImagemUrlAtual { get; set; }

        [Display(Name = "Imagem do card (seção de baixo)")]
        public IFormFile? ImagemCard { get; set; }
        public string? ImagemCardUrlAtual { get; set; }

        [Display(Name = "Publicar agora")]
        public bool Publicada { get; set; } = false;

        [Display(Name = "Mostrar no carousel de destaques")]
        public bool Destaque { get; set; } = false;

        [Display(Name = "Mostrar na seção de cards da Home")]
        public bool Card { get; set; } = false;

        [Display(Name = "Cor do título no carousel")]
        public string CorTitulo { get; set; } = "#f2f1ec";
    }

    // ─── Página da turma ──────────────────────────────────────────
    public class TurmaPageViewModel
    {
        public Turma Turma { get; set; } = null!;
        public List<Aviso> Avisos { get; set; } = new();
        public List<Secao> Secoes { get; set; } = new();
        public List<Quiz> Quizzes { get; set; } = new();
        public bool EhProfessor { get; set; }
        public string NovoAviso { get; set; } = string.Empty;
        public HashSet<int> AtividadesEntregues { get; set; } = new();
        public HashSet<int> AtividadesCorrigidas { get; set; } = new();
        // Novo: turmas do professor para cópia
        public List<Turma> TurmasDoProfe { get; set; } = new();
    }

    // ─── Nova seção ───────────────────────────────────────────────
    public class SecaoViewModel
    {
        public int TurmaId { get; set; }

        [Required, MaxLength(100)]
        [Display(Name = "Nome da seção")]
        public string Nome { get; set; } = string.Empty;

        [Display(Name = "Tipo")]
        public string Tipo { get; set; } = "Completa";
    }

    // ─── Publicação de material ───────────────────────────────────
    public class PublicacaoViewModel
    {
        public int Id { get; set; }
        public int SecaoId { get; set; }
        public int TurmaId { get; set; }
        public string NomeSecao { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        [Display(Name = "Título")]
        public string Titulo { get; set; } = string.Empty;

        [Display(Name = "Descrição")]
        public string? Descricao { get; set; }

        [Required]
        [Display(Name = "Tipo")]
        public string Tipo { get; set; } = "Arquivo";

        [Display(Name = "Arquivo")]
        public IFormFile? Arquivo { get; set; }
        public string? UrlAtual { get; set; }
        public string? NomeArquivoAtual { get; set; }

        [Display(Name = "Link (URL)")]
        public string? Link { get; set; }

    }
    

    // ─── Entrega do aluno ─────────────────────────────────────────
    public class EntregarAtividadeViewModel
    {
        public int AtividadeId { get; set; }
        public int TurmaId { get; set; }
        public string TituloAtividade { get; set; } = string.Empty;
        public string? DescricaoAtividade { get; set; }
        public DateTime? Prazo { get; set; }
        public decimal ValorMaximo { get; set; }
        public string? ArquivoAtividadeUrl { get; set; }

        [Display(Name = "Arquivo de resposta")]
        public IFormFile? Arquivo { get; set; }

        [Display(Name = "Texto de resposta")]
        public string? TextoResposta { get; set; }

        // Entrega já existente (para reentrega)
        public EntregaAtividade? EntregaExistente { get; set; }
    }

    // ─── Correção pelo professor ──────────────────────────────────
    public class CorrigirEntregaViewModel
    {
        public int EntregaId { get; set; }
        public int TurmaId { get; set; }
        public string NomeAluno { get; set; } = string.Empty;
        public string TituloAtividade { get; set; } = string.Empty;
        public string? ArquivoUrl { get; set; }
        public string? NomeArquivo { get; set; }
        public string? TextoResposta { get; set; }
        public DateTime DataEntrega { get; set; }
        public decimal ValorMaximo { get; set; }

        [Range(0, 10)]
        [Display(Name = "Nota")]
        public decimal? Nota { get; set; }

        [Display(Name = "Feedback")]
        public string? Feedback { get; set; }
    }

    // ─── Quiz ─────────────────────────────────────────────────────
    public class QuizViewModel
    {
        public int Id { get; set; }
        public int TurmaId { get; set; }

        [Required, MaxLength(200)]
        [Display(Name = "Título")]
        public string Titulo { get; set; } = string.Empty;

        [Display(Name = "Descrição")]
        public string? Descricao { get; set; }

        [Display(Name = "Ativo (visível para alunos)")]
        public bool Ativo { get; set; } = true;

        public List<QuestaoViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoViewModel
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Enunciado")]
        public string Enunciado { get; set; } = string.Empty;

        [Display(Name = "Tipo de explicação")]
        public string TipoExplicacao { get; set; } = "Texto";

        [Display(Name = "Explicação em texto")]
        public string? Explicacao { get; set; }

        [Display(Name = "Imagem da explicação")]
        public IFormFile? ExplicacaoImagem { get; set; }

        [Display(Name = "Link do vídeo (YouTube)")]
        public string? ExplicacaoVideoUrl { get; set; }

        [Display(Name = "Imagem do enunciado (opcional)")]
        public IFormFile? Imagem { get; set; }

        public List<AlternativaViewModel> Alternativas { get; set; } = new()
    {
        new(), new(), new(), new()
    };
    }

    public class AlternativaViewModel
    {
        public int Id { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Correta { get; set; } = false;
    }

    // ─── Responder quiz ───────────────────────────────────────────
    public class ResponderQuizViewModel
    {
        public int QuizId { get; set; }
        public int TurmaId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public List<QuestaoResponderViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoResponderViewModel
    {
        public int QuestaoId { get; set; }
        public string Enunciado { get; set; } = string.Empty;
        public string? ImagemUrl { get; set; }  // <- adicionar
        public List<AlternativaResponderViewModel> Alternativas { get; set; } = new();
        public int? AlternativaSelecionada { get; set; }


    }

    public class AlternativaResponderViewModel
    {
        public int AlternativaId { get; set; }
        public string Texto { get; set; } = string.Empty;
    }

    // ─── Resultado do quiz ────────────────────────────────────────
    public class ResultadoQuizViewModel
    {
        public int QuizId { get; set; }  // <- adicionar
        public string TituloQuiz { get; set; } = string.Empty;
        public int TurmaId { get; set; }
        public int TotalQuestoes { get; set; }
        public int TotalAcertos { get; set; }
        public decimal Pontuacao { get; set; }
        public List<QuestaoResultadoViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoResultadoViewModel
    {
        public string Enunciado { get; set; } = string.Empty;
        public string AlternativaEscolhida { get; set; } = string.Empty;
        public string AlternativaCorreta { get; set; } = string.Empty;
        public bool Acertou { get; set; }
        public string? Explicacao { get; set; }
        public string TipoExplicacao { get; set; } = "Texto";
        public string? ExplicacaoMidiaUrl { get; set; }
    }

    // ─── Painel do professor ──────────────────────────────────────
    public class PainelTurmaViewModel
    {
        public Turma Turma { get; set; } = null!;
        public List<PainelAtividadeViewModel> Atividades { get; set; } = new();
        public List<PainelQuizViewModel> Quizzes { get; set; } = new();
    }

    public class PainelAtividadeViewModel
    {
        public int AtividadeId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public DateTime? Prazo { get; set; }
        public int TotalAlunos { get; set; }
        public int Entregaram { get; set; }
        public int NaoEntregaram => TotalAlunos - Entregaram;
        public int PendenteCorrecao { get; set; }
        public int EmAtraso { get; set; }
    }

    public class PainelQuizViewModel
    {
        public int QuizId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int TotalAlunos { get; set; }
        public int FizeramQuiz { get; set; }
        public int NaoFizeram => TotalAlunos - FizeramQuiz;
        public decimal MediaPontuacao { get; set; }
        public decimal MelhorNota { get; set; }
        public decimal PiorNota { get; set; }
    }

    // ─── Visão geral de todas as turmas ──────────────────────────
    public class VisaoGeralViewModel
    {
        public List<ResumTurmaViewModel> Turmas { get; set; } = new();
    }

    public class ResumTurmaViewModel
    {
        public int TurmaId { get; set; }
        public string NomeTurma { get; set; } = string.Empty;
        public int TotalAlunos { get; set; }
        public int AtividadesPendentes { get; set; }
        public int EntregasPendenteCorrecao { get; set; }
        public int QuizzesAtivos { get; set; }
    }

    // ─── Criar atividade (atualizado) ────────────────────────────
    public class AtividadeViewModel
    {
        public int Id { get; set; }
        public int SecaoId { get; set; }
        public int TurmaId { get; set; }
        public string NomeSecao { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        [Display(Name = "Título")]
        public string Titulo { get; set; } = string.Empty;

        [Display(Name = "Descrição / Enunciado")]
        public string? Descricao { get; set; }

        [Display(Name = "Arquivo anexo")]
        public IFormFile? Arquivo { get; set; }
        public string? ArquivoUrlAtual { get; set; }
        public string? NomeArquivoAtual { get; set; }

        [Display(Name = "Prazo de entrega")]
        public DateTime? Prazo { get; set; }

        [Range(0, 10)]
        [Display(Name = "Valor máximo")]
        public decimal ValorMaximo { get; set; } = 10;

        [Display(Name = "Tipo de atividade")]
        public string Tipo { get; set; } = "Entrega";

        // Questões (para atividade avaliativa)
        public List<QuestaoAtividadeViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoAtividadeViewModel
    {
        public int Id { get; set; }

        [Required]
        [Display(Name = "Enunciado")]
        public string Enunciado { get; set; } = string.Empty;

        [Display(Name = "Imagem (opcional)")]
        public IFormFile? Imagem { get; set; }

        public List<AlternativaAtividadeViewModel> Alternativas { get; set; } = new()
    {
        new(), new(), new(), new()
    };
    }

    public class AlternativaAtividadeViewModel
    {
        public int Id { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Correta { get; set; } = false;
    }

    // ─── Responder atividade avaliativa ──────────────────────────
    public class ResponderAtividadeAvalViewModel
    {
        public int AtividadeId { get; set; }
        public int TurmaId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime? Prazo { get; set; }
        public decimal ValorMaximo { get; set; }
        public List<QuestaoResponderAtivViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoResponderAtivViewModel
    {
        public int QuestaoId { get; set; }
        public string Enunciado { get; set; } = string.Empty;
        public string? ImagemUrl { get; set; }
        public List<AlternativaResponderAtivViewModel> Alternativas { get; set; } = new();
        public int? AlternativaSelecionada { get; set; }
    }

    public class AlternativaResponderAtivViewModel
    {
        public int AlternativaId { get; set; }
        public string Texto { get; set; } = string.Empty;
    }

    // ─── Resultado atividade avaliativa ──────────────────────────
    public class ResultadoAtividadeAvalViewModel
    {
        public int AtividadeId { get; set; }
        public int TurmaId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public int TotalAcertos { get; set; }
        public decimal Nota { get; set; }
        public decimal ValorMaximo { get; set; }
        public List<QuestaoResultadoAtivViewModel> Questoes { get; set; } = new();
    }

    public class QuestaoResultadoAtivViewModel
    {
        public string Enunciado { get; set; } = string.Empty;
        public string AlternativaEscolhida { get; set; } = string.Empty;
        public string AlternativaCorreta { get; set; } = string.Empty;
        public bool Acertou { get; set; }
    }
}
