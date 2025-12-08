using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ElbilHusvagnLadda.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class SwitchImageToBlob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImagePath",
                table: "ChargingPoints",
                newName: "ImageContentType");

            migrationBuilder.AddColumn<byte[]>(
                name: "ImageData",
                table: "ChargingPoints",
                type: "longblob",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 4,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 5,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 6,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 7,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 8,
                column: "ImageData",
                value: null);

            migrationBuilder.UpdateData(
                table: "ChargingPoints",
                keyColumn: "Id",
                keyValue: 9,
                column: "ImageData",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageData",
                table: "ChargingPoints");

            migrationBuilder.RenameColumn(
                name: "ImageContentType",
                table: "ChargingPoints",
                newName: "ImagePath");
        }
    }
}
