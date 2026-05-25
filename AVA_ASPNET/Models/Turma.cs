using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Turma escolar criada pelo professor. Ex: "1A", "2B"
    /// </summary>
    public class Turma
    {
        public int Id { get; set; }

        [Required, MaxLength(10)]
        [Display(Name = "Código")]
        public string Codigo { get; set; } = string.Empty;

        [MaxLength(100)]
        [Display(Name = "Descrição")]
        public string? Descricao { get; set; }

        [Range(1, 3)]
        [Display(Name = "Ano (EM)")]
        public int Ano { get; set; }

        [Display(Name = "Ano letivo")]
        public int AnoLetivo { get; set; }

        // Professor dono da turma
        public int ProfessorId { get; set; }

        [ForeignKey(nameof(ProfessorId))]
        public virtual Perfil? Professor { get; set; }

        // Navegação
        public virtual ICollection<Perfil> Alunos { get; set; } = new List<Perfil>();
        public virtual ICollection<ProfessorTurma> ProfessorTurmas { get; set; } = new List<ProfessorTurma>();

        public string NomeExibicao => $"{Ano}º EM — Turma {Codigo} ({AnoLetivo})";
    }

    /// <summary>Tabela de junção Professor ↔ Turma (professor pode lecionar em várias turmas)</summary>
    public class ProfessorTurma
    {
        public int Id { get; set; }
        public int PerfilId { get; set; }
        public int TurmaId { get; set; }

        [ForeignKey(nameof(PerfilId))]
        public virtual Perfil? Perfil { get; set; }

        [ForeignKey(nameof(TurmaId))]
        public virtual Turma? Turma { get; set; }
    }
}
