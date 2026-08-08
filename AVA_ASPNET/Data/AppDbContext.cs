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
        public DbSet<AnoLetivo> AnosLetivos { get; set; }
        public DbSet<Noticia> Noticias { get; set; }
        public DbSet<Secao> Secoes { get; set; }
        public DbSet<Aviso> Avisos { get; set; }
        public DbSet<Publicacao> Publicacoes { get; set; }
        public DbSet<Atividade> Atividades { get; set; }
        public DbSet<EntregaAtividade> EntregasAtividade { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Questao> Questoes { get; set; }
        public DbSet<Alternativa> Alternativas { get; set; }
        public DbSet<ResultadoQuiz> ResultadosQuiz { get; set; }
        public DbSet<QuestaoAtividade> QuestoesAtividade { get; set; }
        public DbSet<AlternativaAtividade> AlternativasAtividade { get; set; }
        public DbSet<RespostaAtividade> RespostasAtividade { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}
