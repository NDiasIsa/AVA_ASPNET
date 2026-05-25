// ─── Models/Noticia.cs ───────────────────────────────────────
namespace AVA_ASPNET.Models
{
    public class Noticia
    {
        public int Id { get; set; }
        public string Assunto { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public string ImagemUrl { get; set; } = string.Empty;
        public string Link { get; set; } = "#";
    }
}
