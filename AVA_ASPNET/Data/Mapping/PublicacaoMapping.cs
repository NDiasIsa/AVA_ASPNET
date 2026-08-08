using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class PublicacaoMapping : IEntityTypeConfiguration<Publicacao>
    {
        public void Configure(EntityTypeBuilder<Publicacao> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Titulo).IsRequired().HasMaxLength(200);
            builder.Property(p => p.Tipo).IsRequired().HasMaxLength(20);

            builder.HasOne(p => p.Secao)
                .WithMany(s => s.Publicacoes)
                .HasForeignKey(p => p.SecaoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.Autor)
                .WithMany()
                .HasForeignKey(p => p.AutorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}