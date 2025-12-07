import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import getApiBaseUrl from "../../utils/getApiBaseUrl";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    try {
      setLoading(true);
      
      // Gọi API thực tế
      await axios.post(
        `${getApiBaseUrl()}/Auth/forgot-password`, { 
        email: email 
      });

      setMessage("Yêu cầu đã được gửi! Vui lòng kiểm tra email để lấy link khôi phục.");
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error("Lỗi quên mật khẩu:", error);
      // Hiển thị lỗi từ server trả về hoặc lỗi mặc định
      setError(error.response?.data?.message || "Không tìm thấy email hoặc có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-amber-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h1>
              <p className="text-sm text-gray-500">Nhập email để nhận hướng dẫn</p>
            </div>
          </div>

          {/* Form hoặc Thông báo thành công */}
          {message ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm text-left">{message}</span>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="text-sm text-amber-600 hover:underline font-medium"
              >
                Gửi lại email khác?
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng ký</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-200 transition-all bg-gray-50 focus-within:bg-white">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vd: admin@email.com"
                    className="flex-1 outline-none text-sm bg-transparent text-gray-800 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                  loading
                    ? "bg-amber-300 cursor-not-allowed shadow-none"
                    : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {loading ? "Đang xử lý..." : <>Gửi link khôi phục <Send className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Footer Link */}
          <div className="mt-8 text-center border-t border-gray-100 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}