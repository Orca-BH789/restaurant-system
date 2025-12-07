using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    public partial class AddHistoryReportNotification : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ============= HISTORYLOG TABLE =============
            migrationBuilder.CreateTable(
                name: "HistoryLogs",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    Entity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<int>(nullable: false),

                    Action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),

                    OldData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewData = table.Column<string>(type: "nvarchar(max)", nullable: true),

                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),

                    UserId = table.Column<int>(nullable: true),

                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false,
                        defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoryLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoryLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HistoryLog_Entity_EntityId",
                table: "HistoryLogs",
                columns: new[] { "Entity", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_HistoryLog_UserId",
                table: "HistoryLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoryLog_CreatedAt",
                table: "HistoryLogs",
                column: "CreatedAt");



            // ============= REPORTCACHE TABLE =============
            migrationBuilder.CreateTable(
                name: "ReportCaches",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    ReportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),

                    ReportDate = table.Column<DateTime>(type: "date", nullable: false),

                    DataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),

                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false,
                        defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportCaches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "UQ_ReportCache_Type_Date",
                table: "ReportCaches",
                columns: new[] { "ReportType", "ReportDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportCache_ReportDate",
                table: "ReportCaches",
                column: "ReportDate");



            // ============= NOTIFICATIONS TABLE =============
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),

                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),

                    TargetRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),

                    TableId = table.Column<int>(nullable: true),
                    OrderId = table.Column<int>(nullable: true),
                    ReferenceId = table.Column<int>(nullable: true),

                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),

                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: true),

                    IsRead = table.Column<bool>(nullable: false, defaultValue: false),

                    ReadBy = table.Column<int>(nullable: true),

                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false,
                        defaultValueSql: "SYSUTCDATETIME()"),

                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);

                    table.ForeignKey(
                        name: "FK_Notifications_Users_ReadBy",
                        column: x => x.ReadBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notification_TargetRole",
                table: "Notifications",
                column: "TargetRole");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_OrderId",
                table: "Notifications",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_TableId",
                table: "Notifications",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_IsRead",
                table: "Notifications",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");



            // ============= Email fix (giữ nguyên code cũ của ông) =============
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // DROP 3 BẢNG
            migrationBuilder.DropTable(name: "Notifications");
            migrationBuilder.DropTable(name: "ReportCaches");
            migrationBuilder.DropTable(name: "HistoryLogs");

            // REVERT Email
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);
        }
    }
}
