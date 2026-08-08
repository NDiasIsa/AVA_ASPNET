using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class AtividadeMapping : IEntityTypeConfiguration<Atividade>
    {
        public void Configure(EntityTypeBuilder<Atividade> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Titulo).IsRequired().HasMaxLength(200);
            builder.Property(a => a.ValorMaximo).HasColumnType("decimal(4,1)");

            builder.HasOne(a => a.Secao)
                .WithMany(s => s.Atividades)
                .HasForeignKey(a => a.SecaoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.Autor)
                .WithMany()
                .HasForeignKey(a => a.AutorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class EntregaAtividadeMapping : IEntityTypeConfiguration<EntregaAtividade>
    {
        public void Configure(EntityTypeBuilder<EntregaAtividade> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Nota).HasColumnType("decimal(4,1)");

            builder.HasIndex(e => new { e.AtividadeId, e.AlunoId }).IsUnique();

            builder.HasOne(e => e.Atividade)
                .WithMany(a => a.Entregas)
                .HasForeignKey(e => e.AtividadeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.Aluno)
                .WithMany()
                .HasForeignKey(e => e.AlunoId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class QuestaoAtividadeMapping : IEntityTypeConfiguration<QuestaoAtividade>
    {
        public void Configure(EntityTypeBuilder<QuestaoAtividade> builder)
        {
            builder.HasKey(q => q.Id);
            builder.Property(q => q.Enunciado).IsRequired();

            builder.HasOne(q => q.Atividade)
                .WithMany(a => a.Questoes)
                .HasForeignKey(q => q.AtividadeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class AlternativaAtividadeMapping : IEntityTypeConfiguration<AlternativaAtividade>
    {
        public void Configure(EntityTypeBuilder<AlternativaAtividade> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Texto).IsRequired().HasMaxLength(500);

            builder.HasOne(a => a.Questao)
                .WithMany(q => q.Alternativas)
                .HasForeignKey(a => a.QuestaoAtividadeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class RespostaAtividadeMapping : IEntityTypeConfiguration<RespostaAtividade>
    {
        public void Configure(EntityTypeBuilder<RespostaAtividade> builder)
        {
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Nota).HasColumnType("decimal(4,1)");

            builder.HasIndex(r => new { r.AtividadeId, r.AlunoId }).IsUnique();

            builder.HasOne(r => r.Atividade)
                .WithMany()
                .HasForeignKey(r => r.AtividadeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(r => r.Aluno)
                .WithMany()
                .HasForeignKey(r => r.AlunoId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}