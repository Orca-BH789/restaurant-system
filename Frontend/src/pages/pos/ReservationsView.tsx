import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Calendar,
  Phone,
  Users,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../hook/useAuth";
import type { ReservationDetailDTO } from "../../services/APIService";
import APIService from "../../services/APIService";

type ReservationStatus = "Pending" | "Confirmed" | "Arrived" | "Cancelled";

export default function ReservationsView() {
  const { api } = useAuth();
  const apiService = useMemo(() => new APIService(api), [api]);

  // States
  const [reservations, setReservations] = useState<ReservationDetailDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "All">("All");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" }>({
    text: "",
    type: "info",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetailDTO | null>(null);

  // Load reservations using getReservations API
  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      // Call getReservations to get all reservations
      const result = await apiService.getReservations();
      
      // result = { data: ReservationDetailDTO[], totalCount, pageNumber }
      const data = result.data || [];
      setReservations(data);
      setMessage({ text: "", type: "info" });
    } catch (error) {
      console.error("Error loading reservations:", error);
      setReservations([]);
      setMessage({ text: "Không thể tải danh sách đặt bàn", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [apiService]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Confirm reservation
  const handleConfirm = useCallback(
    async (id: number) => {
      setProcessingId(id);
      try {
        const response = await apiService.confirmReservation(id);
        if (response.success) {
          setMessage({ text: "Xác nhận đặt bàn thành công!", type: "success" });
          loadReservations();
        } else {
          setMessage({ text: response.message || "Xác nhận thất bại", type: "error" });
        }
      } catch (error) {
        console.error("Error confirming reservation:", error);
        setMessage({ text: "Lỗi khi xác nhận đặt bàn", type: "error" });
      } finally {
        setProcessingId(null);
      }
    },
    [apiService, loadReservations]
  );

  // Check-in (Arrive)
  const handleArrive = useCallback(
    async (id: number) => {
      setProcessingId(id);
      try {
        const response = await apiService.arriveReservation(id);
        if (response.success) {
          setMessage({ text: "Xác nhận khách đã đến thành công!", type: "success" });
          loadReservations();
        } else {
          setMessage({ text: response.message || "Check-in thất bại", type: "error" });
        }
      } catch (error) {
        console.error("Error checking in reservation:", error);
        setMessage({ text: "Lỗi khi check-in khách hàng", type: "error" });
      } finally {
        setProcessingId(null);
      }
    },
    [apiService, loadReservations]
  );

  // Cancel reservation
  const handleCancelClick = (reservation: ReservationDetailDTO) => {
    setSelectedReservation(reservation);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelConfirm = useCallback(async () => {
    if (!selectedReservation) return;

    setProcessingId(selectedReservation.id);
    try {
      const response = await apiService.cancelReservation(selectedReservation.id, cancelReason);
      if (response.success) {
        setMessage({ text: "Hủy đặt bàn thành công!", type: "success" });
        setShowCancelModal(false);
        setCancelReason("");
        setSelectedReservation(null);
        loadReservations();
      } else {
        setMessage({ text: response.message || "Hủy thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Error canceling reservation:", error);
      setMessage({ text: "Lỗi khi hủy đặt bàn", type: "error" });
    } finally {
      setProcessingId(null);
    }
  }, [selectedReservation, cancelReason, apiService, loadReservations]);

  // Filter reservations by date and status
  const filteredReservations = reservations
    .filter(r => {
      // Filter by selected date
      const reservationDate = new Date(r.reservationTime).toISOString().split("T")[0];
      return reservationDate === selectedDate;
    })
    .filter(r => {
      // Then filter by status
      return statusFilter === "All" || r.status === statusFilter;
    });

  // Status color
  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-50 border-yellow-300 text-yellow-900";
      case "Confirmed":
        return "bg-blue-50 border-blue-300 text-blue-900";
      case "Arrived":
        return "bg-green-50 border-green-300 text-green-900";
      case "Cancelled":
        return "bg-red-50 border-red-300 text-red-900";
      default:
        return "bg-gray-50 border-gray-300 text-gray-900";
    }
  };

  const getStatusIcon = (status: ReservationStatus) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Confirmed":
        return <Check className="w-4 h-4" />;
      case "Arrived":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Quản lý đặt bàn</h2>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | "All")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Pending">Chờ xác nhận</option>
              <option value="Confirmed">Đã xác nhận</option>
              <option value="Arrived">Đã đến</option>
              <option value="Cancelled">Đã hủy</option>
            </select>

            <button
              onClick={loadReservations}
              disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Messages */}
        {message.text && (
          <div
            className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : message.type === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
            }`}
          >
            {message.type === "success" && <CheckCircle2 className="w-5 h-5" />}
            {message.type === "error" && <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-slate-600">Đang tải danh sách đặt bàn...</p>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Không có đặt bàn nào</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`p-4 rounded-lg border-2 ${getStatusColor(reservation.status)} transition hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(reservation.status)}
                        <span className="font-semibold">{reservation.reservationNumber}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-slate-200 rounded">
                        {reservation.status === "Pending"
                          ? "Chờ xác nhận"
                          : reservation.status === "Confirmed"
                            ? "Đã xác nhận"
                            : reservation.status === "Arrived"
                              ? "Đã đến"
                              : "Đã hủy"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Khách hàng</label>
                        <p className="font-medium">{reservation.customerName}</p>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                          <Phone className="w-3 h-3" />
                          Điện thoại
                        </label>
                        <p className="font-medium">{reservation.customerPhone}</p>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                          <Users className="w-3 h-3" />
                          Số khách
                        </label>
                        <p className="font-medium">{reservation.numberOfGuests} người</p>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                          <Clock className="w-3 h-3" />
                          Giờ
                        </label>
                        <p className="font-medium">
                          {new Date(reservation.reservationTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="mt-3">
                        <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
                        <p className="text-sm">{reservation.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-max">
                    {reservation.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleConfirm(reservation.id)}
                          disabled={processingId === reservation.id}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {processingId === reservation.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Xác nhận
                        </button>

                        <button
                          onClick={() => handleCancelClick(reservation)}
                          disabled={processingId === reservation.id}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {processingId === reservation.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Hủy
                        </button>
                      </>
                    )}

                    {reservation.status === "Confirmed" && (
                      <button
                        onClick={() => handleArrive(reservation.id)}
                        disabled={processingId === reservation.id}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {processingId === reservation.id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Khách đến
                      </button>
                    )}

                    {(reservation.status === "Arrived" || reservation.status === "Cancelled") && (
                      <span className="text-xs text-slate-600 text-center px-3 py-2">
                        {reservation.status === "Arrived" ? "Đã check-in" : "Đã hủy"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Hủy đặt bàn</h3>

            <p className="text-slate-600 mb-4">
              Bạn có chắc muốn hủy đặt bàn của{" "}
              <strong>{selectedReservation.customerName}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedReservation(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Không
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={processingId === selectedReservation.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
              >
                {processingId === selectedReservation.id ? (
                  <Loader className="w-4 h-4 animate-spin inline-block" />
                ) : (
                  "Xác nhận hủy"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
