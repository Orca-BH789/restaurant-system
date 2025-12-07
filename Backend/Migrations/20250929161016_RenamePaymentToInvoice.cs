using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class RenamePaymentToInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Đổi tên bảng
            migrationBuilder.RenameTable(
                name: "Payments",
                newName: "Invoices"
            );

            // Đổi tên index nếu có
            migrationBuilder.RenameIndex(
                name: "IX_Payments_OrderId",
                table: "Invoices",
                newName: "IX_Invoices_OrderId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_Payments_CreatedByUserId",
                table: "Invoices",
                newName: "IX_Invoices_CreatedByUserId"
            );

            // Nếu muốn đổi cột PaymentTime → CreatedAt (ví dụ)
            migrationBuilder.RenameColumn(
                name: "PaymentTime",
                table: "Invoices",
                newName: "CreatedAt"
            );

            // Nếu muốn đổi PaymentMethod → Method
            migrationBuilder.RenameColumn(
                name: "PaymentMethod",
                table: "Invoices",
                newName: "Method"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Đổi ngược lại
            migrationBuilder.RenameTable(
                name: "Invoices",
                newName: "Payments"
            );

            migrationBuilder.RenameIndex(
                name: "IX_Invoices_OrderId",
                table: "Payments",
                newName: "IX_Payments_OrderId"
            );

            migrationBuilder.RenameIndex(
                name: "IX_Invoices_CreatedByUserId",
                table: "Payments",
                newName: "IX_Payments_CreatedByUserId"
            );

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Payments",
                newName: "PaymentTime"
            );

            migrationBuilder.RenameColumn(
                name: "Method",
                table: "Payments",
                newName: "PaymentMethod"
            );
        }


    }
}
