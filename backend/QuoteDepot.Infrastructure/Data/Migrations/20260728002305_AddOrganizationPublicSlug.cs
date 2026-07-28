using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuoteDepot.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationPublicSlug : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicSlug",
                table: "Organizations",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE Organizations SET PublicSlug = lower(substr(hex(Id), 1, 16)) WHERE PublicSlug IS NULL");

            migrationBuilder.AlterColumn<string>(
                name: "PublicSlug",
                table: "Organizations",
                type: "TEXT",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_PublicSlug",
                table: "Organizations",
                column: "PublicSlug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_PublicSlug",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "PublicSlug",
                table: "Organizations");
        }
    }
}
