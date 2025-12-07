# 🍽️ Restaurant Management System

A complete restaurant management system with QR table ordering, payments, kitchen display system, and real-time operations.

## 📋 Features

- 🎯 **QR Table Ordering** - Customers scan QR codes to order from tables
- 💳 **Payments** - Support PayPal, VietQR, SEPAY
- 👨‍🍳 **Kitchen Display System (KDS)** - Real-time order display for kitchen
- 📊 **Reports** - Revenue, expenses, and profit statistics
- 🤖 **AI Chatbot** - Customer support powered by Gemini AI
- 👥 **Staff Management** - Role-based permissions (Admin, Staff, Chef)
- 📧 **Notifications** - Order and payment email confirmations
- 📱 **Responsive Design** - Works on web, tablets, and desktop

## 🏗️ Project Structure

```
restaurant-system/
├── Backend/              # ASP.NET Core 8.0 API
│   ├── Controllers/      # API endpoints
│   ├── Models/          # Database entities & DTOs
│   ├── Services/        # Business logic
│   ├── Migrations/      # Database schema changes
│   ├── appsettings.json # Config file (template)
│   └── README.md        # Backend documentation
│
├── Frontend/            # React + TypeScript
│   ├── src/
│   │   ├── pages/       # Pages (Admin, Customer, POS)
│   │   ├── components/  # React components
│   │   └── services/    # API calls
│   ├── .env             # Environment variables (template)
│   └── README.md        # Frontend documentation
│
└── SETUP.md            # Complete setup guide
```

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/Orca-BH789/restaurant-system.git
cd restaurant-system
```

### 2. Setup Backend
```bash
cd Backend
dotnet restore
# Copy appsettings.example.json -> appsettings.json
# Add credentials to appsettings.json
dotnet ef database update
dotnet run
```

Backend runs at: `http://localhost:5000`

### 3. Setup Frontend
```bash
cd Frontend
npm install
# Copy .env.example -> .env
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 🔑 Important Links

- 📖 **Backend docs**: See `Backend/README.md` for detailed API documentation
- 📖 **Frontend docs**: See `Frontend/README.md` for pages & components
- ⚙️ **Setup guide**: See `SETUP.md` for complete setup & security

## 🛠️ Tech Stack

**Backend**:
- ASP.NET Core 8.0
- Entity Framework Core
- SQL Server
- SignalR (real-time updates)
- Swagger/OpenAPI

**Frontend**:
- React 18+ with TypeScript
- Vite
- Ant Design + Tailwind CSS
- Axios
- React Router

## 📱 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | Admin123! |
| Staff | staff@restaurant.com | Staff123! |
| Chef | chef@restaurant.com | Chef123! |

*(Demo accounts for development only, use real credentials in production)*

## 🔒 Security

- ✅ All credentials removed from git history
- ✅ Using `.env` & `appsettings.example.json` as templates
- ✅ See `SETUP.md` for secure key setup

## 📞 Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `Backend/README.md` for API details
- Check `Frontend/README.md` for UI details

## 👨‍💻 Branches

- `main` - Production branch
- `backend` - Backend development
- `frontend` - Frontend development

---

Made with ❤️ for restaurant management
