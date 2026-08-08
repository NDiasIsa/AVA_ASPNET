using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    public class Atividade
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public string? Descricao { get; set; }
        public string? ArquivoUrl { get; set; }
        public string? NomeArquivo { get; set; }
        public DateTime? Prazo { get; set; }

        [Range(0, 10)]
        public decimal ValorMaximo { get; set; } = 10;

        /// <summary>"Entrega" | "Avaliativa"</summary>
        public string Tipo { get; set; } = "Entrega";

        public int SecaoId { get; set; }
        public int AutorId { get; set; }
        public DateTime DataPublicacao { get; set; } = DateTime.Now;

        [ForeignKey(nameof(SecaoId))]
        public virtual Secao? Secao { get; set; }

        [ForeignKey(nameof(AutorId))]
        public virtual Perfil? Autor { get; set; }

        public virtual ICollection<EntregaAtividade> Entregas { get; set; } = new List<EntregaAtividade>();
        public virtual ICollection<QuestaoAtividade> Questoes { get; set; } = new List<QuestaoAtividade>();
    }

    public class EntregaAtividade
    {
        public int Id { get; set; }
        public int AtividadeId { get; set; }
        public int AlunoId { get; set; }
        public string? ArquivoUrl { get; set; }
        public string? NomeArquivo { get; set; }
        public string? TextoResposta { get; set; }
        public DateTime DataEntrega { get; set; } = DateTime.Now;

        [Range(0, 10)]
        public decimal? Nota { get; set; }

        public string? Feedback { get; set; }
        public bool Corrigida { get; set; } = false;

        [ForeignKey(nameof(AtividadeId))]
        public virtual Atividade? Atividade { get; set; }

        [ForeignKey(nameof(AlunoId))]
        public virtual Perfil? Aluno { get; set; }
    }

    public class QuestaoAtividade
    {
        public int Id { get; set; }

        [Required]
        public string Enunciado { get; set; } = string.Empty;

        public string? ImagemUrl { get; set; }
        public int Ordem { get; set; } = 0;
        public int AtividadeId { get; set; }

        [ForeignKey(nameof(AtividadeId))]
        public virtual Atividade? Atividade { get; set; }

        public virtual ICollection<AlternativaAtividade> Alternativas { get; set; } = new List<AlternativaAtividade>();
    }

    public class AlternativaAtividade
    {
        public int Id { get; set; }

        [Required, MaxLength(500)]
        public string Texto { get; set; } = string.Empty;

        public bool Correta { get; set; } = false;
        public int QuestaoAtividadeId { get; set; }

        [ForeignKey(nameof(QuestaoAtividadeId))]
        public virtual QuestaoAtividade? Questao { get; set; }
    }

    public class RespostaAtividade
    {
        public int Id { get; set; }
        public int AtividadeId { get; set; }
        public int AlunoId { get; set; }
        public int TotalQuestoes { get; set; }
        public int TotalAcertos { get; set; }
        public decimal Nota { get; set; }
        public DateTime DataResposta { get; set; } = DateTime.Now;

        [ForeignKey(nameof(AtividadeId))]
        public virtual Atividade? Atividade { get; set; }

        [ForeignKey(nameof(AlunoId))]
        public virtual Perfil? Aluno { get; set; }
    }
}