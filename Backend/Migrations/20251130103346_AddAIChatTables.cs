using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class AddAIChatTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AIChatConversation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    SessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    LastMessageAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    IntentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIChatConversation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIChatConversation_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AIChatActionLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: true),
                    ActionData = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    Result = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIChatActionLog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIChatActionLog_AIChatConversation_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "AIChatConversation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AIChatMessage",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConversationId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    Metadata = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIChatMessage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIChatMessage_AIChatConversation_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "AIChatConversation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActionLog_Entity",
                table: "AIChatActionLog",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_ActionLog_Type",
                table: "AIChatActionLog",
                columns: new[] { "ActionType", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AIChatActionLog_ConversationId",
                table: "AIChatActionLog",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatConversation_IsActive",
                table: "AIChatConversation",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatConversation_LastMessageAt",
                table: "AIChatConversation",
                column: "LastMessageAt");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatConversation_SessionId",
                table: "AIChatConversation",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatConversation_UserId",
                table: "AIChatConversation",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatMessage_ConversationId",
                table: "AIChatMessage",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_AIChatMessage_CreatedAt",
                table: "AIChatMessage",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIChatActionLog");

            migrationBuilder.DropTable(
                name: "AIChatMessage");

            migrationBuilder.DropTable(
                name: "AIChatConversation");
        }
    }
}
