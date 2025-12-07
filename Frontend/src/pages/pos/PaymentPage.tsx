import { useEffect, useState } from "react";
import axios from "axios";
import { CreditCard, Smartphone, Banknote, Check, AlertCircle, Clock, Loader, ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "../../hook/useAuth";

interface Invoice {
  id: number;
  orderId: number;
  amount: number;
  status: string;
  paymentTime: string;
}

interface OrderDetail {
  id: number;
  menuItemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: number;
  orderDetails: OrderDetail[];
}

interface PaymentPageProps {
  orderId?: number;
  invoiceId?: number;
  onPaymentComplete?: () => void;
}

interface PaymentData {
  status: string;
  receivedAmount?: number;
  changeAmount?: number;
}

export default function PaymentPage({ 
  orderId: propsOrderId,
  invoiceId: propsInvoiceId,
  onPaymentComplete
}: PaymentPageProps = {}) {
  const { api } = useAuth();
  
  // States
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentError, setPaymentError] = useState(false);

  // Cash Payment States
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // QR Payment States
  const [sepayQRCode, setSepayQRCode] = useState<string | null>(null);
  const [sepayCountdown, setSepayCountdown] = useState(120);
  const [sepayStatus, setSepayStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [isCheckingTransaction, setIsCheckingTransaction] = useState(false);
  const [sepayPollingInterval, setSepayPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // PayPal Payment States
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalApprovalUrl, setPaypalApprovalUrl] = useState<string | null>(null);
  const [paypalStatus, setPaypalStatus] = useState<"pending" | "success" | "failed" | null>(null);
  const [paypalPollingInterval, setPaypalPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const invoiceId = propsInvoiceId;
  const orderId = propsOrderId;
  const total = invoice?.amount ?? 0;

  // Auto calculate change amount
  useEffect(() => {
    if (paymentMethod === "cash" && receivedAmount) {
      const received = parseFloat(receivedAmount) || 0;
      const change = received - total;
      setChangeAmount(change >= 0 ? change : 0);
    } else {
      setChangeAmount(0);
    }
  }, [receivedAmount, total, paymentMethod]);

  // Load Invoice and Order (Combined)
  useEffect(() => {
    const loadData = async () => {
  
      if (invoice) return;
      setIsLoading(true);
      try {
        // Case 1: Load từ invoiceId
        if (invoiceId) {
          const res = await api.get(`/Invoices/${invoiceId}`);
          setInvoice(res.data);
          
          // Load order details nếu có orderId
          if (res.data.orderId) {
            const orderRes = await api.get(`/Orders/${res.data.orderId}`);
            setOrder(orderRes.data);
          }
          return;
        }

        // Case 2: Load từ orderId
        if (orderId) {
          try {
            // Thử lấy invoice có sẵn (cho phép cả Pending và Paid)
            const res = await api.get(`/Invoices/Pay/${orderId}`);
            if (res.data) {
              setInvoice(res.data);
            }
          } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
              // Tạo invoice mới nếu chưa có
              try {
                const createRes = await api.post(`/Invoices/from-order/${orderId}?userId=9`);
                setInvoice(createRes.data);
              } catch (createErr: unknown) {
                console.error("❌ Lỗi tạo invoice:", createErr);               
              }
            } else {
              console.error("❌ Lỗi khi lấy invoice:", err);
              alert("Không thể xử lý thanh toán.");
            }
          }

          // Load order details
          try {
            const orderRes = await api.get(`/Orders/${orderId}`);
            setOrder(orderRes.data);
          } catch (err) {
            console.error("❌ Lỗi load order details:", err);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi load dữ liệu:", err);
        alert("Không thể xử lý thanh toán.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [invoiceId, orderId, invoice, api]);

  // Handle Payment
  const handlePayment = async () => {
    if (!invoice) return alert("Không có hóa đơn để thanh toán!");
    
    if (paymentMethod === "cash") {
      const received = parseFloat(receivedAmount) || 0;
      if (received < total) {
        return alert("Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền!");
      }
    }
    
    setIsLoading(true);
    setPaymentError(false);

    try {
      const paymentData: PaymentData = { status: "Paid" };

      if (paymentMethod === "cash") {
        paymentData.receivedAmount = parseFloat(receivedAmount) || 0;
        paymentData.changeAmount = changeAmount;
      }

      await api.put(`/Invoices/${invoice.id}/status`, paymentData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onPaymentComplete) {
        onPaymentComplete();
      } else {
        alert("Thanh toán thành công!");
        window.location.reload();
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      setPaymentError(true);
      
      const shouldRevert = window.confirm(
        "Thanh toán thất bại! Bạn có muốn khôi phục order về trạng thái 'Đang phục vụ' để tiếp tục?\n\n" +
        "Chọn OK để khôi phục, hoặc Cancel để thử lại thanh toán."
      );
      
      if (shouldRevert && orderId) {
        await handleRevertToOrdered(orderId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm khôi phục order về trạng thái Ordered
  const handleRevertToOrdered = async (orderIdToRevert: number) => {
    setIsLoading(true);
    try {
      await api.post(`/Orders/${orderIdToRevert}/revert-to-ordered`);
      alert("Đã khôi phục order về trạng thái 'Đang phục vụ'. Bạn có thể tiếp tục gọi món.");
      
      if (onPaymentComplete) {
        onPaymentComplete();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("❌ Lỗi khôi phục order:", err);
      alert("Không thể khôi phục order. Vui lòng liên hệ quản lý.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR Code
  const handleGenerateQR = async () => {
    if (!invoice) return;
    setIsLoading(true);
    
    try {
      const response = await api.post("/Payment/vietqr/generate", {
        invoiceId: invoice.id,
        orderId: invoice.orderId,
        amount: total,
        description: `Thanh toán đơn hàng #${invoice.orderId}`,
      });

      if (response.data?.data) {
        const qrUrl = response.data.data.qrDataURL || 
                      `https://img.vietqr.io/image/970415-113366668888-qr_only.png?size=900&amount=${total}&addInfo=DH${invoice.orderId}`;
        
        setSepayQRCode(qrUrl);
        setSepayStatus("pending");
        setSepayCountdown(120);
        startQRPolling();
      } else {
        alert("Không thể tạo mã QR");
      }
    } catch (error) {
      console.error("❌ Lỗi tạo QR:", error);
      alert("Lỗi khi tạo mã QR. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // QR Polling
  const startQRPolling = () => {
    const interval = setInterval(async () => {
      try {
        setIsCheckingTransaction(true);      
      
        if (!invoice?.id) return;      
        const response = await api.get(`/Invoices/${invoice.id}`);
        
        console.log("🔍 Checking Invoice status:", response.data?.status);
        
        if (response.data?.status === "Completed") {
          console.log("✅ Phát hiện thanh toán thành công!");
          setSepayStatus("success");
          clearInterval(interval);
          setSepayPollingInterval(null);
          
          setTimeout(() => {
            if (onPaymentComplete) {
              onPaymentComplete();
            } else {
              alert("Thanh toán thành công!");
              window.location.reload();
            }
          }, 1000);
        }
      } catch (error) {
        console.error("❌ Lỗi check Invoice status:", error);
      } finally {
        setIsCheckingTransaction(false);
      }
    }, 3000);

    setSepayPollingInterval(interval);
  };

  // QR Countdown
  useEffect(() => {
    if (sepayStatus === "pending" && sepayCountdown > 0) {
      const timer = setTimeout(() => setSepayCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (sepayCountdown === 0 && sepayStatus === "pending") {
      setSepayStatus("failed");
      if (sepayPollingInterval) {
        clearInterval(sepayPollingInterval);
        setSepayPollingInterval(null);
      }
    }
  }, [sepayCountdown, sepayStatus, sepayPollingInterval]);

  // PayPal - Create Order
  const handleCreatePayPalOrder = async () => {
    if (!invoice) return;
    setIsLoading(true);
    
    try {
      const response = await api.post("/Payment/paypal/create-order", {
        invoiceId: invoice.id
      });

      if (response.data?.success && response.data.data) {
        setPaypalOrderId(response.data.data.orderId);
        setPaypalApprovalUrl(response.data.data.approvalUrl);
        setPaypalStatus("pending");
        
        // Mở cửa sổ PayPal trong tab mới
        window.open(response.data.data.approvalUrl, '_blank');
        
        // Bắt đầu polling để kiểm tra trạng thái
        startPayPalPolling(response.data.data.orderId);
      } else {
        alert("Không thể tạo thanh toán PayPal");
      }
    } catch (error) {
      console.error("❌ Lỗi tạo PayPal order:", error);
      alert("Lỗi khi tạo thanh toán PayPal. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // PayPal Polling
  const startPayPalPolling = (orderId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/Payment/paypal/status/${orderId}`);
        
        console.log("🔍 Checking PayPal status:", response.data?.data?.status);
        
        if (response.data?.data?.status === "completed" || response.data?.data?.status === "COMPLETED") {
          console.log("✅ PayPal payment completed!");
          setPaypalStatus("success");
          clearInterval(interval);
          setPaypalPollingInterval(null);
          
          // Capture payment
          await handleCapturePayPalPayment(orderId);
        }
      } catch (error) {
        console.error("❌ Lỗi check PayPal status:", error);
      }
    }, 3000);

    setPaypalPollingInterval(interval);
  };

  // PayPal Capture
  const handleCapturePayPalPayment = async (orderId: string) => {
    try {
      const response = await api.post(`/Payment/paypal/capture/${orderId}`);
      
      if (response.data?.success) {
        setTimeout(() => {
          if (onPaymentComplete) {
            onPaymentComplete();
          } else {
            alert("Thanh toán PayPal thành công!");
            window.location.reload();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Lỗi capture PayPal payment:", error);
      alert("Lỗi xác nhận thanh toán PayPal");
    }
  };

  // Group order items
  const groupedItems = order?.orderDetails?.reduce((acc, item) => {
    const existing = acc.find(g => g.menuItemName === item.menuItemName);
    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal += item.subtotal;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as OrderDetail[]) || [];

  const paymentOptions = [
    { value: "cash", label: "Tiền mặt", icon: Banknote, color: "green" },
    { value: "qr", label: "QR Code (Auto Confirm)", icon: Smartphone, color: "blue" },
    { value: "paypal", label: "PayPal", icon: CreditCard, color: "orange" }
  ];

  if (isLoading && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-amber-500 to-orange-500 rounded-full mb-4 shadow-lg">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Thanh toán đơn hàng
          </h1>
          <p className="text-gray-600">Vui lòng chọn phương thức thanh toán phù hợp</p>
        </div>

        {invoice ? (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Invoice Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">Thông tin hóa đơn</h2>
                    <p className="text-sm text-gray-500">Mã hóa đơn: #{invoice.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice.status === "Pending" 
                      ? "bg-yellow-100 text-yellow-700" 
                      : invoice.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {invoice.status === "Pending" ? "Chờ thanh toán" : 
                     invoice.status === "Paid" ? "Đã thanh toán" : invoice.status}
                  </span>
                </div>

                {/* Order Items */}
                <div className="bg-linear-to-br overflow-auto from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 max-h-96 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">                       
                    Chi tiết món ăn
                  </h3>

                  <div className="overflow-auto pb-4">
                    {groupedItems.length > 0 ? (
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-200 text-gray-700">
                            <th className="border px-2 py-1 text-center w-12">STT</th>
                            <th className="border px-2 py-1 text-left w-4/12">Tên món</th>
                            <th className="border px-2 py-1 text-center w-20">ĐVT</th>
                            <th className="border px-2 py-1 text-center w-20">SL</th>
                            <th className="border px-2 py-1 text-right w-24">Đơn giá</th>
                            <th className="border px-2 py-1 text-right w-28">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="border px-2 py-1 text-center">{idx + 1}</td>
                              <td className="border px-2 py-1">{item.menuItemName}</td>
                              <td className="border px-2 py-1 text-center">{item.unit}</td>
                              <td className="border px-2 py-1 text-center">{item.quantity}</td>
                              <td className="border px-2 py-1 text-right">
                                {item.unitPrice.toLocaleString()}đ
                              </td>
                              <td className="border px-2 py-1 text-right font-semibold text-amber-600">
                                {item.subtotal.toLocaleString()}đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Không có món nào</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = paymentMethod === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => {
                            setPaymentMethod(option.value);
                            setPaymentError(false);
                            
                            // Reset QR states
                            if (option.value !== "qr") {
                              setSepayQRCode(null);
                              setSepayStatus(null);
                              if (sepayPollingInterval) {
                                clearInterval(sepayPollingInterval);
                                setSepayPollingInterval(null);
                              }
                            }
                            
                            // Reset Cash states
                            if (option.value !== "cash") {
                              setReceivedAmount("");
                              setChangeAmount(0);
                            }
                            
                            // Reset PayPal states
                            if (option.value !== "paypal") {
                              setPaypalOrderId(null);
                              setPaypalApprovalUrl(null);
                              setPaypalStatus(null);
                              if (paypalPollingInterval) {
                                clearInterval(paypalPollingInterval);
                                setPaypalPollingInterval(null);
                              }
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                          isSelected ? `bg-${option.color}-100` : "bg-gray-100"
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            isSelected ? `text-${option.color}-600` : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            isSelected ? `text-${option.color}-700` : "text-gray-700"
                          }`}>
                            {option.label}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className={`w-6 h-6 text-${option.color}-600`} />
                        )}
                      </label>
                    );
                  })}
                </div>

                {/* Cash Payment Input */}
                {paymentMethod === "cash" && (
                  <div className="mt-6 p-6 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 space-y-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Thông tin thanh toán tiền mặt</h3>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="text-sm text-gray-600 mb-1 block">Tổng tiền cần thanh toán</label>
                      <div className="text-2xl font-bold text-amber-600">
                        {total.toLocaleString()}đ
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Số tiền khách đưa <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"                          
                          value={receivedAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || parseFloat(value) >= 0) {
                              setReceivedAmount(value);
                            }
                          }}
                          min={total}
                          step="1000"
                          placeholder="Nhập số tiền khách đưa"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">đ</span>
                      </div>
                      {receivedAmount && parseFloat(receivedAmount) < total && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Số tiền phải lớn hơn hoặc bằng tổng tiền cần thanh toán
                        </p>
                      )}
                    </div>

                    <div className="bg-linear-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                      <label className="text-sm text-gray-700 mb-1 block">Tiền thối lại</label>
                      <div className="text-3xl font-bold text-green-700">
                        {changeAmount.toLocaleString()}đ
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Chọn nhanh</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          Math.ceil(total / 1000) * 1000,
                          Math.ceil(total / 10000) * 10000,
                          Math.ceil(total / 50000) * 50000,
                          Math.ceil(total / 100000) * 100000,
                          Math.ceil(total / 200000) * 200000,
                          Math.ceil(total / 500000) * 500000,
                        ].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setReceivedAmount(amount.toString())}
                            className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-semibold ${
                              receivedAmount === amount.toString()
                                ? "border-green-500 bg-green-100 text-green-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-green-300"
                            }`}
                          >
                            {amount.toLocaleString()}đ
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Display */}
                {paymentMethod === "qr" && (
                  <div className="mt-6 p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    {!sepayQRCode ? (
                      <div className="text-center">
                        <p className="text-gray-700 font-medium mb-2">Quét mã QR để thanh toán tự động</p>
                        <p className="text-sm text-gray-600 mb-4">Hệ thống sẽ tự động xác nhận khi phát hiện thanh toán</p>
                        <button
                          onClick={handleGenerateQR}
                          disabled={isLoading}
                          className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
                            isLoading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                          }`}
                        >
                          {isLoading ? "Đang tạo mã QR..." : "Tạo mã QR"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="inline-block p-4 bg-white rounded-xl shadow-lg mb-4">
                          <img src={sepayQRCode} alt="VietQR Payment" className="w-64 h-64 mx-auto" />
                        </div>

                        {sepayStatus === "pending" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                              <Clock className="w-5 h-5 animate-pulse" />
                              <span>Chờ xác nhận: {sepayCountdown}s</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-linear-to-r from-blue-500 to-indigo-500 h-full transition-all"
                                style={{ width: `${(sepayCountdown / 120) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                              {isCheckingTransaction && (
                                <>
                                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                                  <span>Kiểm tra giao dịch...</span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={handlePayment}
                              disabled={isLoading}
                              className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all mt-4 ${
                                isLoading
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700 shadow-lg"
                              }`}
                            >
                              {isLoading ? "Đang xác nhận..." : "Xác nhận thanh toán thủ công"}
                            </button>
                            <p className="text-xs text-gray-600 mt-3">
                              Hệ thống sẽ tự động xác nhận khi phát hiện thanh toán thành công
                            </p>
                          </div>
                        )}

                        {sepayStatus === "success" && (
                          <div className="text-green-600 font-semibold">
                            <Check className="w-12 h-12 mx-auto mb-2" />
                            <p>Thanh toán thành công!</p>
                          </div>
                        )}

                        {sepayStatus === "failed" && (
                          <div className="text-red-600 font-semibold space-y-3">
                            <AlertCircle className="w-12 h-12 mx-auto" />
                            <p>Hết thời gian chờ</p>
                            <p className="text-sm text-gray-600">Chọn hành động tiếp theo:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setSepayQRCode(null);
                                  setSepayStatus(null);
                                  setSepayCountdown(120);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                              >
                                Tạo mã QR mới
                              </button>
                              <button
                                onClick={() => orderId && handleRevertToOrdered(orderId)}
                                disabled={isLoading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {isLoading ? "Đang xử lý..." : "Hủy thanh toán"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* PayPal Payment */}
                {paymentMethod === "paypal" && (
                  <div className="mt-6 p-6 bg-linear-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    {!paypalOrderId ? (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                          <CreditCard className="w-8 h-8 text-orange-600" />
                        </div>
                        <p className="text-gray-700 font-medium mb-2">Thanh toán an toàn với PayPal</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Số tiền: {total.toLocaleString()}đ ≈ ${(total / 24000).toFixed(2)} USD
                        </p>
                        <button
                          onClick={handleCreatePayPalOrder}
                          disabled={isLoading}
                          className={`px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 mx-auto ${
                            isLoading
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              Thanh toán với PayPal
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-md">
                          <p className="text-sm text-gray-600 mb-2">PayPal Order ID</p>
                          <p className="font-mono text-xs text-gray-800 break-all">{paypalOrderId}</p>
                        </div>

                        {paypalStatus === "pending" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-orange-600 font-semibold">
                              <Clock className="w-5 h-5 animate-pulse" />
                              <span>Chờ xác nhận từ PayPal...</span>
                            </div>
                            
                            {paypalApprovalUrl && (
                              <a
                                href={paypalApprovalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Mở lại PayPal
                              </a>
                            )}

                            <p className="text-xs text-gray-600">
                              Vui lòng hoàn tất thanh toán trên trang PayPal
                            </p>
                          </div>
                        )}

                        {paypalStatus === "success" && (
                          <div className="text-green-600 font-semibold">
                            <Check className="w-12 h-12 mx-auto mb-2" />
                            <p>Thanh toán PayPal thành công!</p>
                          </div>
                        )}

                        {paypalStatus === "failed" && (
                          <div className="text-red-600 font-semibold space-y-3">
                            <AlertCircle className="w-12 h-12 mx-auto" />
                            <p>Thanh toán thất bại</p>
                            <button
                              onClick={() => {
                                setPaypalOrderId(null);
                                setPaypalApprovalUrl(null);
                                setPaypalStatus(null);
                              }}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
                            >
                              Thử lại
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Error Message */}
                {paymentError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Thanh toán thất bại</p>
                      <p className="text-xs text-red-600 mt-1">
                        Vui lòng thử lại hoặc chọn phương thức thanh toán khác
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Tổng quan đơn hàng</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{total.toLocaleString()}đ</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Phí dịch vụ</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Tổng cộng</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {total.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isLoading || (paymentMethod === "cash" && (!receivedAmount || parseFloat(receivedAmount) < total))}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isLoading || (paymentMethod === "cash" && (!receivedAmount || parseFloat(receivedAmount) < total))
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Xác nhận thanh toán
                    </>
                  )}
                </button>

                {(invoice?.status === "PendingPayment" || paymentError) && orderId && (
                  <button
                    onClick={() => handleRevertToOrdered(orderId)}
                    disabled={isLoading}
                    className="w-full mt-3 py-3 rounded-xl font-semibold text-orange-600 border-2 border-orange-600 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Hủy và quay lại gọi món
                  </button>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng của chúng tôi
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Không tìm thấy hóa đơn
            </h3>
            <p className="text-gray-500">
              Vui lòng quay lại và thử lại sau
            </p>
          </div>
        )}
      </div>
    </div>
  );
}