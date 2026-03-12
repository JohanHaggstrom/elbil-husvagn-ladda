using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElbilHusvagnLadda.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalFieldsToSuggestedPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "SuggestedChargingPoints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExternalSource",
                table: "SuggestedChargingPoints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "SuggestedChargingPoints");

            migrationBuilder.DropColumn(
                name: "ExternalSource",
                table: "SuggestedChargingPoints");
        }
    }
}
