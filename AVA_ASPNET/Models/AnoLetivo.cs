namespace AVA_ASPNET.Models
{
    public class AnoLetivo
    {
        public int Id { get; set; }
        public int Ano { get; set; }
        public bool Ativo { get; set; } = false;
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
    }
}