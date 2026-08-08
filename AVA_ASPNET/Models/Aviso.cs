using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Aviso fixado no topo da página da turma (mural)
    /// </summary>
    public class Aviso
    {
        public int Id { get; set; }

        [Required]
        public string Texto { get; set; } = string.Empty;

        public int TurmaId { get; set; }
        public int AutorId { get; set; }

        public DateTime DataPublicacao { get; set; } = DateTime.Now;

        [ForeignKey(nameof(TurmaId))]
        public virtual Turma? Turma { get; set; }

        [ForeignKey(nameof(AutorId))]
        public virtual Perfil? Autor { get; set; }
    }
}