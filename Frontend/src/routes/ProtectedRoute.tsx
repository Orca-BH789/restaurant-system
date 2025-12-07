import { Navigate } from "react-router-dom";
import { useAuth } from "../hook/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  role?: string;
  children: ReactNode;
}

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // ✅ Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Kiểm tra role nhưng cho phép customer truy cập public pages
  if (role && user.role.toLowerCase() !== role.toLowerCase()) {
    const isCustomer = user.role.toLowerCase() === "customer";
    const isAdmin = role.toLowerCase() === "admin";
    
    // Nếu là customer cố truy cập admin, redirect về home
    if (isCustomer && isAdmin) {
      return <Navigate to="/" replace />;
    }
    
    // Các trường hợp khác hiển thị lỗi
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-4">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}