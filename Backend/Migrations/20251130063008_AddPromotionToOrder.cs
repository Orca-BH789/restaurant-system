using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AppliedPromotionId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_AppliedPromotionId",
                table: "Orders",
                column: "AppliedPromotionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Promotions_AppliedPromotionId",
                table: "Orders",
                column: "AppliedPromotionId",
                principalTable: "Promotions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Promotions_AppliedPromotionId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_AppliedPromotionId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AppliedPromotionId",
                table: "Orders");
        }
    }
}
