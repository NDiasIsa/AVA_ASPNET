using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVA_ASPNET.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailPessoalPerfil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Explicacao",
                table: "Questoes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExplicacaoMidiaUrl",
                table: "Questoes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoExplicacao",
                table: "Questoes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EmailPessoal",
                table: "Perfis",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Atividades",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "QuestoesAtividade",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Enunciado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImagemUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    AtividadeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestoesAtividade", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestoesAtividade_Atividades_AtividadeId",
                        column: x => x.AtividadeId,
                        principalTable: "Atividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RespostasAtividade",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AtividadeId = table.Column<int>(type: "int", nullable: false),
                    AlunoId = table.Column<int>(type: "int", nullable: false),
                    TotalQuestoes = table.Column<int>(type: "int", nullable: false),
                    TotalAcertos = table.Column<int>(type: "int", nullable: false),
                    Nota = table.Column<decimal>(type: "decimal(4,1)", nullable: false),
                    DataResposta = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RespostasAtividade", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RespostasAtividade_Atividades_AtividadeId",
                        column: x => x.AtividadeId,
                        principalTable: "Atividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RespostasAtividade_Perfis_AlunoId",
                        column: x => x.AlunoId,
                        principalTable: "Perfis",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AlternativasAtividade",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Texto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Correta = table.Column<bool>(type: "bit", nullable: false),
                    QuestaoAtividadeId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlternativasAtividade", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlternativasAtividade_QuestoesAtividade_QuestaoAtividadeId",
                        column: x => x.QuestaoAtividadeId,
                        principalTable: "QuestoesAtividade",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlternativasAtividade_QuestaoAtividadeId",
                table: "AlternativasAtividade",
                column: "QuestaoAtividadeId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestoesAtividade_AtividadeId",
                table: "QuestoesAtividade",
                column: "AtividadeId");

            migrationBuilder.CreateIndex(
                name: "IX_RespostasAtividade_AlunoId",
                table: "RespostasAtividade",
                column: "AlunoId");

            migrationBuilder.CreateIndex(
                name: "IX_RespostasAtividade_AtividadeId_AlunoId",
                table: "RespostasAtividade",
                columns: new[] { "AtividadeId", "AlunoId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlternativasAtividade");

            migrationBuilder.DropTable(
                name: "RespostasAtividade");

            migrationBuilder.DropTable(
                name: "QuestoesAtividade");

            migrationBuilder.DropColumn(
                name: "Explicacao",
                table: "Questoes");

            migrationBuilder.DropColumn(
                name: "ExplicacaoMidiaUrl",
                table: "Questoes");

            migrationBuilder.DropColumn(
                name: "TipoExplicacao",
                table: "Questoes");

            migrationBuilder.DropColumn(
                name: "EmailPessoal",
                table: "Perfis");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Atividades");
        }
    }
}
