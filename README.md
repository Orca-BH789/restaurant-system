# 🍽️ Restaurant Management System

Một hệ thống quản lý nhà hàng hoàn chỉnh với đặt bàn QR, thanh toán, danh sách bếp và cập nhật realtime.

## 📋 Tính năng chính

- 🎯 **Đặt bàn QR** - Khách hàng quét mã QR để đặt bàn và gọi món
- 💳 **Thanh toán** - Hỗ trợ PayPal, VietQR, SEPAY
- 👨‍🍳 **Danh sách bếp (KDS)** - Hiển thị đơn hàng real-time cho bếp
- 📊 **Báo cáo** - Thống kê doanh thu, chi phí, lợi nhuận
- 🤖 **AI Chatbot** - Hỗ trợ khách hàng bằng Gemini AI
- 👥 **Quản lý nhân viên** - Phân quyền Admin, Nhân viên, Bếp
- 📧 **Thông báo** - Email xác nhận đơn hàng, thanh toán
- 📱 **Responsive Design** - Chạy trên web, tablet, máy tính

## 🏗️ Cấu trúc project

```
restaurant-system/
├── Backend/              # ASP.NET Core 8.0 API
│   ├── Controllers/      # Các endpoint API
│   ├── Models/          # Database entities & DTOs
│   ├── Services/        # Business logic
│   ├── Migrations/      # Database changes
│   ├── appsettings.json # Cấu hình (template)
│   └── README.md        # Hướng dẫn Backend
│
├── Frontend/            # React + TypeScript
│   ├── src/
│   │   ├── pages/       # Các trang (Admin, Customer, POS)
│   │   ├── components/  # React components
│   │   └── services/    # API calls
│   ├── .env             # Biến môi trường (template)
│   └── README.md        # Hướng dẫn Frontend
│
└── SETUP.md            # Hướng dẫn cài đặt toàn bộ
```

## 🚀 Bắt đầu nhanh

### 1. Clone project
```bash
git clone https://github.com/Orca-BH789/restaurant-system.git
cd restaurant-system
```

### 2. Setup Backend
```bash
cd Backend
dotnet restore
# Copy appsettings.example.json -> appsettings.json
# Thêm credentials vào appsettings.json
dotnet ef database update
dotnet run
```

Backend chạy ở: `http://localhost:5000`

### 3. Setup Frontend
```bash
cd Frontend
npm install
# Copy .env.example -> .env
npm run dev
```

Frontend chạy ở: `http://localhost:5173`

## 🔑 Thông tin quan trọng

- 📖 **Backend docs**: Xem `Backend/README.md` để hiểu API chi tiết
- 📖 **Frontend docs**: Xem `Frontend/README.md` để hiểu pages & components
- ⚙️ **Setup guide**: Xem `SETUP.md` để cài đặt đầy đủ & secure

## 🛠️ Tech Stack

**Backend**:
- ASP.NET Core 8.0
- Entity Framework Core
- SQL Server
- SignalR (real-time)
- Swagger/OpenAPI

**Frontend**:
- React 18+ TypeScript
- Vite
- Ant Design + Tailwind CSS
- Axios
- React Router

## 📱 Tài khoản demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | Admin123! |
| Staff | staff@restaurant.com | Staff123! |
| Chef | chef@restaurant.com | Chef123! |

*(Tài khoản demo này chỉ ở dev, production sử dụng credentials thực)*

## 🔒 Bảo mật

- ✅ Tất cả credentials đã gỡ bỏ khỏi git
- ✅ Dùng `.env` & `appsettings.example.json` làm template
- ✅ Xem `SETUP.md` để biết cách setup keys an toàn

## 📞 Cần giúp?

- Xem `SETUP.md` để cài đặt chi tiết
- Xem `Backend/README.md` để hiểu API
- Xem `Frontend/README.md` để hiểu UI

## 👨‍💻 Branches

- `main` - Production branch
- `backend` - Backend development
- `frontend` - Frontend development

---

Made with ❤️ for restaurant management
