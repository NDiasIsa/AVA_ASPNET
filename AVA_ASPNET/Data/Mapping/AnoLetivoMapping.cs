using AVA_ASPNET.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AVA_ASPNET.Data.Mapping
{
    public class AnoLetivoMapping : IEntityTypeConfiguration<AnoLetivo>
    {
        public void Configure(EntityTypeBuilder<AnoLetivo> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Ano).IsRequired();
            builder.Property(a => a.DataInicio).IsRequired();
            builder.HasIndex(a => a.Ativo);
        }
    }
}