# Restaurant Management System - Backend

ASP.NET Core 8.0 REST API cho hệ thống quản lý nhà hàng toàn diện.

## 🚀 Features

### Core Features
- **Authentication & Authorization**: JWT-based authentication, role-based access control
- **Menu Management**: Quản lý danh mục, món ăn, giá cả
- **Order Management**: Tạo, cập nhật, hủy đơn hàng
- **Table Management**: Quản lý bàn, QR code, tình trạng bàn
- **Payment**: Hỗ trợ PayPal, VietQR, SEPAY
- **Customer Management**: Quản lý khách hàng, lịch sử mua hàng
- **Reservations**: Hệ thống đặt bàn trước
- **Promotions**: Mã giảm giá, chương trình khuyến mãi
- **Reports & Analytics**: Báo cáo doanh thu, lợi nhuận
- **AI Chat Bot**: Chatbot hỗ trợ khách hàng (Gemini)
- **Kitchen Display**: Màn hình hiển thị bếp (KDS) theo thời gian thực

## 📋 Tech Stack

- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server (Entity Framework Core)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: SignalR (Kitchen Hub)
- **APIs**: RESTful API, Google Gemini AI
- **Payments**: PayPal SDK, VietQR, SEPAY
- **Background Jobs**: Hangfire
- **Email**: MailKit (SMTP)
- **Validation**: FluentValidation
- **Mapping**: AutoMapper

## 📁 Project Structure

```
Backend/
├── Controllers/          # API endpoints
│   ├── AuthController
│   ├── OrdersController
│   ├── MenuItemsController
│   ├── TablesController
│   ├── PaymentsController
│   └── ...
├── Services/            # Business logic
│   ├── AI/             # AI & Chatbot services
│   ├── Email/          # Email services
│   ├── Payment/        # Payment processing
│   ├── Reservation/    # Reservation logic
│   └── Promotion/      # Promotion handling
├── Models/
│   ├── Entities/       # Database entities
│   └── DTO/            # Data Transfer Objects
├── Data/               # Database context
├── Migrations/         # EF Core migrations
├── Middleware/         # Custom middleware
├── Helpers/            # Utility functions
├── Hub/                # SignalR hubs (KitchenHub)
├── Utils/              # Utilities
└── appsettings.json   # Configuration
```

## 🔧 Setup & Installation

### Prerequisites
- .NET 8.0 SDK or later
- SQL Server 2019+ or LocalDB
- Visual Studio 2022 / VS Code

### Step 1: Clone & Setup
```bash
cd Backend
cp .env.example .env
cp appsettings.example.json appsettings.json
```

### Step 2: Configure Environment
Edit `.env` và `appsettings.json`:
- JWT secret keys
- Database connection string
- Email credentials (Gmail SMTP)
- API keys (Gemini, PayPal, VietQR)

### Step 3: Database Migration
```bash
dotnet ef database update
```

### Step 4: Run Application
```bash
dotnet run
```

Server sẽ chạy tại: `http://localhost:5000`

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `PUT /api/orders/{id}` - Cập nhật đơn hàng
- `DELETE /api/orders/{id}` - Hủy đơn hàng

### Menu Items
- `GET /api/menu-items` - Lấy thực đơn
- `POST /api/menu-items` - Thêm món mới
- `PUT /api/menu-items/{id}` - Cập nhật món
- `DELETE /api/menu-items/{id}` - Xóa món

### Tables
- `GET /api/tables` - Lấy danh sách bàn
- `POST /api/tables` - Tạo bàn mới
- `PUT /api/tables/{id}` - Cập nhật bàn
- `POST /api/tables/{id}/qr` - Tạo QR code cho bàn

### Payments
- `POST /api/payments/paypal` - Thanh toán PayPal
- `POST /api/payments/vietqr` - Thanh toán VietQR
- `GET /api/payments/{id}` - Trạng thái thanh toán

### Reservations
- `GET /api/reservations` - Danh sách đặt bàn
- `POST /api/reservations` - Tạo đặt bàn
- `PUT /api/reservations/{id}` - Cập nhật đặt bàn

### AI Chat
- `POST /api/ai-chat/message` - Gửi tin nhắn đến chatbot
- `GET /api/ai-chat/history` - Lịch sử chat

Xem đầy đủ tại [API Documentation](./Restaurant_Management.http)

## 🔐 Security

- JWT token expiry: 24 hours
- Password hashing: BCrypt with pepper
- CORS: Whitelist domains
- SQL Injection protection: Parameterized queries
- XSS protection: Input validation & output encoding
- Rate limiting: AspNetCoreRateLimit

## 📊 Database Schema

### Main Tables
- **Users**: Người dùng hệ thống
- **Orders**: Đơn hàng
- **OrderDetails**: Chi tiết đơn hàng
- **MenuItems**: Các món ăn
- **Categories**: Danh mục
- **Tables**: Bàn ăn
- **Invoices**: Hóa đơn
- **Payments**: Thanh toán
- **Reservations**: Đặt bàn
- **Customers**: Khách hàng
- **Promotions**: Khuyến mãi

## 🔄 Real-time Features

### Kitchen Hub (SignalR)
```csharp
// Gửi cập nhật bếp
await kitchenHub.Clients.All.SendAsync("OrderReceived", order);
await kitchenHub.Clients.All.SendAsync("OrderCompleted", orderId);
```

## 🤖 AI Chat Bot

Sử dụng Google Gemini API:
- Tư vấn menu cho khách
- Trả lời câu hỏi về nhà hàng
- Gợi ý mon theo sở thích
- Xử lý yêu cầu đơn hàng

## 💳 Payment Integration

### PayPal
- Sandbox mode cho testing
- IPN webhooks cho xác nhận

### VietQR / SEPAY
- QR code thanh toán
- Polling kiểm tra trạng thái

## 📧 Email Service

- SMTP via Gmail
- Gửi xác nhận đơn hàng
- Gửi lại mật khẩu
- Thông báo promotion

## 📈 Reports

- Doanh thu theo ngày/tháng
- Lợi nhuận
- Món ăn bán chạy
- Khách hàng trung thành

## 🧪 Testing

```bash
# Run tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverageAttribute=true
```

## 📝 Logging

- Console logging (development)
- File logging (production)
- Structured logging với Serilog

## 🚢 Deployment

### Azure App Service
```bash
dotnet publish -c Release
# Deploy folder to Azure
```

### Docker
```bash
docker build -t restaurant-api .
docker run -p 5000:80 restaurant-api
```

## 🛠️ Development

### VS Code
```bash
code .
```

### Visual Studio 2022
```bash
start Restaurant_Management.sln
```

## 📚 Additional Resources

- [ASP.NET Core Docs](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [SignalR Documentation](https://docs.microsoft.com/aspnet/core/signalr)
- [Google Gemini API](https://aistudio.google.com)

## 🐛 Troubleshooting

### Database Connection Error
- Kiểm tra connection string trong `appsettings.json`
- Đảm bảo SQL Server đang chạy
- Kiểm tra firewall rules

### JWT Token Invalid
- Kiểm tra `JWT_KEY` trong `.env`
- Kiểm tra token expiry time
- Refresh token nếu hết hạn

### Email Not Sending
- Bật "Less secure app access" cho Gmail
- Sử dụng App Password thay vì mật khẩu thường
- Kiểm tra SMTP settings

## 📄 License

Proprietary - Restaurant Management System

## 👥 Support

Liên hệ: support@restaurantmgmt.local
