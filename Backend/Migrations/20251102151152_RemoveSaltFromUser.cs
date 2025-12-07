using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSaltFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Settings",
                columns: new[] { "Id", "Description", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { 1, "Tên hiển thị hệ thống", "RestaurantName", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Nhà hàng Việt Thái" },
                    { 2, "Thuế suất mặc định (%)", "TaxRate", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "10" },
                    { 3, null, "Currency", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "VND" },
                    { 4, null, "AllowGuestOrder", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "true" }
                });
            migrationBuilder.DropColumn(
            name: "Salt",
            table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.AddColumn<string>(
               name: "Salt",
               table: "Users",
               type: "nvarchar(max)",
               nullable: false,
               defaultValue: "");
        }
    }
}
