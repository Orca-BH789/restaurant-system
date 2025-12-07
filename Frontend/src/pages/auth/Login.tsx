import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hook/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const response = await login({
        username,
        password         
      });

      console.log("Login success:", response);

      if (remember) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      const role = localStorage.getItem("role");
      console.log("User role:", role);

       if (role === 'Admin') {
   
          navigate('/admin', { replace: true });
        } else {
          navigate('/pos', { replace: true });
        }
    
      
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
  
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-amber-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
              <p className="text-sm text-gray-500">
                Đăng nhập để vào khu vực quản trị
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-gray-600">Tên đăng nhập hoặc Email</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-amber-200">
              <User className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: admin hoặc admin@email.com"
                className="flex-1 outline-none text-sm text-gray-700"
                disabled={loading}
              />
            </div>

            <label className="block text-sm text-gray-600">Mật khẩu</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-amber-200">
              <Lock className="w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 outline-none text-sm text-gray-700"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="p-1 rounded focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4"
                  disabled={loading}
                />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
             <Link
                to="/forgot-password"
                className="text-amber-600 hover:underline text-sm"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* ✅ Hiển thị error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition ${
                loading
                  ? "bg-amber-300 cursor-not-allowed"
                  : "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow"
              }`}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}