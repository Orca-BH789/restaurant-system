import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { X, Plus, Edit2, Trash2, RefreshCw, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Table {
  id: number;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  location?: string;
  status: "Available" | "Occupied" | "Reserved";
  isActive: boolean;
  createdAt: string;
}

const StatusBadge: Record<string, { label: string; color: string }> = {
  Available: { label: "Trống", color: "bg-green-100 text-green-800" },
  Occupied: { label: "Đang sử dụng", color: "bg-red-100 text-red-800" },
  Reserved: { label: "Đã đặt", color: "bg-yellow-100 text-yellow-800" },
};

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [form, setForm] = useState<Partial<Table>>({});

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Notification
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: "", message: "", onConfirm: () => {} });

  const api = `${getApiBaseUrl()}/Tables`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "success", message: "" }), 3000);
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(api, { headers: getAuthHeaders() });
      setTables(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải bàn:", err);
      showNotification("error", "Không thể tải dữ liệu bàn.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Filter & Search
  useEffect(() => {
    let result = [...tables];

    if (searchTerm) {
      result = result.filter((t) =>
        t.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tableNumber.toString().includes(searchTerm) ||
        t.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLocation) {
      result = result.filter((t) => t.location === filterLocation);
    }

    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Sort by tableNumber ascending
    result.sort((a, b) => a.tableNumber - b.tableNumber);

    setFilteredTables(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tables, searchTerm, filterLocation, filterStatus]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const openAdd = () => {
    setSelectedTable(null);
    setForm({
      tableNumber: undefined,
      tableName: "",
      capacity: 2,
      location: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (table: Table) => {
    setSelectedTable(table);
    setForm(table);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tableNumber || form.tableNumber === 0) {
      showNotification("error", "Số bàn là bắt buộc!");
      return;
    }

    if (!form.capacity || form.capacity < 1) {
      showNotification("error", "Sức chứa phải >= 1!");
      return;
    }

    try {
      if (selectedTable) {
        await axios.put(`${api}/${selectedTable.id}`, form, { headers: getAuthHeaders() });
        showNotification("success", "✅ Cập nhật bàn thành công!");
      } else {
        await axios.post(api, form, { headers: getAuthHeaders() });
        showNotification("success", "✅ Thêm bàn thành công!");
      }
      await fetchTables();
      setShowModal(false);
    } catch (err) {
      console.error("❌ Lỗi:", err);
      showNotification("error", "Không thể lưu bàn.");
    }
  };

  const handleDelete = (table: Table) => {
    showConfirmation(
      `Xóa bàn ${table.tableNumber}?`,
      `${table.tableName || "Bàn"} - Sức chứa: ${table.capacity}`,
      async () => {
        try {
          await axios.delete(`${api}/${table.id}`, { headers: getAuthHeaders() });
          showNotification("success", "✅ Xóa bàn thành công!");
          await fetchTables();
        } catch (err) {
          console.error("❌ Lỗi xóa:", err);
          showNotification("error", "Không thể xóa bàn.");
        }
      }
    );
  };

  const getUniqueLocations = () => {
    const locations = tables.map((t) => t.location).filter(Boolean);
    return [...new Set(locations)];
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTables = filteredTables.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-xl ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white font-medium`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý bàn</h1>
          <p className="text-gray-600 text-sm mt-1">Tổng: {tables.length} bàn</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTables}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            Thêm bàn
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
              placeholder="Số bàn, tên, khu vực..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả khu vực</option>
              {getUniqueLocations().map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Available">Trống</option>
              <option value="Occupied">Đang sử dụng</option>
              <option value="Reserved">Đã đặt</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterLocation("");
                setFilterStatus("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {paginatedTables.length} / {filteredTables.length} bàn ({filteredTables.length} tổng cộng)
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-linear-to-r from-blue-50 to-blue-100 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số bàn</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tên bàn</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sức chứa</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khu vực</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTables.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {filteredTables.length === 0 ? (searchTerm || filterLocation || filterStatus ? "Không tìm thấy bàn" : "Chưa có dữ liệu") : "Không có dữ liệu trên trang này"}
                </td>
              </tr>
            ) : (
              paginatedTables.map((table) => (
                <tr key={table.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{table.tableNumber}</td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{table.tableName || "-"}</td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users size={16} className="text-blue-600 shrink-0" />
                      <span>{table.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-blue-600 shrink-0" />
                      <span>{table.location || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${StatusBadge[table.status]?.color || "bg-gray-100"}`}>
                      {StatusBadge[table.status]?.label || table.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(table.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(table)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(table)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
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
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={18} />
              Trước
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Sau
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL ADD/EDIT */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedTable ? "Cập nhật bàn" : "Thêm bàn mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số bàn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="tableNumber"
                    value={form.tableNumber || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1, 2, 3..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên bàn</label>
                  <input
                    type="text"
                    name="tableName"
                    value={form.tableName || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Vd: Bàn VIP, Bàn cửa sổ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sức chứa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2, 4, 6..."
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tầng 1, Tầng 2, VIP..."
                  />
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
                  {selectedTable ? "Cập nhật" : "Thêm"}
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
    </div>
  );
}
