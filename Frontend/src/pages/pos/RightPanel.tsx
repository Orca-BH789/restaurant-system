import { useState } from "react";
import { ShoppingCart, ArrowRightLeft, Copy, Search, Loader } from "lucide-react";
import axios from "axios";
import { PrintTempBillButton } from "./PrintTempBillButton";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import type { Table, Order, MenuItem } from "../../services/APIService";

interface Promotion {
  id: number;
  name: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  isValid: boolean;
  isExpired: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

interface RightPanelProps {
  selectedTable: Table;
  selectedOrder: Order | null;
  menuItems?: MenuItem[];
  onAddOrderItem?: (orderId: number, menuItemId: number, quantity: number, note?: string) => Promise<void>;
  onUpdateItemQuantity: (orderDetailId: number, newQuantity: number) => Promise<void>;
  onRequestPayment: (orderId: number) => Promise<void>;
  onTransferTable?: () => void;
  onMergeTable?: () => void;
  onOpenPayment?: (orderId: number) => void;
  onOrderUpdated?: (updatedOrder: Order) => void; 
}

export function RightPanel({
  selectedTable,
  selectedOrder,
  onUpdateItemQuantity,
  onRequestPayment,
  onTransferTable,
  onMergeTable,
  onOpenPayment,
  onOrderUpdated,
}: RightPanelProps) {
  const [searchPromo, setSearchPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchMessage, setSearchMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Search for promotion by code
  const handleSearchPromotion = async () => {
    if (!searchPromo.trim()) {
      setSearchMessage({ type: 'error', text: '❌ Vui lòng nhập mã khuyến mãi' });
      return;
    }

    setLoadingSearch(true);
    setSearchMessage(null);

    try {
      const baseURL = getApiBaseUrl();
      const code = searchPromo.toUpperCase().trim();
      
      // Call API to get promotion by code
      const response = await axios.get<ApiResponse<Promotion>>(
        `${baseURL}/promotions/by-code/${code}`
      );

      if (response.data.success) {
        setAppliedPromo(response.data.data);
        setSearchMessage({ 
          type: 'success', 
          text: `✓ Tìm thấy: ${response.data.data.code} - ${response.data.data.name}` 
        });
        setSearchPromo('');
      }
    } catch (error: unknown) {
      console.error('Lỗi khi tìm khuyến mãi:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setSearchMessage({ 
          type: 'error', 
          text: `❌ Không tìm thấy mã khuyến mãi "${searchPromo.toUpperCase()}"` 
        });
      } else {
        setSearchMessage({ 
          type: 'error', 
          text: '❌ Lỗi khi tìm kiếm khuyến mãi' 
        });
      }
      setAppliedPromo(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Thêm hàm áp dụng khuyến mãi vào order
const handleApplyPromotion = async () => {
  if (!appliedPromo || !selectedOrder) return;

  try {
    const baseURL = getApiBaseUrl();
    const token = localStorage.getItem('token');

    // Tính toán giá trị giảm
    let discountValue = 0;
    if (appliedPromo.discountPercent) {
      discountValue = Math.round(subTotal * (appliedPromo.discountPercent / 100));
    } else if (appliedPromo.discountAmount) {
      discountValue = appliedPromo.discountAmount;
    }

    // Gọi API để cập nhật order với promotion
    const response = await axios.put(
      `${baseURL}/orders/${selectedOrder.id}/apply-promotion`,
      {
        promotionId: appliedPromo.id,
        discountAmount: discountValue
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      setSearchMessage({ 
        type: 'success', 
        text: `✓ Đã áp dụng khuyến mãi ${appliedPromo.code} - Giảm ${discountValue.toLocaleString()}đ` 
      });
      
      // 🔥 KHÔNG RELOAD - Cập nhật lại order từ API
      const updatedOrderResponse = await axios.get(
        `${baseURL}/orders/${selectedOrder.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );      
     
      if (onOrderUpdated) {
        onOrderUpdated(updatedOrderResponse.data);
      }
      
      // Clear promotion search
      setAppliedPromo(null);
      setSearchPromo('');
      
      // Show success message trong 3 giây
      setTimeout(() => {
        setSearchMessage(null);
      }, 3000);
    }
  } catch (error) {
    console.error('Lỗi áp dụng khuyến mãi:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        setSearchMessage({ 
          type: 'error', 
          text: '❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' 
        });
      } else if (error.response?.data?.message) {
        setSearchMessage({ 
          type: 'error', 
          text: `❌ ${error.response.data.message}` 
        });
      } else {
        setSearchMessage({ 
          type: 'error', 
          text: '❌ Không thể áp dụng khuyến mãi' 
        });
      }
    }
  }
};

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchPromotion();
    }
  };

  if (!selectedOrder) {
    return (
      <div className="h-full bg-white rounded-lg shadow p-6 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
          <div className="text-lg">
            Bàn {selectedTable.tableNumber} chưa có đơn hàng
          </div>
          <div className="text-sm mt-2">
            Nhấp vào bàn trống để tạo order mới
          </div>
        </div>
      </div>
    );
  }

  const total = selectedOrder.totalAmount || 0;
  const subTotal = selectedOrder.subTotal || 0;
  const tax = selectedOrder.taxAmount || 0;
  const discount = selectedOrder.discountAmount || 0;

  return (
    <div className="h-full bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b pb-3 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-xl font-bold">
              Bàn {selectedTable.tableNumber}
            </div>
            <div className="text-sm text-slate-500">
              {selectedOrder.numberOfGuests} khách | Đơn #{selectedOrder.id}
            </div>
            {selectedOrder.customerName && (
              <div className="text-xs text-blue-600 mt-1">
                👤 {selectedOrder.customerName}
              </div>
            )}
            <div
              className={`text-xs mt-1 px-2 py-1 inline-block rounded ${
                selectedOrder.status === "Ordered"
                  ? "bg-blue-100 text-blue-700"
                  : selectedOrder.status === "PendingPayment"
                  ? "bg-yellow-100 text-yellow-700"
                  : selectedOrder.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {selectedOrder.status === "Ordered"
                ? "Đang phục vụ"
                : selectedOrder.status === "PendingPayment"
                ? "Chờ thanh toán"
                : selectedOrder.status === "Completed"
                ? "Đã thanh toán"
                : selectedOrder.status}
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {total.toLocaleString()}đ
          </div>
        </div>

        {/* Action Buttons */}
        {selectedOrder.status === "Ordered" && (
          <div className="flex gap-2">
            {onTransferTable && (
              <button
                onClick={onTransferTable}
                className="flex-1 px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ArrowRightLeft size={16} />
                Chuyển bàn
              </button>
            )}
            {onMergeTable && (
              <button
                onClick={onMergeTable}
                className="flex-1 px-3 py-2 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Copy size={16} />
                Gộp bàn
              </button>
            )}
            <PrintTempBillButton
              selectedOrder={selectedOrder}
              selectedTable={selectedTable}
            />
          </div>
        )}

        {selectedOrder.status === "PendingPayment" && (
          <div className="flex gap-2">
            <PrintTempBillButton
              selectedOrder={selectedOrder}
              selectedTable={selectedTable}
            />
          </div>
        )}
      </div>

      {/* Order Items - Scrollable */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header cố định */}
        <div className="font-semibold mb-2 pb-2 border-b bg-white shrink-0">
          Chi tiết đơn hàng:
        </div>

        {/* Content có thể cuộn */}
        <div className="overflow-y-auto flex-1">
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
              (() => {
                // 🔥 GROUP các món theo menuItemId
                const groupedItems = selectedOrder.orderDetails.reduce((acc, item) => {
                  const key = item.menuItemId?.toString() || item.menuItemName; // Fallback to name if no ID
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(item);
                  return acc;
                }, {} as Record<string, typeof selectedOrder.orderDetails>);

                return Object.entries(groupedItems).map(([key, items]) => {
                  const menuName = items[0].menuItemName;
                  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
                  const totalPrice = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

                  // Lấy trạng thái mới nhất
                  const latestItem = [...items].sort((a, b) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                  )[0];

                  return (
                    <div key={key} className="bg-white p-3 rounded border hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{menuName}</div>

                          {/* Note */}
                          {latestItem.note && (
                            <div className="text-xs text-slate-600 italic mt-1 bg-yellow-50 px-2 py-1 rounded">
                              📝 {latestItem.note}
                            </div>
                          )}

                          <div className="text-xs text-slate-500 mt-1">
                            {latestItem.unitPrice.toLocaleString()}đ x {totalQty}
                          </div>

                          {/* Status badge - hiển thị trạng thái mới nhất */}
                          <div className={`text-xs mt-1 px-2 py-1 inline-block rounded ${
                            latestItem.status === "Pending" ? "bg-gray-100 text-gray-600" :
                            latestItem.status === "Cooking" ? "bg-orange-100 text-orange-600" :
                            latestItem.status === "Ready" ? "bg-blue-100 text-blue-600" :
                            latestItem.status === "Done" ? "bg-green-100 text-green-600" :
                            "bg-red-100 text-red-600"
                          }`}>
                            {latestItem.status === "Pending" ? "Chờ" :
                            latestItem.status === "Cooking" ? "Đang nấu" :
                            latestItem.status === "Ready" ? "Sẵn sàng" :
                            latestItem.status === "Done" ? "Đã phục vụ" :
                            "Đã hủy"}
                          </div>
                        </div>

                        <div className="font-semibold text-red-600 ml-2">
                          {totalPrice.toLocaleString()}đ
                        </div>
                      </div>

                      {/* Quantity controls - chỉ show cho món Pending */}
                      {selectedOrder.status === "Ordered" && latestItem.status === "Pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateItemQuantity(latestItem.id, latestItem.quantity - 1)}
                            className="w-7 h-7 rounded flex items-center justify-center font-bold bg-slate-200 hover:bg-slate-300"
                          >
                            -
                          </button>
                          <div className="w-14 h-7 flex items-center justify-center font-semibold border rounded">
                            {latestItem.quantity}
                          </div>
                          <button
                            onClick={() => onUpdateItemQuantity(latestItem.id, latestItem.quantity + 1)}
                            className="w-7 h-7 rounded flex items-center justify-center font-bold bg-slate-200 hover:bg-slate-300"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()
            ) : (
              <div className="text-center text-slate-400 py-4">Chưa có món nào</div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 && (
        <div className="border-t pt-3 shrink-0 overflow-y-auto max-h-[250px]">
            {/* Promotion Search */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                💰 Áp dụng mã khuyến mãi
              </label>
              
              {/* Search Input & Button */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nhập mã khuyến mãi..."
                  value={searchPromo}
                  onChange={(e) => setSearchPromo(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearchPromotion}
                  disabled={loadingSearch}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${
                    loadingSearch
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loadingSearch ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Tìm kiếm
                    </>
                  )}
                </button>
              </div>

              {/* Search Error Message */}
              {searchMessage && searchMessage.type === 'error' && (
                <div className="px-3 py-2 rounded-lg text-xs font-medium mb-2 bg-red-50 text-red-700 border border-red-200">
                  {searchMessage.text}
                </div>
              )}

              {/* Applied Promotion - Simple Display */}     
            {appliedPromo && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-blue-700">
                    💰 {appliedPromo.name}
                  </div>
                  <button
                    onClick={() => {
                      setAppliedPromo(null);
                      setSearchMessage(null);
                      setSearchPromo('');
                    }}
                    className="text-gray-400 hover:text-gray-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="text-xs text-blue-600 mb-2">
                  Mã: {appliedPromo.code}
                </div>
                
                <div className="text-sm font-bold text-blue-700 mb-3">
                  Giảm: {appliedPromo.discountPercent 
                    ? `${appliedPromo.discountPercent}% (${Math.round(subTotal * (appliedPromo.discountPercent / 100)).toLocaleString()}đ)`
                    : `${appliedPromo.discountAmount?.toLocaleString()}đ`
                  }
                </div>

                {/* APPLY BUTTON */}
                <button
                  onClick={handleApplyPromotion}
                  className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Áp dụng khuyến mãi
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{subTotal.toLocaleString()}đ</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span>-{discount.toLocaleString()}đ</span>
              </div>
            )}
            {appliedPromo && (
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>Khuyến mãi ({appliedPromo.code}):</span>
                <span>-{appliedPromo.discountPercent 
                  ? Math.round(subTotal * (appliedPromo.discountPercent / 100))
                  : appliedPromo.discountAmount
                }đ</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Thuế (10%):</span>
              <span>{tax.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Tổng cộng:</span>
              <span className="text-red-600">{total.toLocaleString()}đ</span>
            </div>
          </div>

          {selectedOrder.status === "Ordered" && (
            <button
              onClick={() => onRequestPayment(selectedOrder.id)}
              className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition text-lg"
            >
              Yêu cầu thanh toán
            </button>
          )}

          {selectedOrder.status === "PendingPayment" && (
            <button
              onClick={() => onOpenPayment?.(selectedOrder.id)}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg"
            >
              Xác nhận thanh toán
            </button>
          )}
        </div>
      )}
    </div>
  );
}
