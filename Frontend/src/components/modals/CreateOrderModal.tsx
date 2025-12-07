import { useState } from "react";
import { X } from "lucide-react";
import type { Table } from "../../services/APIService";

export function CreateOrderModal({
  table,
  onClose,
  onSubmit,
}: {
  table: Table;
  onClose: () => void;
  onSubmit: (data: {
    numberOfGuests: number;
    customerId?: number;
    customerName?: string;
    customerPhone?: string;
  }) => void;
}) {
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [needVoucher, setNeedVoucher] = useState(false);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const handleSubmit = () => {
    if (needVoucher && !customerId && (!customerName || !customerPhone)) {
      alert("Vui lòng chọn khách hàng hoặc nhập đầy đủ thông tin!");
      return;
    }
    onSubmit({
      numberOfGuests,
      customerId: needVoucher ? customerId : undefined,
      customerName: needVoucher && !customerId ? customerName : undefined,
      customerPhone: needVoucher && !customerId ? customerPhone : undefined,
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-bold">
            Tạo Order - Bàn {table.tableNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Số lượng khách *
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={numberOfGuests}
              onChange={(e) =>
                setNumberOfGuests(
                  Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={needVoucher}
                onChange={(e) => setNeedVoucher(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300"
              />
              <div>
                <div className="font-medium">Khách có voucher/tích điểm</div>
                <div className="text-xs text-slate-500">
                  Cần nhập thông tin khách hàng
                </div>
              </div>
            </label>

            {needVoucher && (
              <div className="space-y-3 pl-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ID Khách hàng (tùy chọn)
                  </label>
                  <input
                    type="number"
                    value={customerId || ""}
                    onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Nhập ID khách hàng..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                {!customerId && (
                  <>
                    <div className="text-xs text-center text-slate-500">Hoặc nhập thông tin khách hàng</div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Tên khách hàng
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Tạo Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
