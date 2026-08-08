using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVA_ASPNET.Migrations
{
    /// <inheritdoc />
    public partial class NoticiaCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Card",
                table: "Noticias",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ImagemCardUrl",
                table: "Noticias",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Card",
                table: "Noticias");

            migrationBuilder.DropColumn(
                name: "ImagemCardUrl",
                table: "Noticias");
        }
    }
}
