using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class SecaoMapping : IEntityTypeConfiguration<Secao>
    {
        public void Configure(EntityTypeBuilder<Secao> builder)
        {
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Nome).IsRequired().HasMaxLength(100);
            builder.HasOne(s => s.Turma)
                .WithMany(t => t.Secoes)
                .HasForeignKey(s => s.TurmaId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}