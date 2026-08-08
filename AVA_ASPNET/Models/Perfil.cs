using AVA_ASPNET.Models.Enums;
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
        public string UserId { get; set; } = string.Empty;
        public string TipoUsuario { get; set; } = UsuarioRole.Aluno;
        public string NomeCompleto { get; set; } = string.Empty;
        public string? Matricula { get; set; }

        /// <summary>
        /// true = aluno ainda não fez o primeiro acesso
        /// (ainda não definiu senha nem escolheu turma)
        /// </summary>
        public bool PrimeiroAcesso { get; set; } = true;

        /// <summary>E-mail pessoal do aluno para recuperação de senha</summary>
        public string? EmailPessoal { get; set; }

        /// <summary>false = desativado na virada de ano ou saiu da escola</summary>
        public bool Ativo { get; set; } = true;

        // Aluno pertence a UMA turma por vez
        public int? TurmaId { get; set; }

        public string? FotoUrl { get; set; }

        // Navegação
        public virtual IdentityUser? Usuario { get; set; }
        public virtual Turma? Turma { get; set; }

        // Só para professores (podem lecionar em várias turmas)
        public virtual ICollection<ProfessorTurma> ProfessorTurmas { get; set; } = new List<ProfessorTurma>();
    }
}
