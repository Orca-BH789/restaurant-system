import { useEffect, useState, useCallback } from "react";
import { Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description?: string;
  invoiceNumber?: string;
  supplier?: string;
  paymentMethod: string;
  taxCode?: string;
  isDeductible: boolean;
  status: 0 | 1 | 2 | 3;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  createdByUserId: number;
  createdByUser?: { id: number; fullName: string };
}

const StatusLabel: Record<number, string> = {
  0: "Chờ duyệt",
  1: "Đã duyệt",
  2: "Từ chối",
  3: "Đã thanh toán",
};

const StatusColor: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-700",
  1: "bg-blue-100 text-blue-700",
  2: "bg-red-100 text-red-700",
  3: "bg-green-100 text-green-700",
};

const CategoryLabel: Record<string, string> = {
  Food: "Thực phẩm",
  Beverage: "Đồ uống",
  Equipment: "Thiết bị",
  Utility: "Tiền điện/nước",
  Labor: "Nhân công",
  Other: "Khác",
};



export default function Expense() {

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Expense>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    invoiceNumber: "",
    supplier: "",
    paymentMethod: "Cash",
    taxCode: "",
    isDeductible: true,
    dueDate: "",
  });

  const itemsPerPage = 7;

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrl();
      const response = await axios.get(`${baseUrl}/Expense/`);
      setExpenses(response.data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      alert("Không thể tải dữ liệu chi phí");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Filter & Sort
  const filteredExpenses = expenses.filter((expense) => {
    const matchSearch =
      expense.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = !filterStatus || expense.status === parseInt(filterStatus);
    const matchCategory = !filterCategory || expense.category === filterCategory;

    return matchSearch && matchStatus && matchCategory;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof Expense) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description || "",
        invoiceNumber: expense.invoiceNumber || "",
        supplier: expense.supplier || "",
        paymentMethod: expense.paymentMethod,
        taxCode: expense.taxCode || "",
        isDeductible: expense.isDeductible,
        dueDate: expense.dueDate ? expense.dueDate.split("T")[0] : "",
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        amount: "",
        category: "",
        description: "",
        invoiceNumber: "",
        supplier: "",
        paymentMethod: "Cash",
        taxCode: "",
        isDeductible: true,
        dueDate: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      if (selectedExpense) {
        // Update
        await axios.put(`${baseUrl}/Expense/${selectedExpense.id}`, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          invoiceNumber: formData.invoiceNumber,
          supplier: formData.supplier,
          paymentMethod: formData.paymentMethod,
          taxCode: formData.taxCode,
          isDeductible: formData.isDeductible,
          dueDate: formData.dueDate,
          status: selectedExpense.status,
        });
        alert("Cập nhật chi phí thành công");
      } else {
        // Create
        await axios.post(`${baseUrl}/Expense`, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          invoiceNumber: formData.invoiceNumber,
          supplier: formData.supplier,
          paymentMethod: formData.paymentMethod,
          taxCode: formData.taxCode,
          isDeductible: formData.isDeductible,
          dueDate: formData.dueDate,
          status: 0,
        });
        alert("Thêm chi phí thành công");
      }

      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Không thể lưu chi phí");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xóa chi phí này?")) return;

    try {
      const baseUrl = getApiBaseUrl();
      await axios.delete(`${baseUrl}/Expense/${id}`);
      alert("Xóa chi phí thành công");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Không thể xóa chi phí");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chi phí</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý chi phí hoạt động nhà hàng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchExpenses();
            }}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Thêm chi phí
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm hóa đơn, nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="0">Chờ duyệt</option>
            <option value="1">Đã duyệt</option>
            <option value="2">Từ chối</option>
            <option value="3">Đã thanh toán</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả danh mục</option>
            <option value="Food">Thực phẩm</option>
            <option value="Beverage">Đồ uống</option>
            <option value="Equipment">Thiết bị</option>
            <option value="Utility">Tiền điện/nước</option>
            <option value="Labor">Nhân công</option>
            <option value="Other">Khác</option>
          </select>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("");
                setFilterCategory("");
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {paginatedExpenses.length} / {sortedExpenses.length} chi phí ({expenses.length} tổng cộng)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-linear-to-r from-blue-50 to-blue-100 border-b">
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("invoiceNumber")}
              >
                Hóa đơn {sortField === "invoiceNumber" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("category")}
              >
                Danh mục {sortField === "category" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Nhà cung cấp</th>
              <th
                className="px-6 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("amount")}
              >
                Số tiền {sortField === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("status")}
              >
                Trạng thái {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                Ngày tạo {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {sortedExpenses.length === 0 && (searchTerm || filterStatus || filterCategory)
                    ? "Không tìm thấy chi phí"
                    : "Chưa có dữ liệu"}
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                    {expense.invoiceNumber || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {CategoryLabel[expense.category] || expense.category}
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {expense.supplier || "—"}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                    ₫{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${StatusColor[expense.status]}`}>
                      {StatusLabel[expense.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {new Date(expense.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openModal(expense)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block mr-2"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                    ? "bg-blue-600 text-white"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedExpense ? "Chỉnh sửa chi phí" : "Thêm chi phí"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  <option value="Food">Thực phẩm</option>
                  <option value="Beverage">Đồ uống</option>
                  <option value="Equipment">Thiết bị</option>
                  <option value="Utility">Tiền điện/nước</option>
                  <option value="Labor">Nhân công</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập mô tả chi phí"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số hóa đơn</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số hóa đơn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Tiền mặt</option>
                  <option value="BankTransfer">Chuyển khoản</option>
                  <option value="Momo">Momo</option>
                  <option value="ZaloPay">ZaloPay</option>
                  <option value="POS">Thẻ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
                <input
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mã số thuế"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đến hạn</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDeductible"
                  checked={formData.isDeductible}
                  onChange={(e) => setFormData({ ...formData, isDeductible: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isDeductible" className="text-sm text-gray-700">
                  Có thể khấu trừ
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {selectedExpense ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
