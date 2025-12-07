import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hook/useAuth";

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: number;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface CreateUserForm {
  username?: string;
  password?: string;
  email: string;
  fullName: string;
  phone: string;
  role: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const UserRole: Record<number, { label: string; color: string }> = {
  1: { label: "Admin", color: "bg-purple-100 text-purple-800" },
  2: { label: "Manager", color: "bg-blue-100 text-blue-800" },
  3: { label: "Staff", color: "bg-gray-100 text-gray-800" },
  5: { label: "Cheff", color: "bg-gray-100 text-black-800" }
};

export default function Users() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<CreateUserForm>>({});

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "locked">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<keyof User>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: "", message: "", onConfirm: () => {} });

  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "success", message: "" });
    }, 3000);
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const fetchUsers = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get("/Users");
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch {
      setError("Không thể tải danh sách người dùng.");
    }
  }, [api]);

  // Filter & Search Effect
  useEffect(() => {
    let result = [...users];

    // Search
    if (searchTerm) {
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }

    // Filter by Role
    if (filterRole !== "") {
      result = result.filter(user => user.role === filterRole);
    }

    // Filter by Status
    if (filterStatus === "active") {
      result = result.filter(user => user.isActive && !user.isLocked);
    } else if (filterStatus === "inactive") {
      result = result.filter(user => !user.isActive);
    } else if (filterStatus === "locked") {
      result = result.filter(user => user.isLocked);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus, sortField, sortOrder]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "Admin") {
      showNotification("error", "⛔ Chỉ Admin mới có quyền truy cập.");
      setTimeout(() => navigate("/dashboard"), 2000);
      return;
    }
    fetchUsers();
  }, [fetchUsers, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "role" ? Number(value) : value,
    }));
  };

  const openAdd = () => {
    setSelectedUser(null);
    setForm({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: 3,
    });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName) {
      showNotification("error", "Họ tên là bắt buộc!");
      return;
    }

    if (!selectedUser && (!form.password || form.password.length < 6)) {
      showNotification("error", "Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      if (selectedUser) {
        await api.put(`/Users/${selectedUser.id}`, {
          fullName: form.fullName,
          email: form.email || "",
          phone: form.phone || "",
          role: form.role,
        });
        showNotification("success", "✅ Cập nhật thành công!");
      } else {
        await api.post("/Users", form);
        showNotification("success", "✅ Thêm người dùng thành công!");
      }
      await fetchUsers();
      setShowModal(false);
    } catch (err) {
      const error = err as ApiError;
      const msg = error.response?.data?.message || "Không thể lưu người dùng.";
      showNotification("error", msg);
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirmation(`Xóa "${name}"?`, "Không thể hoàn tác!", async () => {
      try {
        await api.delete(`/Users/${id}`);
        showNotification("success", "✅ Xóa thành công!");
        await fetchUsers();
      } catch {
        showNotification("error", "Không thể xóa người dùng.");
      }
    });
  };

  const toggleActive = async (user: User) => {
    try {
      await api.post(`/Users/${user.id}/toggle-active`);
      showNotification(
        "success",
        `✅ ${user.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt"}`
      );
      await fetchUsers();
    } catch {
      showNotification("error", "Lỗi khi thay đổi trạng thái.");
    }
  };

  const toggleLock = (user: User) => {
    showConfirmation(
      user.isLocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?",
      `Tài khoản: ${user.fullName}`,
      async () => {
        try {
          if (user.isLocked) {
            await api.post(`/Users/${user.id}/unlock`);
          } else {
            await api.post(`/Users/${user.id}/lock`, { lockedUntil: null });
          }
          showNotification(
            "success",
            user.isLocked ? "✅ Đã mở khóa!" : "✅ Đã khóa tài khoản!"
          );
          await fetchUsers();
        } catch {
          showNotification("error", "Không thể thay đổi trạng thái khóa.");
        }
      }
    );
  };

  const resetPassword = (user: User) => {
    showConfirmation("Reset mật khẩu?", user.fullName, async () => {
      try {
        await api.post(`/Users/${user.id}/reset-password`);
        showNotification("success", "🔑 Mật khẩu mới: 123456");
      } catch {
        showNotification("error", "Không thể reset mật khẩu.");
      }
    });
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToExcel = () => {
    const headers = [ "Họ và Tên", "Email", "SĐT", "Vai trò", "Trạng thái"];
    const rows = filteredUsers.map(user => [  
      user.fullName,
      user.email || "",
      "(VN)" + user.phone || "",
      UserRole[user.role]?.label || user.role.toString(),
      user.isLocked ? "Khóa" : user.isActive ? "Kích hoạt" : "Vô hiệu"
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification("success", "✅ Xuất file thành công!");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

 if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white rounded">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-xl ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-medium`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Người dùng</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
            title="Xuất Excel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Thêm
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tên, email, SĐT..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả vai trò</option>
              <option value="1">Admin</option>
              <option value="2">Manager</option>
              <option value="3">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="active">Kích hoạt</option>
              <option value="inactive">Vô hiệu hóa</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterRole("");
                setFilterStatus("all");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {currentUsers.length} / {filteredUsers.length} người dùng
          {filteredUsers.length !== users.length && ` (lọc từ ${users.length} tổng)`}
        </div>
      </div>

      {/* MODAL ADD/EDIT */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedUser ? "Cập nhật người dùng" : "Thêm người dùng mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {!selectedUser && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username <span className="text-gray-400 text-xs">(để trống để tự tạo)</span>
                        </label>
                        <input
                          name="username"
                          value={form.username || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tự động từ họ tên"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="password"
                          type="password"
                          value={form.password || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tối thiểu 6 ký tự"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input
                      name="phone"
                      value={form.phone || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0912345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={form.role || 3}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Chọn vai trò --</option>
                      <option value="1">Admin</option>
                      <option value="2">Manager</option>
                      <option value="3">Staff</option>
                      <option value="5">Cheff</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {selectedUser ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog.show && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{confirmDialog.title}</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">{confirmDialog.message}</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, show: false });
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th
                onClick={() => handleSort("id")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-2">
                  ID
                  {sortField === "id" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("fullName")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-2">
                  Tên
                  {sortField === "fullName" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("email")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-2">
                  Email
                  {sortField === "email" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SĐT</th>
              <th
                onClick={() => handleSort("role")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center gap-2">
                  Vai trò
                  {sortField === "role" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Active</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Khóa</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500">
                  {searchTerm || filterRole !== "" || filterStatus !== "all"
                    ? "Không tìm thấy kết quả"
                    : "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email || "-"}</td>
                  <td className="px-6 py-4 text-gray-600">{user.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${UserRole[user.role]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {UserRole[user.role]?.label || user.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <svg
                        onClick={() => toggleActive(user)}
                        className={`w-8 h-8 cursor-pointer transition-all ${
                          user.isActive
                            ? "text-green-500 hover:text-green-600"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <title>{user.isActive ? "Kích hoạt" : "Vô hiệu hóa"}</title>
                        <circle cx="10" cy="10" r="10" />
                        <path fill="white" d="M14.5 6.5l-5.5 5.5-2.5-2.5-1.5 1.5 4 4 7-7z" />
                      </svg>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <svg
                        onClick={() => toggleLock(user)}
                        className={`w-8 h-8 cursor-pointer transition-all ${
                          user.isLocked
                            ? "text-red-500 hover:text-red-600"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <title>{user.isLocked ? "Đã khóa" : "Chưa khóa"}</title>
                        <circle cx="10" cy="10" r="10" />
                        {user.isLocked ? (
                          <path fill="white" d="M10 5a3 3 0 00-3 3v1H6a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1v-4a1 1 0 00-1-1h-1V8a3 3 0 00-3-3zm1.5 3v1h-3V8a1.5 1.5 0 013 0z" />
                        ) : (
                          <path fill="white" d="M10 5a3 3 0 00-3 3v.5H6a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1v-4a1 1 0 00-1-1h-.5V8a3 3 0 00-3-3zm1.5 3.5h-3V8a1.5 1.5 0 013 0v.5z" />
                        )}
                      </svg>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => resetPassword(user)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Reset mật khẩu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.fullName)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-4">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, idx) => {
                const page = idx + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}