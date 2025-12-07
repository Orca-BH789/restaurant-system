import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import CustomerRequestModal from './CustomerRequestModal';
import { requestNotificationService } from "../../services/RequestNotificationService";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";


// ==========================================
// ✅ Token Helper Functions (ADDED)
// ==========================================

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 phút buffer
    const isExpired = now > (exp - bufferMs); // ✅ FIXED: > thay vì >=
    
    console.log('🔍 Token check:', {
      expiresAt: new Date(exp),
      now: new Date(now),
      timeLeft: Math.round((exp - now) / 1000 / 60) + ' min',
      isExpired
    });
    
    return isExpired;
  } catch {
    return true;
  }
};

const getTokenTimeLeft = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Math.max(0, exp - Date.now());
  } catch {
    return 0;
  }
};

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  isAvailable: boolean;
}

interface OrderDetail {
  id: number;
  orderId: number;
  menuItemName: string;
  quantity: number;
  note: string | null;
  status: string;
  kitchenCode: string | null;
  createdAt: string;
}

interface GroupedOrder {
  orderId: number;
  items: OrderDetail[];
  orderTime: string;
}

export default function CustomerOrderWithCart() {
  const [searchParams] = useSearchParams();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ id: number; qty: number }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [notes, setNotes] = useState<{ [id: number]: string }>({});
  
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("Ordered");

  // ✅ NEW: Token expiry states
  const [tokenExpired, setTokenExpired] = useState(false);
  const [tokenWarning, setTokenWarning] = useState(false);

  // Tracking state
  const [showTracking, setShowTracking] = useState(false);
  const [trackingOrders, setTrackingOrders] = useState<GroupedOrder[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);

  // Anti-spam state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const lastAddToCartTime = useRef<{ [id: number]: number }>({});
  const lastSubmitTime = useRef<number>(0);
  const lastPaymentTime = useRef<number>(0);

  // ==========================================
  // ✅ Token Expiry Check (ADDED)
  // ==========================================
  
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('table_token');
      if (!token) return;

      if (isTokenExpired(token)) {
        console.error('❌ Token expired!');
        localStorage.removeItem('table_token');
        localStorage.removeItem('table_id');
        setTokenExpired(true);
        return;
      }

      const timeLeft = getTokenTimeLeft(token);
      if (timeLeft < 30 * 60 * 1000 && timeLeft > 0) {
        setTokenWarning(true);
      } else {
        setTokenWarning(false);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 60000); // Check mỗi phút
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // Initialize Token from URL
  // ==========================================
  
  useEffect(() => {
  const tid = searchParams.get("tableId");

  if (!tid) {
    alert("Vui lòng quét mã QR để truy cập!");
    setTokenExpired(true);
    return;
  }

  const finalTableId = Number(tid);
  setTableId(finalTableId);

  const fetchOrder = async () => {
    try {
      // 🔥 LUÔN GỌI API ĐỂ LẤY TOKEN MỚI
      const baseURL = getApiBaseUrl();
      const res = await axios.get(
        `${baseURL}/orders/scan-table/${finalTableId}`
      );
      
      console.log("✅ Scan result:", res.data);
      
      // 🔥 Lưu token mới vào localStorage
      const newToken = res.data.token;
      localStorage.setItem('table_token', newToken);
      localStorage.setItem('table_id', finalTableId.toString());
      
      setTableToken(newToken);
      setOrderId(res.data.order.id);
      setOrderStatus(res.data.order.status);
      
    } catch (err) {
      console.error("❌ Lỗi khi quét bàn:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setTokenExpired(true);
      } else {
        alert("Không thể truy cập. Vui lòng quét lại mã QR!");
      }
    }
  };

  fetchOrder();
}, [searchParams]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseURL = getApiBaseUrl();
        const [catRes, menuRes] = await Promise.all([
          axios.get<Category[]>(`${baseURL}/Categories`),
          axios.get<MenuItem[]>(`${baseURL}/MenuItems`),
        ]);
        setCategories(catRes.data);
        setMenuItems(menuRes.data);
        setSelectedCat(catRes.data[0]?.id || null);
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu menu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchOrderTracking = useCallback(async () => {
    if (!tableId || !tableToken) return;
    
    setTrackingLoading(true);
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get<OrderDetail[]>(
        `${baseURL}/Kitchen/table/${tableId}`,
        {
          headers: {
            "Authorization": `Bearer ${tableToken}`
          }
        }
      );
      
      const grouped = res.data.reduce((acc: Record<number, OrderDetail[]>, item) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push(item);
        return acc;
      }, {});

      const groupedArray = Object.entries(grouped).map(([orderId, items]) => ({
        orderId: Number(orderId),
        items: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        orderTime: items[0]?.createdAt || new Date().toISOString()
      })).sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());

      setTrackingOrders(groupedArray);
      
      const hasUpdate = res.data.some(item => 
        item.status === "Ready" || item.status === "Cooking"
      );
      setHasNewUpdate(hasUpdate);
    } catch (err) {
      console.error("❌ Lỗi tải tracking:", err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setTokenExpired(true);
      }
    } finally {
      setTrackingLoading(false);
    }
  }, [tableId, tableToken]);

  useEffect(() => {
    if (tableId && tableToken && !tokenExpired) {
      fetchOrderTracking();
      const interval = setInterval(fetchOrderTracking, 10000);
      return () => clearInterval(interval);
    }
  }, [tableId, tableToken, tokenExpired, fetchOrderTracking]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; icon: string; color: string; bg: string }> = {
      Ordered: { text: "Đã đặt", icon: "📝", color: "text-gray-700", bg: "bg-gray-100" },
      Pending: { text: "Chờ làm", icon: "⏳", color: "text-yellow-700", bg: "bg-yellow-100" },
      Cooking: { text: "Đang làm", icon: "👨‍🍳", color: "text-orange-700", bg: "bg-orange-100" },
      Ready: { text: "Sẵn sàng", icon: "✅", color: "text-green-700", bg: "bg-green-100" },
      Done: { text: "Hoàn thành", icon: "🎉", color: "text-blue-700", bg: "bg-blue-100" }
    };
    return statusMap[status] || statusMap.Ordered;
  };

  const getProgressPercent = (status: string) => {
    const progressMap: Record<string, number> = {
      Ordered: 20,
      Pending: 40,
      Cooking: 70,
      Ready: 90,
      Done: 100
    };
    return progressMap[status] || 0;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  const cartTotalPrice = cart.reduce((sum, item) => {
    const menuItem = menuItems.find(m => m.id === item.id);
    return sum + (menuItem?.price || 0) * item.qty;
  }, 0);

  const totalTrackingItems = trackingOrders.reduce((sum, order) => 
    sum + order.items.reduce((s, item) => s + item.quantity, 0), 0
  );

  const addToCart = (id: number) => {
    if (orderStatus !== "Ordered") {
      const message = orderStatus === "Completed" 
        ? "Bữa ăn này đã trả tiền. Không thể thêm món."
        : orderStatus === "Cancelled"
        ? "Bữa ăn này đã hủy. Không thể thêm món."
        : orderStatus === "PendingPayment"
        ? "Bữa ăn này đang thanh toán. Không thể thêm món."
        : "Không thể thêm món vào order này.";
      alert(message);
      return;
    }

    const now = Date.now();
    const lastTime = lastAddToCartTime.current[id] || 0;
    
    if (now - lastTime < 500) {
      return;
    }
    
    lastAddToCartTime.current[id] = now;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.qty >= 10) {
        alert("❗Giới hạn tối đa 10 món cho mỗi loại!");
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, qty: 1 }];
    });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleAddNote = (id: number) => {
    const current = notes[id] || "";
    const note = prompt("Nhập ghi chú cho món này:", current);
    if (note !== null) {
      setNotes((prev) => ({ ...prev, [id]: note }));
    }
  };

  const removeFromCart = (id: number) => {
    const now = Date.now();
    const lastTime = lastAddToCartTime.current[id] || 0;
    
    if (now - lastTime < 300) {
      return;
    }
    
    lastAddToCartTime.current[id] = now;

    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const getQty = (id: number) => cart.find((i) => i.id === id)?.qty || 0;

  const cartDetails = cart.map((item) => {
    const menu = menuItems.find((m) => m.id === item.id)!;
    return { ...menu, qty: item.qty };
  });
  const total = cartDetails.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const filteredMenu = menuItems.filter(
    (item) =>
      (selectedCat === null || item.categoryId === selectedCat) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          const newQty = Math.max(0, c.qty + delta);
          // Giới hạn tối đa 10 món
          if (newQty > 10) {
            alert("❗Giới hạn tối đa 10 món cho mỗi loại!");
            return c;
          }
          return { ...c, qty: newQty };
        }
        return c;
      });
      return updated.filter(c => c.qty > 0);
    });
  };

  const submitOrder = async () => {
    if (isSubmittingOrder) {
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime.current < 3000) {
      alert("⚠️ Vui lòng đợi một chút trước khi đặt món tiếp!");
      return;
    }

    if (!orderId || !tableToken) {
      alert("Không tìm thấy order hoặc token không hợp lệ!");
      return;
    }

    if (cartDetails.length === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    if (orderStatus !== "Ordered") {
      alert("Không thể đặt món.");
      return;
    }

    lastSubmitTime.current = now;
    setIsSubmittingOrder(true);

    try {
      const config = {
        headers: {
          "Authorization": `Bearer ${tableToken}`
        }
      };

      for (const item of cartDetails) {
        const baseURL = getApiBaseUrl();
        await axios.post(
          `${baseURL}/OrderDetails`,
          {
            orderId,
            menuItemId: item.id,
            quantity: item.qty,
            unitPrice: item.price,
            note: notes[item.id] || "",
          },
          config
        );
      }

      alert("✅ Đặt món thành công!");
      setCart([]);
      setNotes({});
      setShowCart(false);
      
      setTimeout(() => fetchOrderTracking(), 1000);
    } catch (err: unknown) {
      console.error("❌ Lỗi gửi đơn hàng:", err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          alert("Phiên làm việc hết hạn. Vui lòng quét lại mã QR!");
          setTokenExpired(true);
        } else if (err.response?.status === 403) {
          alert("Bạn không có quyền thực hiện thao tác này!");
        } else if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert("Có lỗi xảy ra khi gửi đơn hàng.");
        }
      } else if (err instanceof Error) {
        alert(`Lỗi: ${err.message}`);
      } else {
        alert("Có lỗi không xác định xảy ra.");
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSendRequest = async (requestType: string, note: string) => {
    if (!tableId || !tableToken) {
      alert('Không tìm thấy thông tin bàn!');
      return;
    }

    try {
      // Lấy thông tin request
      const requestTitles: Record<string, string> = {
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
        other_support: "Yêu cầu khác"
      };

      const requestTitle = requestTitles[requestType] || "Yêu cầu hỗ trợ";
      const message = note ? `${requestTitle}: ${note}` : requestTitle;

      // Gửi notification lên API backend
      const baseURL = getApiBaseUrl();
      await axios.post(
        `${baseURL}/Notifications`,
        {
          type: 'CustomerRequest',
          targetRole: 'Staff',
          tableId: tableId,
          orderId: orderId,
          referenceId: null,
          title: `🔔 Yêu cầu từ Bàn ${tableId}`,
          message: message,
          payload: JSON.stringify({
            requestType: requestType,
            tableId: tableId,
            orderId: orderId,
            note: note
          })
        },
        {
          headers: {
            Authorization: `Bearer ${tableToken}`
          }
        }
      );

      // 🔥 Gửi notification tới POS screen (real-time)
      requestNotificationService.notifyRequest({
        id: `${tableId}-${Date.now()}`,
        tableId: tableId,
        requestType: requestType,
        requestCode: requestType,
        note: note,
        timestamp: Date.now(),
        status: 'pending'
      });

      alert('✅ Yêu cầu đã được gửi! Nhân viên sẽ đến ngay.');
    } catch (err) {
      console.error('❌ Lỗi gửi yêu cầu:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setTokenExpired(true);
        alert('Phiên làm việc hết hạn. Vui lòng quét lại mã QR!');
      } else {
        alert('Không thể gửi yêu cầu. Vui lòng thử lại!');
      }
    }
  };
  
  const handlePayment = async (orderId: number): Promise<void> => {
    if (isProcessingPayment) {
      return;
    }

    const now = Date.now();
    if (now - lastPaymentTime.current < 2000) {
      alert("⚠️ Vui lòng đợi một chút!");
      return;
    }

    lastPaymentTime.current = now;
    setIsProcessingPayment(true);

    try {
      const baseURL = getApiBaseUrl();
      await axios.post(
        `${baseURL}/orders/${orderId}/request-payment`,
        {},
        {
          headers: {
            "Authorization": `Bearer ${tableToken}`
          }
        }
      );
      
      alert("✅ Yêu cầu thanh toán đã được gửi! Nhân viên sẽ đến ngay.");
      setOrderStatus("PendingPayment");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setTokenExpired(true);
        }
        alert(err.response?.data?.message || "Không thể xử lý thanh toán.");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ==========================================
  // ✅ Token Expired Screen (ADDED)
  // ==========================================
  
  if (tokenExpired) {
    return (
      <div className="min-h-screenbg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-8xl mb-6 animate-bounce">⏰</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Phiên hết hạn
          </h2>
          <p className="text-gray-600 mb-2">
            Phiên làm việc của bạn đã hết hạn.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Vui lòng quét lại mã QR trên bàn để tiếp tục đặt món.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-4 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition font-semibold text-lg shadow-lg"
          >
            Quét lại mã QR
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screenbg-linear-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải menu...</p>
        </div>
      </div>
    );

  const renderOrderStatusWarning = () => {
    if (orderStatus === "Ordered") return null;

    const statusMessages: Record<string, { text: string; color: string; icon: string }> = {
      PendingPayment: {
        text: "Ai đó đang thanh toán bữa ăn. Vui lòng không chọn thêm món.",
        color: "bg-yellow-100 border-yellow-400 text-yellow-800",
        icon: "⚠️"
      },
      Completed: {
        text: "Bữa ăn đã trả tiền. Cảm ơn bạn đã sử dụng dịch vụ!",
        color: "bg-green-100 border-green-400 text-green-800",
        icon: "✅"
      },
      Cancelled: {
        text: "Bữa ăn này đã bị hủy.",
        color: "bg-red-100 border-red-400 text-red-800",
        icon: "❌"
      }
    };

    const status = statusMessages[orderStatus] || {
      text: "Bữa ăn này đã thanh toán. Vui lòng gọi nhân viên để được hỗ trợ.",
      color: "bg-gray-100 border-gray-400 text-gray-800",
      icon: "ℹ️"
    };

    return (
      <div className={`max-w-6xl mx-auto px-4 py-4 mb-4`}>
        <div className={`${status.color} border-2 rounded-xl p-4 flex items-center gap-3`}>
          <span className="text-2xl">{status.icon}</span>
          <p className="font-semibold">{status.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screenbg-linear-to-br from-amber-50 via-orange-50 to-red-50 pb-32">      
      
      {/* ✅ Token Warning Banner (ADDED) */}
      {tokenWarning && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50 shadow-lg">
          ⚠️ Token sắp hết hạn trong 30 phút. Vui lòng đặt món sớm!
        </div>
      )}

      {/* HEADER */}
      <div className={`bg-white shadow-md sticky ${tokenWarning ? 'top-10' : 'top-0'} z-40`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
         <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Menu Nhà Hàng
              </h1>
              {tableId && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    Bàn {tableId}
                  </span>
                </div>
              )}
            </div>

            {/* BUTTONS GROUP */}
            <div className="flex items-center gap-3">
              {/* TRACKING BUTTON */}
              <button
                onClick={() => {
                  setShowTracking(true);
                  setHasNewUpdate(false);
                }}
                className="relative bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {hasNewUpdate && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
                {totalTrackingItems > 0 && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalTrackingItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="relative bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              {/* PAYMENT BUTTON */}
              {orderStatus === "Ordered" && (
                <button
                  onClick={() => {
                    if (orderId !== null) handlePayment(orderId);
                  }}
                  disabled={isProcessingPayment}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ${
                    isProcessingPayment 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  } text-white`}
                >
                  {isProcessingPayment ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Thanh toán ngay
                    </>
                  )}
                </button>
              )}
            </div>
          </div>


          {/* SEARCH */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* CATEGORY BAR */}
        <div className="border-t bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-6 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCat === cat.id
                      ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                      : "bg-white border-2 border-gray-200 text-gray-700 hover:border-amber-300 hover:shadow-md"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {renderOrderStatusWarning()}

      {/* MENU GRID */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-gray-500 text-lg">Không tìm thấy món nào</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={"https://webdemocuahangtraicay.io.vn/core"+ item.imageUrl || "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"}
                      alt={item.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {qty > 0 && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                        {qty}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
                      {item.name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                      {item.description}
                    </p>

                    {notes[item.id] && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 flex items-start gap-1">
                          <span>📝</span>
                          <span className="flex-1">{notes[item.id]}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-amber-600">
                        {item.price.toLocaleString()}₫
                      </span>
                      <button
                        onClick={() => handleAddNote(item.id)}
                        disabled={orderStatus !== "Ordered"}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Ghi chú
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={orderStatus !== "Ordered"}
                          className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                      )}
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={orderStatus !== "Ordered"}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {qty > 0 ? "Thêm nữa" : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && orderStatus === "Ordered" && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-lg">{cart.reduce((a, b) => a + b.qty, 0)} món</span>
          <span className="text-xl">• {total.toLocaleString()}₫</span>
        </button>
      )}      
     
    {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center animate-fadeIn">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
              <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-4 md:p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Giỏ hàng</span>
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 text-lg">Giỏ hàng trống</p>
                </div>
              ) : (
                cart.map(item => {
                  const menuItem = menuItems.find(m => m.id === item.id);
                  if (!menuItem) return null;

                  return (
                    <div key={item.id} className="bg-gray-50 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-1">{menuItem.name}</h3>
                          <p className="text-amber-600 font-semibold">{formatCurrency(menuItem.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold transition"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-bold text-lg">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center font-bold transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <textarea
                        placeholder="Ghi chú (ví dụ: không hành, ít cay...)"
                        value={notes[item.id] || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        rows={2}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t p-4 md:p-6bg-linear-to-br from-amber-50 to-orange-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-700">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    {formatCurrency(cartTotalPrice)}
                  </span>
                </div>
                
                <button
                  onClick={submitOrder}
                  disabled={isSubmittingOrder}
                  className="w-full py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đặt món...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Xác nhận đặt món</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTracking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center animate-fadeIn">
          <div className="bg-white w-full md:max-w-3xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
            {/* Tracking Header */}
            <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-4 md:p-6 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Theo dõi món ăn</span>
              </h2>
              <button
                onClick={() => {
                  setShowTracking(false);
                  setHasNewUpdate(false);
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tracking Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {trackingLoading ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : trackingOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🍴</div>
                  <p className="text-gray-500 text-lg">Chưa có đơn hàng nào</p>
                  <p className="text-gray-400 text-sm mt-2">Hãy đặt món để theo dõi!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {trackingOrders.map((order) => (
                    <div key={order.orderId} className="bg-linear-to-br from-gray-50 to-white rounded-2xl p-4 md:p-5 shadow-md border border-gray-200">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b">
                        <div>
                          <p className="text-sm text-gray-500">Đơn hàng #{order.orderId}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="mr-1">🕐</span>
                            {formatTime(order.orderTime)}
                          </p>
                        </div>
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {order.items.length} món
                        </div>
                      </div>

                      <div className="space-y-3">
                        {order.items.map((item) => {
                          const statusInfo = getStatusInfo(item.status);
                          const progress = getProgressPercent(item.status);

                          return (
                            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800 text-base mb-1 flex items-center gap-2">
                                    <span>{item.menuItemName}</span>
                                    <span className="text-sm text-gray-500">× {item.quantity}</span>
                                  </h3>
                                  {item.note && (
                                    <p className="text-xs text-blue-600 mt-1 flex items-start gap-1">
                                      <span>📝</span>
                                      <span className="italic">{item.note}</span>
                                    </p>
                                  )}
                                  {item.kitchenCode && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Mã: {item.kitchenCode}
                                    </p>
                                  )}
                                </div>
                                <span className={`${statusInfo.bg} ${statusInfo.color} px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1`}>
                                  <span>{statusInfo.icon}</span>
                                  <span>{statusInfo.text}</span>
                                </span>
                              </div>

                              <div className="relative">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      item.status === "Done" ? "bg-blue-500" :
                                      item.status === "Ready" ? "bg-green-500" :
                                      item.status === "Cooking" ? "bg-orange-500" :
                                      item.status === "Pending" ? "bg-yellow-500" :
                                      "bg-gray-400"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                
                                <div className="flex justify-between mt-2 px-1">
                                  {["Ordered", "Pending", "Cooking", "Ready", "Done"].map((step) => {
                                    const stepInfo = getStatusInfo(step);
                                    const isActive = getProgressPercent(item.status) >= getProgressPercent(step);
                                    const isCurrent = item.status === step;
                                    
                                    return (
                                      <div key={step} className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                                          isActive 
                                            ? `${stepInfo.bg} ${stepInfo.color} scale-110` 
                                            : "bg-gray-200 text-gray-400"
                                        } ${isCurrent ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}>
                                          {stepInfo.icon}
                                        </div>
                                        <span className={`text-[10px] mt-1 hidden md:block ${
                                          isActive ? "text-gray-700 font-semibold" : "text-gray-400"
                                        }`}>
                                          {stepInfo.text}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {item.status === "Ready" && (
                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm text-green-700 font-medium">
                                    Món đã sẵn sàng! Nhân viên sẽ mang ra ngay
                                  </p>
                                </div>
                              )}
                              {item.status === "Cooking" && (
                                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-center gap-2">
                                  <svg className="w-5 h-5 text-orange-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-sm text-orange-700 font-medium">
                                    Đầu bếp đang chế biến món của bạn
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tracking Footer */}
            <div className="border-t p-4 md:p-6 bg-linear-to-r rounded-b-3xl from-amber-50 to-orange-50 sticky bottom-0">
              <button
                onClick={fetchOrderTracking}
                disabled={trackingLoading}
                className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className={`w-5 h-5 ${trackingLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {trackingLoading ? "Đang cập nhật..." : "Làm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce z-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đã thêm vào giỏ hàng!
        </div>
      )}
      <CustomerRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleSendRequest}
      />

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}