import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from "../../hook/useAuth";

// Types
interface OrderDetail {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  kitchenCode?: string;
  note?: string;
  status?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  numberOfGuests: number;
  orderType: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  orderTime?: string;
  createdAt: string;
  completedTime?: string;
  orderDetails?: OrderDetail[];
}

const StatusBadge: Record<string, { label: string; color: string }> = {
  Ordered: { label: "Đã đặt", color: "bg-blue-100 text-blue-800" },
  PendingPayment: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800" },
  Completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  Cancelled: { label: "Hủy", color: "bg-red-100 text-red-800" },
};

const OrderTypeLabel: Record<string, string> = {
  DineIn: "Tại chỗ",
  TakeAway: "Mang về",
  Delivery: "Giao hàng",
};

const OrderDetailStatusColor: Record<string, string> = {
  Done: "bg-green-100 text-green-800",
  Ready: "bg-blue-100 text-blue-800",
  Cooking: "bg-orange-100 text-orange-800",
  Pending: "bg-gray-100 text-gray-800",
};

const OrderList = () => {
  const { api } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Sorting
  const [sortField, setSortField] = useState<keyof Order>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Notification
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "success", message: "" }), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/Orders");
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification("error", "Lỗi khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Filter & Search
  useEffect(() => {
    let result = [...orders];

    if (searchTerm) {
      result = result.filter((o) =>
        o.orderNumber.includes(searchTerm) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone?.includes(searchTerm)
      );
    }

    if (filterStatus) {
      result = result.filter((o) => o.status === filterStatus);
    }

    if (filterType) {
      result = result.filter((o) => o.orderType === filterType);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] as unknown;
      const bVal = b[sortField] as unknown;

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Number comparison
      return sortOrder === "asc"
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, filterStatus, filterType, sortField, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const openDetailModal = async (order: Order) => {
    try {
      // Fetch full order details if not available
      if (!order.orderDetails || order.orderDetails.length === 0) {
        const response = await api.get(`/Orders/${order.id}`);
        setSelectedOrderForDetail(response.data);
      } else {
        setSelectedOrderForDetail(order);
      }
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      showNotification("error", "Không thể tải chi tiết đơn hàng");
    }
  };

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h1>
          <p className="text-gray-600 text-sm mt-1">Tổng: {orders.length} đơn hàng</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Làm mới"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
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
              placeholder="Đơn #, khách hàng, SĐT..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Ordered">Đã đặt</option>
              <option value="PendingPayment">Chờ thanh toán</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Hủy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại đơn</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả loại</option>
              <option value="DineIn">Tại chỗ</option>
              <option value="TakeAway">Mang về</option>
              <option value="Delivery">Giao hàng</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("");
                setFilterType("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn hàng ({orders.length} tổng cộng)
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-linear-to-r from-blue-50 to-blue-100 border-b">
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("orderNumber")}
              >
                Đơn # {sortField === "orderNumber" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("customerName")}
              >
                Khách hàng {sortField === "customerName" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Loại</th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("status")}
              >
                Trạng thái {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Khách</th>
              <th
                className="px-6 py-3 text-right text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("totalAmount")}
              >
                Tổng {sortField === "totalAmount" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => handleSort("createdAt")}
              >
                Thời gian {sortField === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {filteredOrders.length === 0 ? (searchTerm || filterStatus || filterType ? "Không tìm thấy đơn hàng" : "Chưa có dữ liệu") : "Không có dữ liệu trên trang này"}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-700">
                    <div>
                      <p className="font-medium whitespace-nowrap">{order.customerName || "—"}</p>
                      {order.customerPhone && (
                        <p className="text-xs text-gray-500 whitespace-nowrap">{order.customerPhone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{OrderTypeLabel[order.orderType] || order.orderType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${StatusBadge[order.status]?.color || "bg-gray-100"}`}>
                      {StatusBadge[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{order.numberOfGuests}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openDetailModal(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
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

      {/* DETAIL MODAL */}
      {showDetailModal && selectedOrderForDetail && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">
                Chi tiết đơn hàng {selectedOrderForDetail.orderNumber}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${StatusBadge[selectedOrderForDetail.status]?.color}`}>
                    {StatusBadge[selectedOrderForDetail.status]?.label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại đơn</p>
                  <p className="font-medium text-gray-900">{OrderTypeLabel[selectedOrderForDetail.orderType]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Khách hàng</p>
                  <p className="font-medium text-gray-900">{selectedOrderForDetail.customerName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Số khách</p>
                  <p className="font-medium text-gray-900">{selectedOrderForDetail.numberOfGuests}</p>
                </div>
              </div>

              {/* Contact Info */}
              {selectedOrderForDetail.customerPhone && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{selectedOrderForDetail.customerPhone}</p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Chi tiết các mặt hàng</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2 text-left text-gray-700 font-medium">Tên món</th>
                        <th className="px-4 py-2 text-center text-gray-700 font-medium">SL</th>
                        <th className="px-4 py-2 text-right text-gray-700 font-medium">Giá/cái</th>
                        <th className="px-4 py-2 text-right text-gray-700 font-medium">Tổng</th>
                        <th className="px-4 py-2 text-center text-gray-700 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderForDetail.orderDetails && selectedOrderForDetail.orderDetails.length > 0 ? (
                        selectedOrderForDetail.orderDetails.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
                              <div>
                                <p className="font-medium">{item.menuItemName}</p>
                                {item.note && <p className="text-xs text-gray-600 italic mt-1">{item.note}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${OrderDetailStatusColor[item.status || "Pending"] || "bg-gray-100"}`}>
                                {item.status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-gray-500">Không có mặt hàng</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tổng tiền hàng:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedOrderForDetail.subTotal)}</span>
                </div>
                {selectedOrderForDetail.discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Giảm giá:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(selectedOrderForDetail.discountAmount)}</span>
                  </div>
                )}
                {selectedOrderForDetail.taxAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Thuế:</span>
                    <span className="font-medium text-gray-900">+{formatCurrency(selectedOrderForDetail.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t font-semibold text-lg">
                  <span className="text-gray-900">Tổng thanh toán:</span>
                  <span className="text-blue-600">{formatCurrency(selectedOrderForDetail.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
