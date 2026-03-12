using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElbilHusvagnLadda.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNobilIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "ChargingPoints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExternalSource",
                table: "ChargingPoints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "IgnoredChargingPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExternalId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExternalSource = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IgnoredChargingPoints", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "ExternalId", "ExternalSource" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IgnoredChargingPoints");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "ChargingPoints");

            migrationBuilder.DropColumn(
                name: "ExternalSource",
                table: "ChargingPoints");
        }
    }
}
