import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Lấy dữ liệu từ URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Đường dẫn không hợp lệ hoặc thiếu thông tin xác thực.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      
      await axios.post(
        `${getApiBaseUrl()}/Auth/reset-password`,
        {
          email: email,
          token: token, 
          newPassword: password,
          confirmPassword: confirmPassword
        }
      );

      setSuccess(true);
      
      // Tự động chuyển trang sau 3 giây
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Lỗi đổi mật khẩu:", error);
      setError(error.response?.data?.message || "Token đã hết hạn hoặc không hợp lệ.");
    } finally {
      setLoading(false);
    }
  };

  // Màn hình thành công
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-amber-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đổi mật khẩu thành công!</h2>
          <p className="text-gray-500 mb-8">Mật khẩu mới đã được cập nhật. Bạn sẽ được chuyển về trang đăng nhập trong giây lát...</p>
          <button 
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition shadow-md"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-amber-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Đặt lại mật khẩu</h1>
              <p className="text-sm text-gray-500">Tạo mật khẩu mới an toàn hơn</p>
            </div>
          </div>

          {/* Nếu không có token hợp lệ ngay từ đầu */}
          {!token || !email ? (
             <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
               <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
               <p className="text-red-800 text-sm font-medium">{error}</p>
               <Link to="/forgot-password" className="text-sm text-red-600 underline mt-2 inline-block">Gửi lại yêu cầu</Link>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mật khẩu mới */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mật khẩu mới</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-200 bg-gray-50 focus-within:bg-white transition-all">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 outline-none text-sm bg-transparent text-gray-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nhập lại mật khẩu</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-200 bg-gray-50 focus-within:bg-white transition-all">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 outline-none text-sm bg-transparent text-gray-800"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                 {error}
              </div>}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold transition-all shadow-md ${
                  loading
                    ? "bg-amber-300 cursor-not-allowed shadow-none"
                    : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}