using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant_Management.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerForeignKeyToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
        IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Orders_Customer_CustomerId')
        BEGIN
            ALTER TABLE [Orders] DROP CONSTRAINT [FK_Orders_Customer_CustomerId];
        END;
    ");

            // STEP 2: Drop legacy indexes
            migrationBuilder.Sql(@"
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Reservations') AND name = 'IX_Reservations_CustomerPhone')
        BEGIN
            DROP INDEX [IX_Reservations_CustomerPhone] ON [Reservations];
        END;
    ");

            // STEP 3-4: Drop legacy columns
            migrationBuilder.Sql(@"
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'CustomerEmail')
            ALTER TABLE [Reservations] DROP COLUMN [CustomerEmail];
        
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'CustomerName')
            ALTER TABLE [Reservations] DROP COLUMN [CustomerName];
        
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'CustomerPhone')
            ALTER TABLE [Reservations] DROP COLUMN [CustomerPhone];
        
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CustomerName')
            ALTER TABLE [Orders] DROP COLUMN [CustomerName];
        
        IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'CustomerPhone')
            ALTER TABLE [Orders] DROP COLUMN [CustomerPhone];
    ");

            // STEP 5-6: Add CustomerId to Reservations
            migrationBuilder.Sql(@"
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservations') AND name = 'CustomerId')
            ALTER TABLE [Reservations] ADD [CustomerId] int NULL;
        
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Reservations') AND name = 'IX_Reservations_CustomerId')
            CREATE INDEX [IX_Reservations_CustomerId] ON [Reservations] ([CustomerId]);
    ");

            // STEP 7-8: Add Foreign Keys with NO ACTION
            migrationBuilder.Sql(@"
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Orders_Customer_CustomerId')
            ALTER TABLE [Orders]
            ADD CONSTRAINT [FK_Orders_Customer_CustomerId] 
            FOREIGN KEY ([CustomerId]) REFERENCES [Customer] ([Id]) 
            ON DELETE NO ACTION;
        
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Reservations_Customer_CustomerId')
            ALTER TABLE [Reservations]
            ADD CONSTRAINT [FK_Reservations_Customer_CustomerId] 
            FOREIGN KEY ([CustomerId]) REFERENCES [Customer] ([Id]) 
            ON DELETE NO ACTION;
    ");

            // STEP 9-10: Migrate existing data
            migrationBuilder.Sql(@"
        -- Insert customers from Orders
        INSERT INTO Customer (FullName, Phone, Email, CreatedAt, UpdatedAt)
        SELECT DISTINCT 
            ISNULL(NULLIF(o.CustomerName, ''), 'Khách tại bàn'),
            o.CustomerPhone,
            NULL,
            GETUTCDATE(),
            GETUTCDATE()
        FROM Orders o
        WHERE o.CustomerPhone IS NOT NULL 
            AND o.CustomerPhone != ''
            AND NOT EXISTS (SELECT 1 FROM Customer c WHERE c.Phone = o.CustomerPhone);

        -- Link Orders to Customers
        UPDATE Orders
        SET CustomerId = c.Id
        FROM Orders o
        INNER JOIN Customer c ON c.Phone = o.CustomerPhone
        WHERE o.CustomerId IS NULL 
            AND o.CustomerPhone IS NOT NULL;

        -- Link Reservations to Customers
        UPDATE Reservations
        SET CustomerId = c.Id
        FROM Reservations r
        INNER JOIN Customer c ON c.Phone = r.CustomerPhone
        WHERE r.CustomerId IS NULL
            AND r.CustomerPhone IS NOT NULL;
    ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Customer_CustomerId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_CustomerId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Reservations");

            migrationBuilder.AddColumn<string>(
                name: "CustomerEmail",
                table: "Reservations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Reservations",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                table: "Reservations",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Orders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                table: "Orders",
                type: "nvarchar(15)",
                maxLength: 15,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CustomerPhone",
                table: "Reservations",
                column: "CustomerPhone");
        }
    }
}
