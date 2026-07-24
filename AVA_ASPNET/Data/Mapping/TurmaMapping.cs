using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class TurmaMapping : IEntityTypeConfiguration<Turma>
    {
        public void Configure(EntityTypeBuilder<Turma> builder)
        {
            builder
                .HasKey(t => t.Id);

            builder
                .Property(t => t.Codigo)
                .IsRequired()
                .HasMaxLength(10);

            builder
                .Property(t => t.Descricao)
                .HasMaxLength(100);

            #region Relacionamentos
            // Professor dono da turma (Perfil). Sem coleção inversa em Perfil.
            // Restrict (NO ACTION) evita múltiplos caminhos de cascade no SQL Server:
            // sem isso, deletar um Perfil chegaria em ProfessorTurmas por dois caminhos
            // (direto via PerfilId e indireto via Turma → TurmaId).
            builder
                .HasOne(t => t.Professor)
                .WithMany()
                .HasForeignKey(t => t.ProfessorId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
            #endregion
        }
    }
}
