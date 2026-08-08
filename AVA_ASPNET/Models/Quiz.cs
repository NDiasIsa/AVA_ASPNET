using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    public class Quiz
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        public int TurmaId { get; set; }
        public int AutorId { get; set; }
        public DateTime DataPublicacao { get; set; } = DateTime.Now;
        public bool Ativo { get; set; } = true;

        [ForeignKey(nameof(TurmaId))]
        public virtual Turma? Turma { get; set; }

        [ForeignKey(nameof(AutorId))]
        public virtual Perfil? Autor { get; set; }

        public virtual ICollection<Questao> Questoes { get; set; } = new List<Questao>();
        public virtual ICollection<ResultadoQuiz> Resultados { get; set; } = new List<ResultadoQuiz>();
    }

    public class Questao
    {
        public int Id { get; set; }

        [Required]
        public string Enunciado { get; set; } = string.Empty;

        public string? Explicacao { get; set; }

        /// <summary>"Texto" | "Imagem" | "Video"</summary>
        public string TipoExplicacao { get; set; } = "Texto";

        /// <summary>URL da imagem ou link do YouTube</summary>
        public string? ExplicacaoMidiaUrl { get; set; }

        public string? ImagemUrl { get; set; }
        public int Ordem { get; set; } = 0;
        public int QuizId { get; set; }

        public virtual Quiz? Quiz { get; set; }
        public virtual ICollection<Alternativa> Alternativas { get; set; } = new List<Alternativa>();
    }

    public class Alternativa
    {
        public int Id { get; set; }

        [Required, MaxLength(500)]
        public string Texto { get; set; } = string.Empty;

        public bool Correta { get; set; } = false;
        public int QuestaoId { get; set; }

        [ForeignKey(nameof(QuestaoId))]
        public virtual Questao? Questao { get; set; }
    }

    public class ResultadoQuiz
    {
        public int Id { get; set; }

        public int QuizId { get; set; }
        public int AlunoId { get; set; }

        public int TotalQuestoes { get; set; }
        public int TotalAcertos { get; set; }
        public decimal Pontuacao { get; set; } // 0-100

        public DateTime DataRealizacao { get; set; } = DateTime.Now;

        [ForeignKey(nameof(QuizId))]
        public virtual Quiz? Quiz { get; set; }

        [ForeignKey(nameof(AlunoId))]
        public virtual Perfil? Aluno { get; set; }
    }
}