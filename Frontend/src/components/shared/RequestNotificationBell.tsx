import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import axios from "axios";
import { requestNotificationService, type CustomerRequest } from "../../services/RequestNotificationService";
import { useNotificationContext } from "../../contexts/useNotificationContext";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

export function RequestNotificationBell() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { notifications, markAsRead } = useNotificationContext();

  useEffect(() => {
    // Subscribe to customer requests
    const unsubscribe = requestNotificationService.subscribe((request) => {
      setRequests((prev) => {
        const filtered = prev.filter((r) => r.id !== request.id);
        return [request, ...filtered];
      });
    });

    // Get initial pending requests
    setRequests(requestNotificationService.getPendingRequests());

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Trigger UI refresh when a notification is dismissed
    if (refreshTrigger > 0) {
      // Force re-render by updating a dummy state
      setRequests(requestNotificationService.getPendingRequests());
    }
  }, [refreshTrigger]);

  const dismissBackendNotification = async (notificationId: number) => {
    try {
      const baseURL = getApiBaseUrl();
      const token = localStorage.getItem("token");
      await axios.post(
        `${baseURL}/Notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // Trigger refresh
      markAsRead(notificationId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length + 
                      notifications.filter((n) => !n.isRead).length;

  const allNotifications = [
    ...notifications.map((n) => ({
      id: `backend-${n.id}`,
      type: "backend" as const,
      title: n.title || "Thông báo",
      subtitle: n.message,
      status: n.isRead ? "completed" : "pending",
      timestamp: n.createdAt,
      icon: "📢",
    })),
    ...requests.map((r) => ({
      id: `request-${r.id}`,
      type: "request" as const,
      title: `Bàn ${r.tableId}: ${getRequestLabel(r.requestCode)}`,
      subtitle: r.note || "",
      status: r.status,
      timestamp: r.timestamp,
      icon: getRequestIcon(r.requestCode),
      requestId: r.id,
      requestCode: r.requestCode,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getRequestIcon = (code: string): string => {
    const iconMap: Record<string, string> = {
      call_staff: "�",
      request_payment: "💳",
      more_water: "🥤",
      more_utensils: "🍴",
      more_condiments: "🌶️",
      clean_table: "🧹",
      cancel_dish: "❌",
      check_order_status: "⏰",
      takeaway_pack: "📦",
      more_tissues: "🧻",
      baby_chair: "👶",
      adjust_ac: "❄️",
      adjust_light: "💡",
      print_invoice: "🧾",
      split_bill: "✂️",
      merge_bill: "🔗",
      other_support: "💬",
    };
    return iconMap[code] || "📢";
  };

  const getRequestLabel = (code: string): string => {
    const labelMap: Record<string, string> = {
      call_staff: "Gọi nhân viên",
      request_payment: "Yêu cầu thanh toán",
      more_water: "Xin thêm nước",
      more_utensils: "Xin chén/dĩa/đũa",
      more_condiments: "Xin gia vị",
      clean_table: "Lau bàn",
      cancel_dish: "Hủy món",
      check_order_status: "Kiểm tra món",
      takeaway_pack: "Đóng gói mang về",
      more_tissues: "Xin khăn giấy",
      baby_chair: "Xin ghế trẻ em",
      adjust_ac: "Điều chỉnh nhiệt độ",
      adjust_light: "Điều chỉnh ánh sáng",
      print_invoice: "In hóa đơn",
      split_bill: "Tách hóa đơn",
      merge_bill: "Gộp hóa đơn",
      other_support: "Yêu cầu khác",
    };
    return labelMap[code] || code;
  };

  return (
    <>
      {/* Bell Button */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-2 hover:bg-slate-100 rounded-lg transition"
          title="Yêu cầu từ khách"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-2xl z-40 border border-slate-200">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h3 className="font-bold text-lg">Yêu cầu từ khách</h3>
              <button onClick={() => setShowPanel(false)} className="hover:bg-blue-500 p-1 rounded transition">
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Chưa có yêu cầu nào</p>
                </div>
              ) : (
                <div className="divide-y">
                  {allNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 transition flex items-start justify-between gap-3 ${
                        item.status === "pending" ? (item.type === "backend" ? "bg-yellow-50" : "bg-blue-50") : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {item.title}
                            {item.subtitle && !item.title.includes(item.subtitle) && (
                              <span className="text-xs text-slate-600 ml-1">
                                · {item.subtitle}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(item.timestamp).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                          </p>
                        </div>
                      </div>
                      {item.status === "pending" && (
                        <button
                          onClick={() => {
                            if (item.type === "request" && item.requestId) {
                              requestNotificationService.markAsCompleted(item.requestId);
                            } else if (item.type === "backend") {
                              const notificationId = parseInt(item.id.replace("backend-", ""));
                              dismissBackendNotification(notificationId);
                            }
                          }}
                          className="shrink-0 text-slate-400 hover:text-red-500 transition"
                          title="Xóa"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {allNotifications.length > 0 && (
              <div className="border-t p-3 bg-slate-50 rounded-b-lg">
                <button
                  onClick={() => {
                    requestNotificationService.clearCompleted();
                    setRequests(requestNotificationService.getPendingRequests());
                  }}
                  className="w-full text-xs text-slate-600 hover:text-red-500 hover:bg-red-50 font-medium py-2 px-3 rounded transition"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
