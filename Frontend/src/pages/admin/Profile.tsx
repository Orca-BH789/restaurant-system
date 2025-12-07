import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../hook/useAuth';
import {
  User,
  Mail,
  Phone,
  Lock,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Shield,
  LogOut,
} from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface Notification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Edit form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/Users/profile`);
      setProfile(response.data);
      setFormData({
        fullName: response.data.fullName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      showNotification('error', 'Lỗi khi tải thông tin profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Tên đầy đủ là bắt buộc';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^(03|05|07|08|09)\d{8}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ (0912345678)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.oldPassword) {
      errors.oldPassword = 'Mật khẩu cũ là bắt buộc';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/users/profile`, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      showNotification('success', 'Cập nhật thông tin thành công');
      setEditing(false);
      await fetchProfile();
    } catch (error: unknown) {
      const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi cập nhật thông tin';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/users/${profile?.id}/change-password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      showNotification('success', 'Đổi mật khẩu thành công');
      setShowChangePassword(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setFormErrors({});
    } catch (error: unknown) {
      const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi đổi mật khẩu';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-gray-600">Không thể tải thông tin profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-6 py-3 rounded-lg shadow-xl text-white flex items-center gap-2 animate-slide-in ${
              notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {notif.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {notif.message}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Thông tin cá nhân</h1>
        <p className="text-gray-600 mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: PROFILE CARD */}
        <div className="lg:col-span-2 space-y-6">
          {/* PROFILE INFO CARD */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Tên đầy đủ
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên đầy đủ"
                  />
                  {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Số điện thoại
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0912345678"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        fullName: profile.fullName,
                        email: profile.email,
                        phone: profile.phone,
                      });
                      setFormErrors({});
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tên đầy đủ</p>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      {profile.fullName}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tên đăng nhập</p>
                    <p className="text-lg font-semibold text-gray-900">{profile.username}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-red-600" />
                      {profile.email}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Số điện thoại</p>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      {profile.phone || '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Vai trò</p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                        {profile.role}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Trạng thái</p>
                    <div className="flex items-center gap-2">
                      {profile.isActive ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-lg font-semibold text-green-600">Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-lg font-semibold text-red-600">Vô hiệu</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CHANGE PASSWORD CARD */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Bảo mật</h2>
              {!showChangePassword && (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {showChangePassword ? (
              <div className="space-y-4">
                {/* Old Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Mật khẩu cũ
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.old ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 ${
                        formErrors.oldPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập mật khẩu cũ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.oldPassword && <p className="text-red-500 text-sm mt-1">{formErrors.oldPassword}</p>}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Mật khẩu mới
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 ${
                        formErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.newPassword && <p className="text-red-500 text-sm mt-1">{formErrors.newPassword}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Xác nhận mật khẩu
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10 ${
                        formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                      setFormErrors({});
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900">Bảo vệ tài khoản của bạn</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Thay đổi mật khẩu định kỳ để bảo vệ tài khoản. Hãy sử dụng mật khẩu mạnh với chữ cái, số và ký tự đặc biệt.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: ACCOUNT INFO */}
        <div className="space-y-6">
          {/* ACCOUNT SUMMARY */}
          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Tài khoản</p>
                <p className="text-lg font-bold">{profile.username}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">            
              <div className="flex justify-between items-center pb-3 border-b border-white/20">
                <span className="opacity-90">Vai trò:</span>
                <span className="font-semibold">{profile.role}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/20">
                <span className="opacity-90">Trạng thái:</span>
                <span className="font-semibold">{profile.isActive ? '✓ Hoạt động' : '✗ Vô hiệu'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-90">Ngày tạo:</span>
                <span className="font-semibold">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* LAST LOGIN */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Hoạt động gần đây
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Lần đăng nhập cuối</p>
                <p className="text-sm font-semibold text-gray-900">
                  {profile.lastLoginAt
                    ? new Date(profile.lastLoginAt).toLocaleString('vi-VN')
                    : 'Chưa có thông tin'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Tài khoản được tạo</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(profile.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
