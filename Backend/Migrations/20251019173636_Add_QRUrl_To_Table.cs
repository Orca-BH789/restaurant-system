using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class Add_QRUrl_To_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QrCodeUrl",
                table: "Tables",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QrCodeUrl",
                table: "Tables");
        }
    }
}
