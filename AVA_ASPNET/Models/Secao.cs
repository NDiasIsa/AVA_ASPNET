using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AVA_ASPNET.Models
{
    /// <summary>
    /// Seção dentro de uma turma (ex: 1º Bimestre, Quiz)
    /// Igual às seções do Google Classroom
    /// </summary>
    public class Secao
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Nome { get; set; } = string.Empty;

        public int Ordem { get; set; } = 0;

        /// <summary>"Completa" = Material + Atividade | "SoAtividade" = só Atividade</summary>
        public string Tipo { get; set; } = "Completa";

        public int TurmaId { get; set; }

        [ForeignKey(nameof(TurmaId))]
        public virtual Turma? Turma { get; set; }
        public virtual ICollection<Publicacao> Publicacoes { get; set; } = new List<Publicacao>();

        public virtual ICollection<Atividade> Atividades { get; set; } = new List<Atividade>();
    }

}

    

        

       

       

        
       
