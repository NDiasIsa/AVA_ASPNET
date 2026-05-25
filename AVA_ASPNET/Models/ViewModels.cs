using System.ComponentModel.DataAnnotations;

namespace AVA_ASPNET.Models
{
    // ─── Home ────────────────────────────────────────────────────
    public class HomeViewModel
    {
        public List<Noticia> Destaques { get; set; } = new();
        public List<Noticia> Noticias { get; set; } = new();
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

    // ─── Primeiro acesso do aluno ─────────────────────────────────
    public class PrimeiroAcessoViewModel
    {
        [Required]
        public string Matricula { get; set; } = string.Empty;

        public string NomeCompleto { get; set; } = string.Empty; // só exibição

        [Required, MinLength(6)]
        [DataType(DataType.Password)]
        [Display(Name = "Definir senha")]
        public string Senha { get; set; } = string.Empty;

        [Required, DataType(DataType.Password)]
        [Compare(nameof(Senha), ErrorMessage = "As senhas não coincidem.")]
        [Display(Name = "Confirmar senha")]
        public string ConfirmarSenha { get; set; } = string.Empty;

        [Required]
        [Display(Name = "Selecione sua turma")]
        public int TurmaId { get; set; }

        public List<Turma> TurmasDisponiveis { get; set; } = new();
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

        // CSV colado manualmente (Nome;Matrícula por linha)
        [Required]
        [Display(Name = "Lista de alunos (Nome;Matrícula — uma por linha)")]
        public string ListaCSV { get; set; } = string.Empty;
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
        public int AnoLetivo { get; set; } = DateTime.Now.Year;
    }
}
