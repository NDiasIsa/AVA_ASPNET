using System.ComponentModel.DataAnnotations;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Turma escolar criada pelo professor. Ex: "1A", "2B"
    /// </summary>
    public class Turma
    {
        public int Id { get; set; }

        [Display(Name = "Código")]
        public string Codigo { get; set; } = string.Empty;

        [Display(Name = "Descrição")]
        public string? Descricao { get; set; }

        [Range(1, 3)]
        [Display(Name = "Ano (EM)")]
        public int Ano { get; set; }

        [Display(Name = "Ano letivo")]
        public int AnoLetivo { get; set; }

        // Professor dono da turma
        public int ProfessorId { get; set; }

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

        public virtual Perfil? Perfil { get; set; }
        public virtual Turma? Turma { get; set; }
    }
}
