import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Maximize2, Minimize2, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "../../hook/useAuth";
import axios from 'axios';
import { APIService, type Table, type Order, type MenuItem, type ToastType } from "../../services/APIService";
import type { Toast } from "../../services/APIService";
import axiosInstance from '../../utils/axiosConfig';
import { useNotificationContext } from "../../contexts/useNotificationContext";
import type { PosNotification } from "../../contexts/NotificationContext";

// Import components
import { Toast as ToastComponent } from "../shared/Toast";
import { LoadingOverlay } from "../shared/LoadingOverlay";
import { QRCodeModal } from "../modals/QRCodeModal";
import { CreateOrderModal } from "../modals/CreateOrderModal";
import { TransferTableModal } from "../modals/TransferTableModal";
import { MergeTablesModal } from "../modals/MergeTablesModal";
import { RequestNotificationBell } from "../shared/RequestNotificationBell";
import { TablesView } from "../../pages/pos/TablesView";
import { OrdersView } from "../../pages/pos/OrdersView";
import ReservationsView from "../../pages/pos/ReservationsView";
import PaymentPage from "../../pages/pos/PaymentPage";

export default function POSLayout() {
  const [currentView, setCurrentView] = useState<"tables" | "orders" | "reservations">("tables");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const { logout, api } = useAuth();
  const navigate = useNavigate();
  const { notifications, addNotification } = useNotificationContext();

  // Data states
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);

  // QR Code Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{
    qrUrl: string;
    tableNumber: number;
  } | null>(null);

  // Transfer & Merge Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergedTables, setMergedTables] = useState<Set<number>>(new Set()); // Track merged/hidden tables
  
  // Payment Page State
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);

  // Refresh cooldown state (chặn spam refresh)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  const apiService = useState(() => new APIService(api))[0];

  // ========== Toast Management ==========
  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now();
      // Xóa toast cũ khi toast mới xuất hiện (chỉ giữ 1 toast)
      setToasts([{ id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ========== Data Loading Functions ==========
  const loadTables = useCallback(async () => {
    try {
      const data = await apiService.getTables();
      setTables(data);
      
      // 🔥 Xóa bàn khỏi mergedTables nếu nó đã được giải phóng (Available)
      setMergedTables(prev => {
        const updated = new Set(prev);
        data.forEach(table => {
          if (table.status === "Available" && updated.has(table.id)) {
            updated.delete(table.id);
          }
        });
        return updated;
      });
    } catch {
      showToast("Lỗi khi tải danh sách bàn", "error");
    }
  }, [apiService, showToast]);

  const loadOrders = useCallback(
    async (status?: string) => {
      try {
        const data = await apiService.getOrders(
          status ? { status } : undefined
        );
        setOrders(data);
      } catch {
        showToast("Lỗi khi tải danh sách đơn hàng", "error");
      }
    },
    [apiService, showToast]
  );

  const loadMenuItems = useCallback(async () => {
    try {
      const data = await apiService.getMenuItems();
      setMenuItems(data);
    } catch {
      showToast("Lỗi khi tải menu", "error");
    }
  }, [apiService, showToast]);

  const loadTableDetails = useCallback(
    async (tableId: number) => {
      try {
        const table = tables.find((t) => t.id === tableId);
        if (table) {
          setSelectedTable(table);
          const order = await apiService.getCurrentOrder(tableId);
          setSelectedOrder(order);
        }
      } catch (error) {
        console.error("Error loading table details:", error);
      }
    },
    [apiService, tables]
  );

  // ========== Order Management Functions ==========
  const createOrder = useCallback(
    async (
      tableId: number,
      data: {
        numberOfGuests: number;
        customerId?: number;
        customerName?: string;
        customerPhone?: string;
      }
    ) => {
      try {
        setLoading(true);
        setLoadingMessage("Đang tạo đơn hàng...");

        const result = await apiService.activateTable(tableId, data);
        showToast("Tạo đơn hàng thành công", "success");

        await loadTables();
        await loadOrders();
        
        const table = tables.find((t) => t.id === tableId);
        if (table) {
          setSelectedTable(table);
          setSelectedOrder(result.order);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng";
        showToast(message, "error");
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [apiService, tables, loadTables, loadOrders, showToast]
  );

  const addOrderItem = useCallback(
    async (
      orderId: number,
      menuItemId: number,
      quantity: number = 1,
      note?: string
    ) => {
      try {
        const menuItem = menuItems.find((m) => m.id === menuItemId);
        if (!menuItem) return;

        await apiService.addOrderItem({
          orderId,
          menuItemId,
          quantity,
          unitPrice: menuItem.price,
          note,
        });

        showToast("Thêm món thành công", "success");

        if (selectedTable) {
          await loadTableDetails(selectedTable.id);
        }
      } catch {
        showToast("Lỗi khi thêm món", "error");
      }
    },
    [apiService, menuItems, selectedTable, loadTableDetails, showToast]
  );

  const updateOrderItemQuantity = useCallback(
    async (orderDetailId: number, newQuantity: number) => {
      try {
        if (newQuantity <= 0) {
          await apiService.deleteOrderItem(orderDetailId);
          showToast("Xóa món thành công", "success");
        } else {
          await apiService.updateOrderItem(orderDetailId, {
            quantity: newQuantity,
            unitPrice: selectedOrder?.orderDetails.find(
              (d) => d.id === orderDetailId
            )?.unitPrice || 0,
            note: selectedOrder?.orderDetails.find(
              (d) => d.id === orderDetailId
            )?.note,
          });
          showToast("Cập nhật số lượng thành công", "success");
        }

        if (selectedTable) {
          await loadTableDetails(selectedTable.id);
        }
      } catch {
        showToast("Lỗi khi cập nhật", "error");
      }
    },
    [apiService, selectedOrder, selectedTable, loadTableDetails, showToast]
  );

  const requestPayment = useCallback(
    async (orderId: number) => {
      try {
        setLoading(true);
        setLoadingMessage("Đang yêu cầu thanh toán...");

        await apiService.requestPayment(orderId);
        showToast("Yêu cầu thanh toán thành công", "success");

        await loadTables();
        if (selectedTable) {
          await loadTableDetails(selectedTable.id);
        }
      } catch {
        showToast("Lỗi khi yêu cầu thanh toán", "error");
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    },
    [apiService, selectedTable, loadTables, loadTableDetails, showToast]
  );

  const handleTableClick = useCallback(
    async (table: Table) => {
      if (table.status === "Available") {
        setSelectedTableForOrder(table);
        setShowCreateOrderModal(true);
      } else {
        await loadTableDetails(table.id);
      }
    },
    [loadTableDetails]
  );

  const handleTransferTable = useCallback(() => {
  if (!selectedTable) return;
  setShowTransferModal(true);
}, [selectedTable]);

// 🔥 Confirm Transfer - SỬA LẠI
const confirmTransferTable = useCallback(
  async (targetTableId: number) => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      setLoadingMessage("Đang chuyển bàn...");

      // 🔥 THAY ĐỔI: Dùng axiosInstance thay vì apiService
      const response = await axiosInstance.post(
        `/tables/${selectedTable.id}/move-to/${targetTableId}`
      );
      
      showToast(response.data.message || "Chuyển bàn thành công", "success");

      // Refresh dữ liệu
      await loadTables();
      await loadOrders();

      // Load details bàn đích
      const targetTable = await apiService.getTable(targetTableId);
      setSelectedTable(targetTable);
      const order = await apiService.getCurrentOrder(targetTableId);
      setSelectedOrder(order);
      
      setShowTransferModal(false);
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Lỗi khi chuyển bàn"
        : "Lỗi khi chuyển bàn";
      showToast(errorMessage, "error");
      console.error('Transfer error:', error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  },
  [selectedTable, loadTables, loadOrders, apiService, showToast]
);

// 🔥 Merge Tables Handler (giữ nguyên)
const handleMergeTables = useCallback(() => {
  if (!selectedTable) return;
  setShowMergeModal(true);
}, [selectedTable]);

// 🔥 Confirm Merge - SỬA LẠI
const confirmMergeTables = useCallback(
  async (targetTableId: number) => {
    if (!selectedTable) return;

    try {
      setLoading(true);
      setLoadingMessage("Đang ghép bàn...");

      // 🔥 THAY ĐỔI: Dùng axiosInstance thay vì apiService
      const response = await axiosInstance.post('/tables/merge', {
        tableIds: [selectedTable.id, targetTableId]
      });
      
      showToast(response.data.message || "Ghép bàn thành công", "success");

      // 🔥 Ẩn bàn được ghép (sourceTable)
      setMergedTables(prev => new Set([...prev, selectedTable.id]));

      // Refresh dữ liệu
      await loadTables();
      await loadOrders();

      // Load details bàn mới (target)
      const targetTable = await apiService.getTable(targetTableId);
      setSelectedTable(targetTable);
      const order = await apiService.getCurrentOrder(targetTableId);
      setSelectedOrder(order);
      
      setShowMergeModal(false);
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Lỗi khi ghép bàn"
        : "Lỗi khi ghép bàn";
      showToast(errorMessage, "error");
      console.error('Merge error:', error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  },
  [selectedTable, loadTables, loadOrders, apiService, showToast]
);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  // Open Payment Page
  const handleOpenPayment = useCallback((orderId: number) => {
    setPaymentOrderId(orderId);
    setShowPaymentPage(true);
  }, []);

  // Close Payment Page with proper refresh
  const handleClosePayment = useCallback(async () => {
    setShowPaymentPage(false);
    setPaymentOrderId(null);
    showToast("Đã hủy thanh toán", "info");
    
    // Delay để ensure state cập nhật
    setTimeout(async () => {
      try {
        // Refresh dữ liệu chính
        await loadTables();
        await loadOrders();
        
        // Reload selected table details
        if (selectedTable) {
          const updatedTable = await apiService.getTable(selectedTable.id);
          setSelectedTable(updatedTable);
          const updatedOrder = await apiService.getCurrentOrder(selectedTable.id);
          setSelectedOrder(updatedOrder);
        }
      } catch (error) {
        console.error("Error refreshing after payment close:", error);
      }
    }, 300);
  }, [selectedTable, apiService, loadTables, loadOrders, showToast]);

  // ========== Refresh with Cooldown ==========
  const handleRefreshWithCooldown = useCallback(async () => {
    if (isRefreshing) return; // Đang refresh, bỏ qua

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const cooldownTime = 3000; // 3 seconds

    if (lastRefreshTime > 0 && timeSinceLastRefresh < cooldownTime) {
      const waitTime = Math.ceil((cooldownTime - timeSinceLastRefresh) / 1000);
      showToast(`Vui lòng đợi ${waitTime}s để làm mới lại`, "warning");
      return;
    }

    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      await Promise.all([loadTables(), loadOrders()]);
      showToast("Đã làm mới dữ liệu", "info");
    } catch (error) {
      console.error("Refresh error:", error);
      showToast("Lỗi khi làm mới dữ liệu", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, lastRefreshTime, loadTables, loadOrders, showToast]);

  // ========== Notification Polling ==========
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get<PosNotification[]>("/Notifications/unread");
        const newNotifications = response.data;
        
        // Compare with existing notifications to find new ones
        newNotifications.forEach((notification) => {
          const isDuplicate = notifications.some((n) => n.id === notification.id);
          if (!isDuplicate) {
            // Add to context
            addNotification(notification);
            // Mark as read
            api.post(`/Notifications/${notification.id}/read`).catch(err => 
              console.error("Error marking notification as read:", err)
            );
          }
        });
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    
    // Load immediately on mount
    loadNotifications();

    return () => clearInterval(interval);
  }, [api, notifications, addNotification]);

  // ========== Initial Load ==========
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setLoadingMessage("Đang tải dữ liệu...");

      try {
        await Promise.all([
          loadTables(),
          loadOrders(),
          loadMenuItems(),
        ]);
      } finally {
        setLoading(false);
        setLoadingMessage("");
      }
    };

    loadInitialData();
  }, [loadTables, loadOrders, loadMenuItems]);

  // ========== Keyboard Shortcuts ==========
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setCurrentView("tables");
      } else if (e.key === "F2") {
        e.preventDefault();
        setCurrentView("orders");
      } else if (e.key === "F3") {
        e.preventDefault();
        setCurrentView("reservations");
      } else if (e.key === "F5") {
        e.preventDefault();
        loadTables();
        loadOrders();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [loadTables, loadOrders, fullscreen]);

  // ========== Auto Refresh ==========
  useEffect(() => {
    // Chỉ refresh nếu không đang thanh toán
    if (showPaymentPage) return;

    const interval = setInterval(() => {
      loadTables();

      // Chỉ refresh details khi bàn đang phục vụ (Ordered) và không đang thanh toán
      if (selectedOrder && selectedOrder.status === "Ordered" && !showPaymentPage) {
        if (selectedTable) {
          loadTableDetails(selectedTable.id);
        }
      }
    }, 15000); // Tăng thời gian từ 10s lên 15s

    return () => clearInterval(interval);
  }, [loadTables, selectedOrder, selectedTable, apiService, loadTableDetails, showPaymentPage]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        await apiService.revokeAllTokens();
      } catch (error) {
        console.error("Error revoking tokens:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [handleLogout, apiService]);

  return (
    <>
      {loading && <LoadingOverlay message={loadingMessage} />}

      {toasts.map((toast) => (
        <ToastComponent key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

      {/* Existing modals */}
      {showCreateOrderModal && selectedTableForOrder && (
        <CreateOrderModal
          table={selectedTableForOrder}
          onClose={() => {
            setShowCreateOrderModal(false);
            setSelectedTableForOrder(null);
          }}
          onSubmit={async (data) => {
            try {
              await createOrder(selectedTableForOrder.id, data);
              setShowCreateOrderModal(false);
              setSelectedTableForOrder(null);
            } catch (error) {
              console.error("Error creating order:", error);
            }
          }}
        />
      )}

      {showQRModal && qrData && (
        <QRCodeModal
          qrUrl={qrData.qrUrl}
          tableNumber={qrData.tableNumber}
          onClose={() => {
            setShowQRModal(false);
            setQrData(null);
          }}
        />
      )}

      {/* 🔥 TRANSFER & MERGE MODALS */}
      {showTransferModal && selectedTable && (
        <TransferTableModal
          sourceTable={selectedTable}
          availableTables={tables.filter(
            (t) => t.status === "Available" && t.id !== selectedTable.id
          )}
          onClose={() => setShowTransferModal(false)}
          onConfirm={confirmTransferTable}
        />
      )}

      {showMergeModal && selectedTable && (
        <MergeTablesModal
          sourceTable={selectedTable}
          occupiedTables={tables.filter(
            (t) => t.status === "Occupied" && t.id !== selectedTable.id
          )}
          emptyTables={tables.filter(
            (t) => t.status === "Available" && t.id !== selectedTable.id
          )}
          onClose={() => setShowMergeModal(false)}
          onConfirm={confirmMergeTables}
        />
      )}

      {/* Payment Page Overlay */}
      {showPaymentPage && paymentOrderId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="flex justify-between items-center p-4 bg-white border-b sticky top-0 z-10 shadow-md">
                <h2 className="text-lg font-bold">Thanh toán</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleClosePayment}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition"
                    title="Quay lại màn hình thanh toán nếu gặp lỗi"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleClosePayment}
                    className="p-2 hover:bg-red-100 rounded-lg transition text-red-600 font-bold text-xl"
                    title="Đóng"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <PaymentPage 
                  orderId={paymentOrderId}
                  onPaymentComplete={() => {
                    setShowPaymentPage(false);
                    setPaymentOrderId(null);
                    showToast("Thanh toán thành công!", "success");
                    // Reload dữ liệu bàn
                    setTimeout(async () => {
                      try {
                        await loadTables();
                        await loadOrders();
                        if (selectedTable) {
                          const updatedTable = await apiService.getTable(selectedTable.id);
                          setSelectedTable(updatedTable);
                          const updatedOrder = await apiService.getCurrentOrder(selectedTable.id);
                          setSelectedOrder(updatedOrder);
                        }
                      } catch (error) {
                        console.error("Error refreshing after payment:", error);
                      }
                    }, 500);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100">
        {/* Header - Fixed */}
        <header className="shrink-0 bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition lg:hidden"
              >
                <Menu size={24} />
              </button>

              <h1 className="text-2xl font-bold text-slate-800">POS System</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <button
                  onClick={() => setCurrentView("tables")}
                  className={`px-3 py-1 rounded ${
                    currentView === "tables" ? "bg-white shadow" : ""
                  } transition`}
                >
                  Sơ đồ bàn (F1)
                </button>
                <button
                  onClick={() => setCurrentView("orders")}
                  className={`px-3 py-1 rounded ${
                    currentView === "orders" ? "bg-white shadow" : ""
                  } transition`}
                >
                  Đơn hàng (F2)
                </button>
                <button
                  onClick={() => setCurrentView("reservations")}
                  className={`px-3 py-1 rounded ${
                    currentView === "reservations" ? "bg-white shadow" : ""
                  } transition`}
                >
                  Đặt bàn (F3)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RequestNotificationBell />
              
              <button
                onClick={handleRefreshWithCooldown}
                disabled={isRefreshing}
                className={`p-2 transition flex items-center justify-center ${
                  isRefreshing 
                    ? "bg-slate-200 cursor-not-allowed opacity-60" 
                    : "hover:bg-slate-100"
                }`}
                title="Làm mới (F5)"
              >
                <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
              </button>

              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
                title={fullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              >
                {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>

              <div className="text-sm text-slate-600 border-l pl-3">
                <div className="font-medium">Ca: Sáng</div>
                <div className="text-xs">Admin</div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut size={20} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-hidden">
          {currentView === "tables" ? (
            <TablesView
              tables={tables.filter((t) => !mergedTables.has(t.id))}
              menuItems={menuItems}
              selectedTable={selectedTable}
              selectedOrder={selectedOrder}
              fullscreen={fullscreen}
              onTableClick={handleTableClick}
              onAddOrderItem={addOrderItem}
              onUpdateItemQuantity={updateOrderItemQuantity}
              onRequestPayment={requestPayment}
              onShowQR={(tableId: number) => {
                const table = tables.find((t) => t.id === tableId);
                if (table && table.qrCodeUrl) {
                  setQrData({
                    qrUrl: table.qrCodeUrl,
                    tableNumber: table.tableNumber,
                  });
                  setShowQRModal(true);
                }
              }}
              onTransferTable={handleTransferTable}
              onMergeTable={handleMergeTables}
              onOpenPayment={handleOpenPayment}
            />
          ) : currentView === "orders" ? (
            <OrdersView orders={orders} onRefresh={loadOrders} />
          ) : (
            <ReservationsView />
          )}
        </main>
      </div>
    </>
  );
}
