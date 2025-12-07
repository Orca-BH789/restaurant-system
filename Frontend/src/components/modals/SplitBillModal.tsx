import { useState } from "react";
import { X, Split } from "lucide-react";
import type { Order } from "../../services/APIService";

interface SplitBillModalProps {
  isOpen: boolean;
  selectedOrder: Order | null;
  guestCount: number;
  onClose: () => void;
}

export function SplitBillModal({
  isOpen,
  selectedOrder,
  guestCount,
  onClose,
}: SplitBillModalProps) {
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [customAmounts, setCustomAmounts] = useState<number[]>(
    Array(guestCount).fill(0)
  );

  if (!isOpen || !selectedOrder) return null;

  const total = selectedOrder.totalAmount || 0;
  const amountPerPerson = Math.ceil(total / guestCount);

  const updateCustomAmount = (index: number, value: number) => {
    const newAmounts = [...customAmounts];
    newAmounts[index] = value;
    setCustomAmounts(newAmounts);
  };

  const totalCustom = customAmounts.reduce((a, b) => a + b, 0);
  const difference = total - totalCustom;

  const handlePrintSplitBill = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn tách - Đơn #${selectedOrder.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          body {
            padding: 10px;
            background: white;
          }
          .bill-container {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            border: 1px solid #000;
            padding: 15px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .bill-title {
            font-size: 14px;
            color: #d97706;
            margin-top: 5px;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 10px 0;
          }
          .split-section {
            margin: 10px 0;
            page-break-after: avoid;
          }
          .split-header {
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
          }
          .person-label {
            font-weight: bold;
          }
          .person-amount {
            font-weight: bold;
            color: #d97706;
          }
          .summary {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 11px;
          }
          .summary-total {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-weight: bold;
            font-size: 13px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .bill-container {
              border: none;
              max-width: 100%;
              page-break-after: avoid;
            }
            .split-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div>NHÀ HÀNG TEST</div>
            <div class="bill-title">🧾 HÓA ĐƠN TÁCH TIỀN</div>
          </div>

          <div style="text-align: center; font-size: 11px; margin: 8px 0;">
            <div>Đơn hàng #${selectedOrder.id}</div>
            <div>Tổng cộng: <strong>${total.toLocaleString("vi-VN")}đ</strong></div>
            <div>Số người: <strong>${guestCount}</strong></div>
          </div>

          <div class="divider"></div>

          ${customAmounts
            .map(
              (amount, index) => `
            <div class="split-section">
              <div class="split-header">Người ${index + 1}</div>
              <div class="amount-row">
                <span class="person-label">Thanh toán:</span>
                <span class="person-amount">${amount.toLocaleString(
                  "vi-VN"
                )}đ</span>
              </div>
            </div>
          `
            )
            .join("")}

          <div class="divider"></div>

          <div class="summary">
            <div class="summary-row">
              <span>Tổng tất cả các người:</span>
              <span>${totalCustom.toLocaleString("vi-VN")}đ</span>
            </div>
            ${
              difference !== 0
                ? `
            <div class="summary-row" style="color: ${difference > 0 ? "red" : "green"}; font-weight: bold;">
              <span>${difference > 0 ? "Chênh lệch:" : "Dư:"}</span>
              <span>${Math.abs(difference).toLocaleString("vi-VN")}đ</span>
            </div>
            `
                : ""
            }
            <div class="summary-total">
              <span>TỔNG HÓA ĐƠN:</span>
              <span>${total.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách!</p>
            <p>Vui lòng kiểm tra lại số tiền</p>
          </div>
        </div>

        <script>
          window.addEventListener('load', function() {
            window.print();
          });
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-linear-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-2">
            <Split size={20} />
            <h3 className="text-lg font-bold">Tách tiền hóa đơn</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="text-sm font-medium text-amber-900">Thông tin hóa đơn</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <span className="font-bold text-red-600">{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Số khách:</span>
                <span className="font-bold">{guestCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Mỗi người (bình quân):</span>
                <span className="font-bold text-amber-600">{amountPerPerson.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>

          {/* Split Method Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Cách tách tiền</label>
            <div className="space-y-2">
              <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="splitMethod"
                  value="equal"
                  checked={splitMethod === "equal"}
                  onChange={(e) => setSplitMethod(e.target.value as "equal")}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm">Chia đều ({amountPerPerson.toLocaleString("vi-VN")}đ/người)</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="splitMethod"
                  value="custom"
                  checked={splitMethod === "custom"}
                  onChange={(e) => setSplitMethod(e.target.value as "custom")}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm">Nhập tùy chỉnh</span>
              </label>
            </div>
          </div>

          {/* Custom Amounts Input */}
          {splitMethod === "custom" && (
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-900">Nhập số tiền cho mỗi người</label>
              {customAmounts.map((amount, index) => (
                <div key={index} className="flex items-center gap-2">
                  <label className="w-16 text-sm font-medium">Người {index + 1}:</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => updateCustomAmount(index, Number(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500">đ</span>
                </div>
              ))}
              <div className={`p-2 rounded text-sm font-medium ${
                difference === 0
                  ? "bg-green-100 text-green-700"
                  : difference > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {difference === 0
                  ? "✓ Chính xác"
                  : difference > 0
                  ? `Thiếu: ${difference.toLocaleString("vi-VN")}đ`
                  : `Dư: ${Math.abs(difference).toLocaleString("vi-VN")}đ`}
              </div>
            </div>
          )}

          {/* Equal Split Display */}
          {splitMethod === "equal" && (
            <div className="space-y-2 bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-900">Mỗi người trả:</div>
              {Array(guestCount)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex justify-between p-2 bg-white rounded border border-green-100">
                    <span className="text-sm">Người {index + 1}:</span>
                    <span className="text-sm font-bold text-green-700">
                      {amountPerPerson.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handlePrintSplitBill}
            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm flex items-center justify-center gap-2"
          >
            <Split size={16} />
            In tách tiền
          </button>
        </div>
      </div>
    </div>
  );
}
