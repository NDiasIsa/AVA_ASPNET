using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVA_ASPNET.Migrations
{
    /// <inheritdoc />
    public partial class SecoesEAvisos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Secoes",
                columns: table => new
                {
                    Id = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    Nome = table.Column<string>(
                        type: "nvarchar(100)",
                        maxLength: 100,
                        nullable: false),

                    Ordem = table.Column<int>(
                        type: "int",
                        nullable: false),

                    TurmaId = table.Column<int>(
                        type: "int",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Secoes", x => x.Id);

                    table.ForeignKey(
                        name: "FK_Secoes_Turmas_TurmaId",
                        column: x => x.TurmaId,
                        principalTable: "Turmas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Secoes_TurmaId",
                table: "Secoes",
                column: "TurmaId");

            migrationBuilder.CreateTable(
                name: "Avisos",
                columns: table => new
                {
                    Id = table.Column<int>(
                        type: "int",
                        nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    Texto = table.Column<string>(
                        type: "nvarchar(max)",
                        nullable: false),

                    TurmaId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    AutorId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    DataPublicacao = table.Column<DateTime>(
                        type: "datetime2",
                        nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Avisos", x => x.Id);

                    table.ForeignKey(
                        name: "FK_Avisos_Turmas_TurmaId",
                        column: x => x.TurmaId,
                        principalTable: "Turmas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);

                    table.ForeignKey(
                        name: "FK_Avisos_Perfis_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Perfis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_TurmaId",
                table: "Avisos",
                column: "TurmaId");

            migrationBuilder.CreateIndex(
                name: "IX_Avisos_AutorId",
                table: "Avisos",
                column: "AutorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Avisos");

            migrationBuilder.DropTable(
                name: "Secoes");
        }
    }
}