using CsvHelper.Configuration.Attributes;

namespace AVA_ASPNET.Data
{
    public class LinhaCsvDto
    {
        [Name("Aluno")]
        public string NomeAluno { get; set; }

        [Name("Matrícula")]
        public string Matricula { get; set; }

        [Name("Nº")]
        public string Numero { get; set; }
    }
}
