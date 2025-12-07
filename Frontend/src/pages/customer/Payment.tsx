import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CreditCard, Smartphone, Banknote, Check, AlertCircle } from "lucide-react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

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
  subtotal: number;
}

interface Order {
  id: number;
  orderDetails: OrderDetail[];
}

interface LocationState {
  invoice?: Invoice;
  total?: number;
  orderId?: number;
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [invoice, setInvoice] = useState<Invoice | null>(state?.invoice ?? null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const orderId = invoice?.orderId ?? state?.orderId;
  const total = invoice?.amount ?? 0;

  useEffect(() => {
    const loadInvoice = async () => {
      if (invoice || !orderId) return;

      setIsLoading(true);
      try {
        const baseURL = getApiBaseUrl();
        const res = await axios.get(`${baseURL}/Invoices/Pay/${orderId}`);
        setInvoice(res.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            try {
              const baseURL = getApiBaseUrl();
              const createRes = await axios.post(
                `${baseURL}/Invoices/from-order/${orderId}?userId=9`
              );
              const newInvoice = createRes.data;
              navigate("/payment", { state: { invoice: newInvoice, total } });
            } catch (createErr: unknown) {
              if (axios.isAxiosError(createErr)) {
                console.error("❌ Lỗi tạo invoice:", createErr.response?.data || createErr.message);
              } else {
                console.error("❌ Lỗi không xác định:", createErr);
              }
              alert("Không thể tạo invoice, thử lại sau!");
            }
          } else {
            console.error("❌ Lỗi khi lấy invoice:", err.response?.data || err.message);
            alert("Không thể xử lý thanh toán.");
          }
        } else {
          console.error("❌ Lỗi ngoài Axios:", err);
          alert("Đã xảy ra lỗi không mong muốn.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoice, orderId, navigate, total]);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) return;
      try {
        const baseURL = getApiBaseUrl();
        const res = await axios.get(`${baseURL}/Orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("❌ Lỗi load order details:", err);
      }
    };
    loadOrderDetails();
  }, [orderId]);

  const handlePayment = async () => {
  if (!invoice) return alert("Không có hóa đơn để thanh toán 😅");  
  setIsLoading(true);

  try {
    const baseURL = getApiBaseUrl();
    await axios.put(`${baseURL}/Invoices/${invoice.id}/status`, {
      status: "Paid",
    });    

    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate("/feedback", { state: { success: true, total } });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    alert("Không thể cập nhật trạng thái hóa đơn.");
  } finally {
    setIsLoading(false);
  }
};


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  const paymentOptions = [
    { value: "cash", label: "Tiền mặt", icon: Banknote, color: "green" },
    { value: "qr", label: "Quét mã QR", icon: Smartphone, color: "blue" },
    { value: "card", label: "Thẻ ngân hàng", icon: CreditCard, color: "purple" }
  ];

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
                      : "bg-green-100 text-green-700"
                  }`}>
                    {invoice.status}
                  </span>
                </div>

                {/* Order Items */}
                <div className="bg-linear-to-br overflow-auto from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 max-h-96 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">🍽️</span>
                    Chi tiết món ăn
                  </h3>
                  <div className="overflow-auto px-5 pb-5">
                  {groupedItems.length > 0 ? (
                    <div className="space-y-3">
                      {groupedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.menuItemName}</p>
                            <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-amber-600">
                              {item.subtotal.toLocaleString()}đ
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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
                          onChange={() => setPaymentMethod(option.value)}
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

                {/* QR Code Display */}
                {paymentMethod === "qr" && (
                  <div className="mt-6 p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-200">
                    <p className="text-gray-700 font-medium mb-4">Quét mã để thanh toán</p>
                    <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                      <img
                        src={`https://img.vietqr.io/image/BIDV-96247T398D-qr_only.png?amount=${total}&size=300`}
                        alt="QR Payment"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-4">
                      Sử dụng ứng dụng ngân hàng để quét mã QR
                    </p>
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
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    isLoading
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