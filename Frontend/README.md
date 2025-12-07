# Restaurant Management System - Frontend

React + TypeScript web application cho hệ thống quản lý nhà hàng.

## 🚀 Features

### Customer Features
- **Menu Browsing**: Xem thực đơn, tìm kiếm, lọc
- **Cart Management**: Thêm/xóa món, cập nhật số lượng
- **Ordering**: Đặt hàng online, thanh toán
- **Payment**: PayPal, VietQR, SEPAY
- **Order Tracking**: Theo dõi trạng thái đơn hàng
- **Reservations**: Đặt bàn trước
- **Chat Bot**: Hỗ trợ AI chatbot
- **Promotions**: Xem mã giảm giá
- **Account**: Tạo tài khoản, quản lý profile

### Admin Features
- **Dashboard**: Thống kê doanh thu, số lượng đơn
- **Menu Management**: Quản lý danh mục, món ăn
- **Orders Management**: Xem, cập nhật, hủy đơn
- **Users Management**: Quản lý nhân viên, khách hàng
- **Tables Management**: Quản lý bàn, in QR code
- **Reports**: Báo cáo doanh thu, lợi nhuận
- **Settings**: Cấu hình hệ thống
- **Customers**: Quản lý thông tin khách hàng

### POS Features
- **Quick Ordering**: Giao diện POS nhanh
- **Table Selection**: Chọn bàn
- **Payment**: Tính tiền, tách bill, gộp bill
- **Kitchen Display**: Xem trạng thái bếp
- **Print Receipt**: In hóa đơn

## 📋 Tech Stack

- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: Ant Design / Tailwind CSS
- **State Management**: Context API + Custom Hooks
- **HTTP Client**: Axios
- **Real-time**: Socket.io / SignalR
- **Routing**: React Router v6
- **Form Handling**: React Hook Form
- **Validation**: Zod / Yup
- **Notifications**: Toast notifications
- **QR Code**: QR code generation/scanning

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/           # Reusable components
│   │   ├── layouts/         # Layout components (Admin, Customer, POS)
│   │   ├── modals/          # Modal dialogs
│   │   └── shared/          # Shared components (Toast, ChatBot, etc)
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   ├── customer/        # Customer pages
│   │   ├── chef/            # Chef/Kitchen pages
│   │   ├── pos/             # POS pages
│   │   └── auth/            # Auth pages (Login, Register)
│   ├── routes/              # Route definitions
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles
│   ├── config/              # Configuration
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── .env                     # Environment variables
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Modern web browser

### Step 1: Clone & Install
```bash
cd Frontend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL_PROD=https://yourdomain.com/core/api
VITE_API_BASE_URL_DEV=http://localhost:5000/core/api
```

### Step 3: Start Dev Server
```bash
npm run dev
```

Application sẽ chạy tại: `http://localhost:5173`

### Step 4: Build for Production
```bash
npm run build
```

Output folder: `dist/`

## 📦 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🎨 Pages Overview

### Authentication
- **Login** (`/login`) - Đăng nhập
- **Register** (`/register`) - Đăng ký
- **Forgot Password** (`/forgot-password`) - Quên mật khẩu
- **Reset Password** (`/reset-password`) - Đặt lại mật khẩu

### Customer
- **Home** (`/`) - Trang chủ
- **Menu** (`/menu`) - Xem thực đơn
- **Cart** (`/cart`) - Giỏ hàng
- **Checkout** (`/checkout`) - Thanh toán
- **Orders** (`/orders`) - Đơn hàng của tôi
- **Booking** (`/booking`) - Đặt bàn
- **Promotions** (`/promotions`) - Khuyến mãi
- **Profile** (`/profile`) - Thông tin cá nhân

### Admin
- **Dashboard** (`/admin/dashboard`) - Thống kê
- **Orders** (`/admin/orders`) - Quản lý đơn hàng
- **Menu** (`/admin/menu`) - Quản lý thực đơn
- **Categories** (`/admin/categories`) - Danh mục
- **Tables** (`/admin/tables`) - Quản lý bàn
- **Users** (`/admin/users`) - Quản lý nhân viên
- **Customers** (`/admin/customers`) - Khách hàng
- **Reservations** (`/admin/reservations`) - Đặt bàn
- **Invoices** (`/admin/invoices`) - Hóa đơn
- **Reports** (`/admin/reports`) - Báo cáo
- **Settings** (`/admin/settings`) - Cài đặt
- **Profile** (`/admin/profile`) - Hồ sơ cá nhân

### POS
- **Tables View** (`/pos/tables`) - Chọn bàn
- **Orders View** (`/pos/orders`) - Quản lý đơn
- **Payment** (`/pos/payment`) - Thanh toán
- **Reservations** (`/pos/reservations`) - Đặt bàn

### Chef
- **KDS Screen** (`/chef/kds`) - Màn hình bếp

## 🔐 Authentication

### JWT Token Flow
1. Đăng nhập → Nhận access token & refresh token
2. Gửi access token trong header: `Authorization: Bearer {token}`
3. Token hết hạn → Tự động refresh token
4. Refresh token hết hạn → Redirect đến login

### Role-based Access
- **Admin**: Quản lý hệ thống
- **Staff**: Nhân viên nhà hàng
- **Chef**: Đầu bếp
- **Customer**: Khách hàng

## 🔄 API Integration

### Services
```
services/
├── APIService.ts      # Base API client
├── RequestNotificationService.ts
```

### Usage
```typescript
import { apiClient } from '@/services/APIService';

// GET
const orders = await apiClient.get('/orders');

// POST
const newOrder = await apiClient.post('/orders', { items: [...] });

// PUT
await apiClient.put('/orders/123', { status: 'completed' });

// DELETE
await apiClient.delete('/orders/123');
```

## 🪝 Custom Hooks

### useAuth
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### useNotificationContext
```typescript
const { showToast } = useNotificationContext();
showToast('Success!', 'success');
```

## 🎯 Component Examples

### Layout
```typescript
import AdminLayout from '@/components/layouts/AdminLayout';

<AdminLayout>
  <YourContent />
</AdminLayout>
```

### Modal
```typescript
import CreateOrderModal from '@/components/modals/CreateOrderModal';

<CreateOrderModal 
  visible={isVisible} 
  onClose={handleClose}
  onSubmit={handleSubmit}
/>
```

### Toast
```typescript
showToast('Order created successfully!', 'success');
showToast('Error occurred!', 'error');
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: xs (320px), sm (576px), md (768px), lg (992px), xl (1200px)
- Tailwind CSS for responsive utilities

## 🚀 Performance Tips

- Code splitting with React.lazy()
- Image optimization
- Lazy loading
- Memoization with React.memo()
- useMemo, useCallback optimization

## 🧪 Testing

```bash
# Run tests
npm run test

# Coverage
npm run test:coverage
```

## 📚 Key Features Implementation

### Real-time Updates
- SignalR integration for order status
- Kitchen display updates
- Table status changes

### Payment Integration
- PayPal checkout flow
- VietQR code generation
- SEPAY payment handling

### QR Code Features
- Generate table QR codes
- Scan QR to view menu
- Mobile-friendly menu access

### File Upload
- Upload menu item images
- Upload customer avatar
- Image optimization

## 🐛 Troubleshooting

### API Not Connecting
- Kiểm tra `.env` configuration
- Kiểm tra backend server đang chạy
- Kiểm tra CORS settings

### Authentication Issues
- Clear localStorage
- Check JWT token expiry
- Re-login

### Styles Not Applied
- Clear cache: `npm run build && rm -rf dist`
- Check Tailwind configuration

## 🔗 Environment Variables

```bash
# Development
VITE_API_BASE_URL_DEV=http://localhost:5000/core/api

# Production
VITE_API_BASE_URL_PROD=https://yourdomain.com/core/api
```

## 📚 Additional Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev)
- [Ant Design](https://ant.design)
- [Tailwind CSS](https://tailwindcss.com)

## 🐛 Known Issues

- Mobile QR scanner on some browsers
- Payment redirect timeout

## 📄 License

Proprietary - Restaurant Management System

## 👥 Support

Liên hệ: support@restaurantmgmt.local
