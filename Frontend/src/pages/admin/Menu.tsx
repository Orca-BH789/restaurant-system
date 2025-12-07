import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog } from "@headlessui/react";
import { X, Plus, Edit2, Trash2, Image, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  category?: { id: number; name: string };
  price: number;
  costPrice: number;
  unit: string;
  preparationTime: number;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string;
}

interface MenuItemPayload {
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  costPrice: number;
  unit: string;
  preparationTime: number;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  imageFile?: string;
  fileName?: string;
}

export default function MenuItems() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ base64: string; name: string } | null>(null);

  // Filter & Sort & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof MenuItem>("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 7;

  const [form, setForm] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    costPrice: 0,
    unit: "Phần",
    preparationTime: 15,
    isAvailable: true,
    isActive: true,
    sortOrder: 0,
    categoryId: 0,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleAuthError = (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      window.location.href = "/login";
      return true;
    }
    return false;
  };

  useEffect(() => {
    (async () => {
      try {
        const baseURL = getApiBaseUrl();
        const [catRes, menuRes] = await Promise.all([
          axios.get<Category[]>(`${baseURL}/Categories`, {
            headers: getAuthHeaders(),
          }),
          axios.get<MenuItem[]>(`${baseURL}/MenuItems`, {
            headers: getAuthHeaders(),
          }),
        ]);
        setCategories(catRes.data);
        setMenu(menuRes.data);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        if (handleAuthError(err)) return;
      }
    })();
  }, []);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Full = reader.result as string;
      const base64Data = base64Full.split(",")[1];
      
      setPreview(base64Full);
      setSelectedFile({
        base64: base64Data,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const openDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
      setPreview(item.imageUrl || null);
      setSelectedFile(null);
    } else {
      setEditingItem(null);
      setForm({
        name: "",
        description: "",
        price: 0,
        costPrice: 0,
        unit: "Phần",
        preparationTime: 15,
        isAvailable: true,
        isActive: true,
        sortOrder: 0,
        categoryId: categories[0]?.id || 0,
      });
      setPreview(null);
      setSelectedFile(null);
    }
    setOpen(true);
  };

  const saveMenuItem = async () => {
    try {
      if (!form.name || !form.price || form.price <= 0) {
        alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
        return;
      }

      const payload: MenuItemPayload = {
        name: form.name!,
        description: form.description,
        categoryId: form.categoryId!,
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        unit: form.unit || "Phần",
        preparationTime: form.preparationTime || 15,
        isAvailable: form.isAvailable ?? true,
        isActive: form.isActive ?? true,
        sortOrder: form.sortOrder || 0,
      };

      if (selectedFile) {
        payload.imageFile = selectedFile.base64;
        payload.fileName = selectedFile.name;
      }

      if (editingItem) {
        const baseURL = getApiBaseUrl();
        const res = await axios.put(
          `${baseURL}/MenuItems/${editingItem.id}`,
          payload,
          { headers: getAuthHeaders() }
        );
        setMenu(menu.map((m) => (m.id === editingItem.id ? res.data : m)));
      } else {
        const baseURL = getApiBaseUrl();
        const res = await axios.post(
          `${baseURL}/MenuItems`,
          payload,
          { headers: getAuthHeaders() }
        );
        setMenu([...menu, res.data]);
      }

      setOpen(false);
      alert("✅ Lưu món thành công!");
    } catch (err) {
      console.error("❌ Lỗi lưu món:", err);
      if (handleAuthError(err)) return;
      if (axios.isAxiosError(err)) {
        alert(`Lỗi: ${err.response?.data?.message || err.message}`);
      } else {
        alert("Không thể lưu món!");
      }
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Xóa món này?")) return;
    try {
      const baseURL = getApiBaseUrl();
      await axios.delete(`${baseURL}/MenuItems/${id}`, {
        headers: getAuthHeaders(),
      });
      setMenu(menu.filter((m) => m.id !== id));
      alert("✅ Xóa thành công!");
    } catch (err) {
      console.error("❌ Lỗi xóa:", err);
      if (handleAuthError(err)) return;
      alert("Không thể xóa món!");
    }
  };

  // Filter & Sort
  const filteredMenu = menu.filter((item) => {
    const matchSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !filterCategory || item.categoryId === Number(filterCategory);
    return matchSearch && matchCategory;
  });

  const sortedMenu = [...filteredMenu].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }
    if (typeof aVal === "number") {
      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedMenu.length / itemsPerPage);
  const paginatedMenu = sortedMenu.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof MenuItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý thực đơn</h1>
              <p className="text-gray-600">Quản lý các món ăn trong nhà hàng</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setMenu(menu);
                }}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => openDialog()}
                className="flex items-center justify-center gap-2 bg-linear-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                <span className="font-semibold">Thêm món mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm tên món, mô tả..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Hiển thị {paginatedMenu.length} / {sortedMenu.length} món ({menu.length} tổng cộng)
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Ảnh</th>
                  <th
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("name")}
                  >
                    Tên món {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Mô tả</th>
                  <th
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("price")}
                  >
                    Giá bán {sortField === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("costPrice")}
                  >
                    Giá vốn {sortField === "costPrice" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                    onClick={() => handleSort("categoryId")}
                  >
                    Danh mục {sortField === "categoryId" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Chế biến</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Trạng thái</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMenu.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      {sortedMenu.length === 0 && (searchTerm || filterCategory)
                        ? "Không tìm thấy món ăn"
                        : "Chưa có dữ liệu"}
                    </td>
                  </tr>
                ) : (
                  paginatedMenu.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        {m.imageUrl ? (
                          <img
                            src={"https://webdemocuahangtraicay.io.vn/core" + m.imageUrl}
                            alt={m.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Image size={24} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.unit}</div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="text-sm text-gray-600 truncate">
                          {m.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-green-600">{formatCurrency(m.price)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-600">{formatCurrency(m.costPrice)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {m.category?.name || categories.find((c) => c.id === m.categoryId)?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-gray-700">{m.preparationTime} phút</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${m.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {m.isAvailable ? '✓ Còn món' : '✗ Hết món'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${m.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {m.isActive ? '👁 Hiển thị' : '🔒 Ẩn'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openDialog(m)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteItem(m.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <Dialog.Title className="text-2xl font-bold text-gray-800">
                {editingItem ? "✏️ Chỉnh sửa món" : "➕ Thêm món mới"}
              </Dialog.Title>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên món <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên món ăn"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  placeholder="Mô tả chi tiết về món ăn"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={form.price?.toLocaleString() || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: Number(e.target.value.replace(/\D/g, "")),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giá vốn (VNĐ)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={form.costPrice?.toLocaleString() || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        costPrice: Number(e.target.value.replace(/\D/g, "")),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Đơn vị</label>
                  <input
                    type="text"
                    placeholder="Phần, Ly, Suất..."
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian chế biến (phút)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={form.preparationTime}
                    onChange={(e) =>
                      setForm({ ...form, preparationTime: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Thứ tự hiển thị</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-6 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm({ ...form, isAvailable: e.target.checked })
                    }
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Còn món</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Hiển thị trên menu</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh món ăn</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="preview"
                        className="w-32 h-32 object-cover rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Image size={48} className="text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm text-gray-600 font-medium">
                      {preview ? "Nhấn để thay đổi ảnh" : "Nhấn để chọn ảnh"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setOpen(false)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={saveMenuItem}
                className="px-6 py-3 bg-linear-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                {editingItem ? "Cập nhật" : "Thêm món"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}