using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class QuizMapping : IEntityTypeConfiguration<Quiz>
    {
        public void Configure(EntityTypeBuilder<Quiz> builder)
        {
            builder.HasKey(q => q.Id);
            builder.Property(q => q.Titulo).IsRequired().HasMaxLength(200);

            builder.HasOne(q => q.Turma)
                .WithMany(t => t.Quizzes)
                .HasForeignKey(q => q.TurmaId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(q => q.Autor)
                .WithMany()
                .HasForeignKey(q => q.AutorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class QuestaoMapping : IEntityTypeConfiguration<Questao>
    {
        public void Configure(EntityTypeBuilder<Questao> builder)
        {
            builder.HasKey(q => q.Id);
            builder.Property(q => q.Enunciado).IsRequired();

            builder.HasOne(q => q.Quiz)
                .WithMany(qz => qz.Questoes)
                .HasForeignKey(q => q.QuizId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class AlternativaMapping : IEntityTypeConfiguration<Alternativa>
    {
        public void Configure(EntityTypeBuilder<Alternativa> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Texto).IsRequired().HasMaxLength(500);

            builder.HasOne(a => a.Questao)
                .WithMany(q => q.Alternativas)
                .HasForeignKey(a => a.QuestaoId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class ResultadoQuizMapping : IEntityTypeConfiguration<ResultadoQuiz>
    {
        public void Configure(EntityTypeBuilder<ResultadoQuiz> builder)
        {
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Pontuacao).HasColumnType("decimal(5,2)");

            builder.HasOne(r => r.Quiz)
                .WithMany(q => q.Resultados)
                .HasForeignKey(r => r.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(r => r.Aluno)
                .WithMany()
                .HasForeignKey(r => r.AlunoId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}