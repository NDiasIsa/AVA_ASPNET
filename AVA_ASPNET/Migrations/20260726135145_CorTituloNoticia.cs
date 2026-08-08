using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVA_ASPNET.Migrations
{
    /// <inheritdoc />
    public partial class CorTituloNoticia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CorTitulo",
                table: "Noticias",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CorTitulo",
                table: "Noticias");
        }
    }
}
