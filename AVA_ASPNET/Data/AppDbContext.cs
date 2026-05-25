using AVA_ASPNET.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AVA_ASPNET.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Perfil> Perfis { get; set; }
        public DbSet<Turma> Turmas { get; set; }
        public DbSet<ProfessorTurma> ProfessorTurmas { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Um usuário tem apenas um perfil
            builder.Entity<Perfil>()
                .HasIndex(p => p.UserId)
                .IsUnique();

            // Matrícula única por perfil
            builder.Entity<Perfil>()
                .HasIndex(p => p.Matricula)
                .IsUnique()
                .HasFilter("[Matricula] IS NOT NULL");

            // Aluno → Turma (FK simples, sem tabela de junção)
            builder.Entity<Perfil>()
                .HasOne(p => p.Turma)
                .WithMany(t => t.Alunos)
                .HasForeignKey(p => p.TurmaId)
                .OnDelete(DeleteBehavior.SetNull);

            // Professor não pode estar duas vezes na mesma turma
            builder.Entity<ProfessorTurma>()
                .HasIndex(p => new { p.PerfilId, p.TurmaId })
                .IsUnique();
        }
    }
}
