using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class PerfilMapping : IEntityTypeConfiguration<Perfil>
    {
        public void Configure(EntityTypeBuilder<Perfil> builder)
        {
            builder
                .HasKey(p => p.Id);

            builder
                .HasIndex(p => p.UserId)
                .IsUnique();

            builder
                .HasIndex(p => p.Matricula)
                .IsUnique()
                .HasFilter("[Matricula] IS NOT NULL");

            builder
                .Property(p => p.TipoUsuario)
                .IsRequired()
                .HasMaxLength(20);

            builder
                .Property(p => p.NomeCompleto)
                .IsRequired()
                .HasMaxLength(150);

            builder
                .Property(p => p.Matricula)
                .HasMaxLength(20);

            #region Relacionamentos
            // Um usuário do Identity tem apenas um perfil (unicidade garantida pelo índice único em UserId)
            builder
                .HasOne(p => p.Usuario)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            // Aluno → Turma (FK simples, sem tabela de junção)
            builder
                .HasOne(p => p.Turma)
                .WithMany(t => t.Alunos)
                .HasForeignKey(p => p.TurmaId)
                .OnDelete(DeleteBehavior.SetNull);
            #endregion
        }
    }
}
