using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Perfil vinculado ao AspNetUsers.
    /// TipoUsuario: "Aluno" | "Professor" | "Admin"
    ///
    /// Aluno  → Username = Matricula, login matrícula+senha
    /// Professor → Username = Email,  login email+senha
    /// </summary>
    public class Perfil
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string TipoUsuario { get; set; } = "Aluno";

        [Required, MaxLength(150)]
        [Display(Name = "Nome completo")]
        public string NomeCompleto { get; set; } = string.Empty;

        [MaxLength(20)]
        [Display(Name = "Matrícula")]
        public string? Matricula { get; set; }

        /// <summary>
        /// true = aluno ainda não fez o primeiro acesso
        /// (ainda não definiu senha nem escolheu turma)
        /// </summary>
        public bool PrimeiroAcesso { get; set; } = true;

        // Aluno pertence a UMA turma por vez
        public int? TurmaId { get; set; }

        public string? FotoUrl { get; set; }

        // Navegação
        [ForeignKey(nameof(UserId))]
        public virtual IdentityUser? Usuario { get; set; }

        [ForeignKey(nameof(TurmaId))]
        public virtual Turma? Turma { get; set; }

        // Só para professores (podem lecionar em várias turmas)
        public virtual ICollection<ProfessorTurma> ProfessorTurmas { get; set; } = new List<ProfessorTurma>();
    }
}
