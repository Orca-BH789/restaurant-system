import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import { RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Invoice {
  id: number;
  orderId: number;
  amount: number;
  status: string;
  paymentTime: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  orderNumber: string;
  customerName: string;
  createdByName: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"day" | "month" | "quarter" | "year" | "">(""); // Loại lịch
  const [selectedDate, setSelectedDate] = useState<string>(""); // Ngày đã chọn
  const [selectedMonth, setSelectedMonth] = useState<string>(""); // Tháng-Năm đã chọn
  const [selectedQuarter, setSelectedQuarter] = useState<string>(""); // Quý-Năm đã chọn
  const [selectedYear, setSelectedYear] = useState<string>(""); // Năm đã chọn

  // Sorting
  const [sortField, setSortField] = useState<keyof Invoice>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Notification
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

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get<Invoice[]>(`${baseURL}/Invoices`);
      setInvoices(res.data || []);
      setFilteredInvoices(res.data || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Không thể tải danh sách hóa đơn 😢";
      console.error("❌ Lỗi khi tải invoices:", err);
      setError(errorMsg);
      showNotification("error", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter & Sort Effect
  useEffect(() => {
    let result = [...invoices];

    // Search
    if (searchTerm) {
      result = result.filter(inv =>
        inv.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.createdByName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by Status
    if (filterStatus) {
      result = result.filter(inv => inv.status === filterStatus);
    }

    // Filter by Date Range
    if (dateFilterType === "day" && selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);

      result = result.filter(inv => {
        const invDate = new Date(inv.createdAt);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === filterDate.getTime();
      });
    } else if (dateFilterType === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      result = result.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getFullYear() === parseInt(year) && invDate.getMonth() === parseInt(month) - 1;
      });
    } else if (dateFilterType === "quarter" && selectedQuarter) {
      const [year, quarter] = selectedQuarter.split("-");
      const quarterNum = parseInt(quarter);
      const startMonth = (quarterNum - 1) * 3;
      const endMonth = startMonth + 2;

      result = result.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getFullYear() === parseInt(year) && invDate.getMonth() >= startMonth && invDate.getMonth() <= endMonth;
      });
    } else if (dateFilterType === "year" && selectedYear) {
      result = result.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getFullYear() === parseInt(selectedYear);
      });
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

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortOrder === "asc"
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    setFilteredInvoices(result);
    setCurrentPage(1);
  }, [invoices, searchTerm, filterStatus, dateFilterType, selectedDate, selectedMonth, selectedQuarter, selectedYear, sortField, sortOrder]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  if (loading) return <div className="p-6 text-center">⏳ Đang tải danh sách hóa đơn...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToExcel = () => {
    const headers = ["Mã đơn", "Khách hàng", "Số tiền", "Trạng thái", "Người tạo", "Thanh toán lúc"];
    const rows = filteredInvoices.map(inv => [
      inv.orderNumber,
      inv.customerName,
      inv.amount.toString(),
      inv.status,
      inv.createdByName,
      new Date(inv.paymentTime).toLocaleString("vi-VN")
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification("success", "✅ Xuất file thành công!");
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Danh sách hóa đơn</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và theo dõi hóa đơn thanh toán</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInvoices}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            title="Xuất Excel"
          >
            <Download size={18} />
            Excel
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Mã đơn, khách hàng..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Pending">Chờ thanh toán</option>
              <option value="Completed">Hoàn thành</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("");
                setDateFilterType("");
                setSelectedDate("");
                setSelectedMonth("");
                setSelectedQuarter("");
                setSelectedYear("");
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* DATE RANGE FILTERS */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Lọc theo:</label>
          <select
            value={dateFilterType}
            onChange={(e) => {
              setDateFilterType(e.target.value as "day" | "month" | "quarter" | "year" | "");
              setSelectedDate("");
              setSelectedMonth("");
              setSelectedQuarter("");
              setSelectedYear("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Chọn loại --</option>
            <option value="day">Ngày</option>
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>

          {/* Ngày Picker */}
          {dateFilterType === "day" && (
            <>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate && (
                <span className="text-sm text-amber-50">
                  {new Date(selectedDate).toLocaleDateString("vi-VN")}
                </span>
              )}
            </>
          )}

          {/* Tháng Picker */}
          {dateFilterType === "month" && (
            <>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedMonth && (
                <span className="text-sm text-amber-50">
                  Tháng {parseInt(selectedMonth.split("-")[1])} năm {selectedMonth.split("-")[0]}
                </span>
              )}
            </>
          )}

          {/* Quý Picker */}
          {dateFilterType === "quarter" && (
            <>
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn quý --</option>
                {[2025, 2024, 2023, 2022].map(year =>
                  [1, 2, 3, 4].map(q => (
                    <option key={`${year}-${q}`} value={`${year}-${q}`}>
                      Quý {q} năm {year}
                    </option>
                  ))
                )}
              </select>
              {selectedQuarter && (
                <span className="text-sm text-amber-50">
                  Quý {selectedQuarter.split("-")[1]} năm {selectedQuarter.split("-")[0]}
                </span>
              )}
            </>
          )}

          {/* Năm Picker */}
          {dateFilterType === "year" && (
            <>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn năm --</option>
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {selectedYear && (
                <span className="text-sm text-amber-50">
                  Năm {selectedYear}
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {currentInvoices.length} / {filteredInvoices.length} hóa đơn ({invoices.length} tổng cộng)
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">
                STT
              </th>
              <th
                onClick={() => handleSort("orderNumber")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  Mã đơn
                  {sortField === "orderNumber" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("customerName")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  Khách hàng
                  {sortField === "customerName" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("amount")}
                className="px-6 py-4 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-2">
                  Số tiền
                  {sortField === "amount" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="px-6 py-4 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-2">
                  Trạng thái
                  {sortField === "status" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("createdByName")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  Người tạo
                  {sortField === "createdByName" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("paymentTime")}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  Thanh toán lúc
                  {sortField === "paymentTime" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  {searchTerm || filterStatus
                    ? "Không tìm thấy hóa đơn"
                    : "Không có dữ liệu"}
                </td>
              </tr>
            ) : (
              currentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{indexOfFirstItem + currentInvoices.indexOf(inv) + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{inv.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-700">{inv.customerName}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {inv.amount.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inv.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : inv.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : inv.status === "Completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{inv.createdByName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(inv.paymentTime).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
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
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
