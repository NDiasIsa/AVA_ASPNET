using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class NoticiaMapping : IEntityTypeConfiguration<Noticia>
    {
        public void Configure(EntityTypeBuilder<Noticia> builder)
        {
            builder.HasKey(n => n.Id);

            builder.Property(n => n.Titulo)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(n => n.Conteudo)
                .IsRequired();

            builder.Property(n => n.DataPublicacao)
                .IsRequired();

            builder.HasOne(n => n.Autor)
                .WithMany()
                .HasForeignKey(n => n.AutorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
