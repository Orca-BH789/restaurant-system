using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderTableId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Drop PK cũ
            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderTables",
                table: "OrderTables");

            // 2) Add column Id
            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "OrderTables",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            // 3) Set new PK = Id
            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderTables",
                table: "OrderTables",
                column: "Id");

            // 4) Unique constraint cho OrderId - TableId
            migrationBuilder.CreateIndex(
                name: "IX_OrderTables_OrderId_TableId",
                table: "OrderTables",
                columns: new[] { "OrderId", "TableId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderTables",
                table: "OrderTables");

            migrationBuilder.DropIndex(
                name: "IX_OrderTables_OrderId_TableId",
                table: "OrderTables");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "OrderTables");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderTables",
                table: "OrderTables",
                columns: new[] { "OrderId", "TableId" });
        }

    }
}
