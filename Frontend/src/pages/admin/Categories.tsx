import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hook/useAuth";
import getApiBaseUrl from "../../utils/getApiBaseUrl";
import {
  Plus,
  RefreshCw,
  Download,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";


interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

type SortField = "name" | "description" | "createdAt";
type SortOrder = "asc" | "desc";

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function Categories() {
  const { api } = useAuth();
  const API_URL = `${getApiBaseUrl()}/categories`;
  const UPLOAD_URL = `${getApiBaseUrl()}/upload/base64`;

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Category>>({
    name: "",
    description: "",
    imageUrl: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ===== TOAST FUNCTIONS =====
  const showToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // ===== FETCH DATA =====
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Category[]>(API_URL);
      setCategories(response.data || []);
      showToast("success", "Tải dữ liệu thành công");
    } catch (error) {
      console.error("Lỗi tải categories:", error);
      showToast("error", "Không thể tải dữ liệu danh mục");
    } finally {
      setLoading(false);
    }
  }, [api, API_URL]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ===== FILTER & SORT =====
  useEffect(() => {
    let result = [...categories];

    // Search
    if (searchTerm) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let aValue = a[sortField] || "";
      let bValue = b[sortField] || "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCategories(result);
    setCurrentPage(1);
  }, [categories, searchTerm, sortField, sortOrder]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCategories.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ===== SORT HANDLER =====
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ===== CLEAR FILTERS =====
  const handleClearFilters = () => {
    setSearchTerm("");
    setSortField("name");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  // ===== EXPORT TO CSV =====
  const handleExport = () => {
    const headers = ["STT", "Tên danh mục", "Mô tả", "URL ảnh", "Ngày tạo"];
    const rows = filteredCategories.map((cat, index) => [
      (index + 1).toString(),
      cat.name,
      cat.description || "",
      cat.imageUrl || "",
      cat.createdAt ? new Date(cat.createdAt).toLocaleString("vi-VN") : "",
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    showToast("success", "✅ Xuất file thành công!");
  };

  // ===== MODAL HANDLERS =====
  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: "", description: "", imageUrl: "" });
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Category) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setImagePreview(item.imageUrl || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setForm({ name: "", description: "", imageUrl: "" });
    setImagePreview("");
  };

  // ===== FORM HANDLERS =====
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("error", "Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);

      // Upload to server
      setIsUploading(true);
      try {
        const uploadRes = await api.post(UPLOAD_URL, {
          base64: base64String,
          fileName: `category_${Date.now()}.${file.name.split(".").pop()}`,
        });
        setForm((prev) => ({ ...prev, imageUrl: uploadRes.data.imageUrl }));
        showToast("success", "Tải ảnh lên thành công");
      } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        showToast("error", "Không thể tải ảnh lên");
        setImagePreview("");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    setImagePreview("");
  };

  // ===== SUBMIT FORM =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name?.trim()) {
      showToast("error", "Tên danh mục là bắt buộc");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || "",
        imageUrl: form.imageUrl || "",
      };

      if (editItem) {
        await api.put(`${API_URL}/${editItem.id}`, { ...payload, id: editItem.id });
        showToast("success", "Cập nhật danh mục thành công");
      } else {
        await api.post(API_URL, payload);
        showToast("success", "Thêm danh mục thành công");
      }

      await fetchCategories();
      closeModal();
    } catch (error) {
      console.error("Lỗi lưu category:", error);
      showToast("error", "Có lỗi khi lưu danh mục");
    }
  };

  // ===== DELETE HANDLERS =====
  const openDeleteDialog = (id: number) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await api.delete(`${API_URL}/${deleteItemId}`);
      showToast("success", "Xóa danh mục thành công");
      await fetchCategories();
      closeDeleteDialog();
    } catch (error) {
      console.error("Lỗi xóa category:", error);
      showToast("error", "Không thể xóa danh mục");
    }
  };

  // ===== RENDER SORT ICON =====
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  // ===== RENDER PAGINATION =====
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex justify-between items-center mt-4 px-4">
        <div className="text-sm text-gray-600">
          Trang {currentPage} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages.map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-1 border rounded transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white rounded-lg shadow-xl px-6 py-3 flex items-center gap-3 animate-slide-in-right`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="hover:bg-white/20 rounded p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Danh mục</h1>
          <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm của nhà hàng</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm border border-gray-200 disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={filteredCategories.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            title="Xuất Excel"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Thêm danh mục"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, mô tả..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sắp xếp theo
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Tên</option>
              <option value="description">Mô tả</option>
              <option value="createdAt">Ngày tạo</option>
            </select>
          </div>

          {/* Clear Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              &nbsp;
            </label>
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {filteredCategories.length} / {categories.length} danh mục
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg">Không tìm thấy danh mục nào</p>
            {searchTerm && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-blue-600 hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      STT
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Tên danh mục
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("description")}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Mô tả
                        {renderSortIcon("description")}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hình ảnh
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((category, index) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 line-clamp-2">
                          {category.description || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded mx-auto"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editItem ? "Cập nhật danh mục" : "Thêm danh mục mới"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập tên danh mục"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả danh mục"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {isUploading && (
                  <p className="mt-2 text-sm text-blue-600">Đang tải ảnh lên...</p>
                )}
                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editItem ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Xác nhận xóa</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={closeDeleteDialog}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}