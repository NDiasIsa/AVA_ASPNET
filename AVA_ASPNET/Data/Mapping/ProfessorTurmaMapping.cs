using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class ProfessorTurmaMapping : IEntityTypeConfiguration<ProfessorTurma>
    {
        public void Configure(EntityTypeBuilder<ProfessorTurma> builder)
        {
            builder
                .HasKey(pt => pt.Id);

            // Professor não pode estar duas vezes na mesma turma
            builder
                .HasIndex(pt => new { pt.PerfilId, pt.TurmaId })
                .IsUnique();

            #region Relacionamentos
            builder
                .HasOne(pt => pt.Perfil)
                .WithMany(p => p.ProfessorTurmas)
                .HasForeignKey(pt => pt.PerfilId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            builder
                .HasOne(pt => pt.Turma)
                .WithMany(t => t.ProfessorTurmas)
                .HasForeignKey(pt => pt.TurmaId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
            #endregion
        }
    }
}
