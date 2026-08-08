using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Material postado pelo professor dentro de uma seção.
    /// Tipo: "Arquivo" | "Link"
    /// </summary>
    public class Publicacao
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public string? Descricao { get; set; }

        [Required, MaxLength(20)]
        public string Tipo { get; set; } = "Arquivo"; // "Arquivo" | "Link"

        /// <summary>Caminho do arquivo salvo ou URL do link</summary>
        public string? Url { get; set; }

        /// <summary>Nome original do arquivo (para exibição)</summary>
        public string? NomeArquivo { get; set; }

        public int SecaoId { get; set; }
        public int AutorId { get; set; }
        public DateTime DataPublicacao { get; set; } = DateTime.Now;

        [ForeignKey(nameof(SecaoId))]
        public virtual Secao? Secao { get; set; }

        [ForeignKey(nameof(AutorId))]
        public virtual Perfil? Autor { get; set; }
    }
}
