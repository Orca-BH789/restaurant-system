import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hook/useAuth";
import { Search, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { Toast } from "../../components/shared/Toast";
import APIService from "../../services/APIService";

interface ReservationDetailDTO {
  id: number;
  reservationNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reservationTime: string;
  numberOfGuests: number;
  status: string;
  notes?: string;
  createdAt: string;
  tableAssignments?: { id: number; tableNumber: string }[];
}

export default function Reservations() {
  const { api } = useAuth();
  const apiService = useMemo(() => new APIService(api), [api]);

  const [reservations, setReservations] = useState<ReservationDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetailDTO | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const query: Record<string, string | number | boolean> = {
        pageNumber,
        pageSize,
      };

      if (searchTerm) query.searchTerm = searchTerm;
      if (statusFilter) query.status = statusFilter;

      const response = await apiService.getReservations(query);
      setReservations(response.data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Lỗi khi tải đặt bàn:", err);
      setError("Lỗi khi tải danh sách đặt bàn 😢");
    } finally {
      setLoading(false);
    }
  }, [apiService, pageNumber, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageNumber(1);
  };

  const confirmReservation = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await apiService.confirmReservation(id);
      if (response.success) {
        setNotification({
          message: "Xác nhận đặt bàn thành công",
          type: "success",
        });
        fetchReservations();
      } else {
        setNotification({
          message: response.message || "Lỗi khi xác nhận",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Lỗi khi xác nhận",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openCancelModal = (reservation: ReservationDetailDTO) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const cancelReservation = async () => {
    if (!selectedReservation) return;

    setProcessingId(selectedReservation.id);
    try {
      const response = await apiService.cancelReservation(selectedReservation.id, cancelReason);
      if (response.success) {
        setNotification({
          message: "Hủy đặt bàn thành công",
          type: "success",
        });
        setShowCancelModal(false);
        setCancelReason("");
        setSelectedReservation(null);
        fetchReservations();
      } else {
        setNotification({
          message: response.message || "Lỗi khi hủy",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Lỗi khi hủy",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const markAsArrived = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await apiService.arriveReservation(id);
      if (response.success) {
        setNotification({
          message: `Khách đã đến. Order #${response.data?.orderId} đã được tạo`,
          type: "success",
        });
        fetchReservations();
      } else {
        setNotification({
          message: response.message || "Lỗi khi xác nhận khách đến",
          type: "error",
        });
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Lỗi khi xác nhận khách đến",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "arrived":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no-show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      arrived: "Khách đã đến",
      cancelled: "Đã hủy",
      "no-show": "Không xuất hiện"
    };
    return statusMap[status.toLowerCase()] || status;
  };

  if (loading) return <p className="text-center mt-10">⏳ Đang tải đặt bàn...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Quản lý Đặt bàn</h1>
          <p className="text-gray-600">Danh sách các đặt bàn từ khách hàng</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên, SĐT, mã đặt bàn..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
              <button
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPageNumber(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Chờ xác nhận</option>
                <option value="Confirmed">Đã xác nhận</option>
                <option value="Arrived">Khách đã đến</option>
                <option value="Cancelled">Đã hủy</option>
                <option value="No-Show">Không xuất hiện</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPageNumber(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              >
                <option value={10}>10 mục</option>
                <option value={20}>20 mục</option>
                <option value={50}>50 mục</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có đặt bàn nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mã ĐB</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SĐT</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Khách</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bàn</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">
                        {reservation.reservationNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{reservation.customerName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{reservation.customerPhone}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(reservation.reservationTime).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{reservation.numberOfGuests}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {reservation.tableAssignments?.map(t => t.tableNumber).join(", ") || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {reservation.status.toLowerCase() === "pending" && (
                            <>
                              <button
                                onClick={() => confirmReservation(reservation.id)}
                                disabled={processingId === reservation.id}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition disabled:opacity-50"
                                title="Xác nhận"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openCancelModal(reservation)}
                                disabled={processingId === reservation.id}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition disabled:opacity-50"
                                title="Hủy"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {reservation.status.toLowerCase() === "confirmed" && (
                            <button
                              onClick={() => markAsArrived(reservation.id)}
                              disabled={processingId === reservation.id}
                              className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition disabled:opacity-50"
                              title="Khách đã đến"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {reservations.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={reservations.length < pageSize}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau →
              </button>
            </div>
            <p className="text-sm text-gray-600">Trang {pageNumber}</p>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hủy đặt bàn</h2>
            <p className="text-gray-600 mb-4">
              Bạn có chắc chắn muốn hủy đặt bàn <strong>{selectedReservation?.reservationNumber}</strong> của khách{" "}
              <strong>{selectedReservation?.customerName}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lý do hủy (tùy chọn):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setSelectedReservation(null);
                }}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={cancelReservation}
                disabled={processingId !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === selectedReservation?.id ? "Đang xử lý..." : "Hủy đặt bàn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
