// ─── Models/Noticia.cs ───────────────────────────────────────
namespace AVA_ASPNET.Models
{
    public class Noticia
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Resumo { get; set; }
        public string Conteudo { get; set; } = string.Empty;

        /// <summary>Imagem de capa — aparece no carousel</summary>
        public string? ImagemUrl { get; set; }

        /// <summary>Imagem do card — aparece na seção de baixo da Home</summary>
        public string? ImagemCardUrl { get; set; }

        /// <summary>Cor do título no carousel (hex, ex: #ffffff)</summary>
        public string CorTitulo { get; set; } = "#f2f1ec";

        public int AutorId { get; set; }
        public virtual Perfil? Autor { get; set; }

        public DateTime DataPublicacao { get; set; } = DateTime.Now;

        public bool Publicada { get; set; } = false;

        /// <summary>Aparece no carousel de destaques</summary>
        public bool Destaque { get; set; } = false;

        /// <summary>Aparece na seção de cards da Home</summary>
        public bool Card { get; set; } = false;
    }
}