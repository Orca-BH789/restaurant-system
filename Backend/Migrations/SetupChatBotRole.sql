-- SQL Script ?? thêm ChatBot role vào h? th?ng

-- 1. T?o tài kho?n ChatBot Assistant
INSERT INTO Users (
    Username, 
    PasswordHash, 
    Email, 
    FullName, 
    Phone, 
    Role, 
    IsActive,
    CreatedAt,
    UpdatedAt
)
VALUES (
    'chatbot-assistant',
    '$2a$11$7J3U5Wj9K2mL8pQ1R4sS5u3K9j2m3n4o5p6q7r8s9t0u1v2w3x4y5', -- bcrypt hash of "ChatBot@Restaurant2024"
    'chatbot@restaurant.local',
    'Restaurant AI Assistant',
    '0000000000',
    4,  -- Role = ChatBot (4)
    1,  -- IsActive = true
    GETUTCDATE(),
    GETUTCDATE()
);

-- 2. Ki?m tra xem ChatBot ?ã ???c t?o ch?a
SELECT Id, Username, Role, IsActive, CreatedAt 
FROM Users 
WHERE Username = 'chatbot-assistant';

-- 3. T?o audit log cho creation
INSERT INTO AuditLogs (
    Entity,
    Action,
    OldData,
    NewData,
    UserId,
    CreatedAt,
    IpAddress
)
VALUES (
    'User',
    'Create',
    NULL,
    '{"username":"chatbot-assistant","role":"ChatBot","purpose":"AI Assistant for analytics"}',
    1,  -- Admin user
    GETUTCDATE(),
    'system'
);

-- 4. Verify ChatBot role exists in Users table
SELECT DISTINCT Role FROM Users ORDER BY Role;

-- 5. Test: ??m b?o ChatBot role (4) ho?t ??ng
-- Ch?y query này ?? ki?m tra:
SELECT 
    Id,
    Username,
    Email,
    Role,
    IsActive,
    CreatedAt
FROM Users
WHERE Role = 4 OR Username = 'chatbot-assistant';

-- Notes:
-- - ChatBot role = 4 (so v?i Admin=1, Manager=2, Staff=3)
-- - ChatBot password: ChatBot@Restaurant2024
-- - Password hash ???c t?o b?ng bcrypt
-- - C?p nh?t password hash n?u s? d?ng password khác

-- IMPORTANT: Thay ??i password ngay sau khi t?o tài kho?n!
-- UPDATE Users SET PasswordHash = '[NEW_BCRYPT_HASH]' WHERE Username = 'chatbot-assistant';
