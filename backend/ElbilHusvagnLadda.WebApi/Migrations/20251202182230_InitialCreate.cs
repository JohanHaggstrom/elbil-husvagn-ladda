using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ElbilHusvagnLadda.WebApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            // ChargingPoints table already exists in database
            // migrationBuilder.CreateTable(
            //     name: "ChargingPoints",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "int", nullable: false)
            //             .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
            //         Title = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Address1 = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Address2 = table.Column<string>(type: "longtext", nullable: true)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         PostalCode = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         City = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Country = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         Comments = table.Column<string>(type: "longtext", nullable: true)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         MapCoordinates = table.Column<string>(type: "longtext", nullable: false)
            //             .Annotation("MySql:CharSet", "utf8mb4"),
            //         NumberOfChargePoints = table.Column<int>(type: "int", nullable: true),
            //         Capacity = table.Column<int>(type: "int", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_ChargingPoints", x => x.Id);
            //     })
            //     .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChargePointComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ChargePointId = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Vote = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChargePointComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChargePointComments_ChargingPoints_ChargePointId",
                        column: x => x.ChargePointId,
                        principalTable: "ChargingPoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // Data already exists
            // migrationBuilder.InsertData(
            //     table: "ChargingPoints",
            //     columns: new[] { "Id", "Address1", "Address2", "Capacity", "City", "Comments", "Country", "MapCoordinates", "NumberOfChargePoints", "PostalCode", "Title" },
            //     values: new object[,]
            //     {
            //         { 1, "Vattenfall - M2 Center", "", 150, "Jönköping", "An unknown places are dedicated for large vehicles", "Sweden", "57.7617016947237, 14.19194294601759", 12, "553 03", "Vattenfall InCharge, M2 Center" },
            //         { 2, "Snickargatan", "", 350, "Mellerud", "No dedicated spots, but works in many cases.", "Sweden", "58.7058060636534, 12.454113738931984", 6, "464 30", "IONITY, Mellerud" },
            //         { 3, "Nyponvägen 3", "", 300, "Ljungby", "Seem to be large charge points, but not confirmed.", "Sweden", "56.81218919027184, 13.909877973820073", null, "341 32", "Circle K Truck" },
            //         { 4, "Norra vägen 1", "", 150, "Karlsborg", "Unknown number of charging points and placement.", "Sweden", "58.544494784622344, 14.502399970551915", null, "546 34", "OKQ8" },
            //         { 5, "Ulvarydsvägen 2", "", 300, "Markaryd", "", "Sweden", "56.44481279040068, 13.60326467913148", 8, "285 35", "Allego charging station" },
            //         { 6, "Verkstadsgatan 3B", "", 240, "Perstorp", "Toilett and coffe machine(s).", "Sweden", "56.13384948475831, 13.388062564117424", 8, "284 34", "Rifil E.ON" },
            //         { 7, "Stridslyckegatan 4", "", 300, "Mjölby", "", "Sweden", "58.322298745345044, 15.092630394912435", 6, "595 35", "Quickcharge" },
            //         { 8, "Storgatan 46", "", 360, "Arvidsjaur", "", "Sweden", "65.58818018806531, 19.19007382489225", 2, "933 33", "Circle K/Ingo" },
            //         { 9, "Parkgatan 1", "", 360, "Gällivare", "", "Sweden", "67.13804586955752, 20.65923215302954", 4, "982 31", "Circle K" }
            //     });

            // migrationBuilder.CreateIndex(
            //     name: "IX_ChargePointComments_ChargePointId",
            //     table: "ChargePointComments",
            //     column: "ChargePointId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChargePointComments");

            migrationBuilder.DropTable(
                name: "ChargingPoints");
        }
    }
}
