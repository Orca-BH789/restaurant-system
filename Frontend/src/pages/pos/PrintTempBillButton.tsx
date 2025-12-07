import { Printer } from "lucide-react";
import { useState } from "react";
import type { Order, Table } from "../../services/APIService";

export function PrintTempBillButton({
  selectedOrder,
  selectedTable,
}: {
  selectedOrder: Order | null;
  selectedTable: Table;
}) {
  const [enableSplitBill, setEnableSplitBill] = useState(false);
  const handlePrintTempBill = () => {
    if (!selectedOrder || !selectedTable) return;

    // Tính toán
    const subtotal = selectedOrder.orderDetails?.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    ) || 0;

    const discount = selectedOrder.discountAmount || 0;
    const tax = selectedOrder.taxAmount || 0;
    const total = selectedOrder.totalAmount || subtotal - discount + tax;
    const guestCount = selectedTable.guestCount || 1;
    const amountPerGuest = Math.ceil(total / guestCount);

    // Format date/time
    const now = new Date(selectedOrder.orderTime || new Date());
    const dateStr = now.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // HTML để in
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Hóa đơn tạm</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: white;
      padding: 10px;
    }

    .bill-container {
      width: 100%;
      max-width: 320px;
      border: 1px solid #000;
      padding: 15px;
      margin: 0 auto;
      font-size: 12px;
    }

    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    /* Info rows: 2 bên 50/50 */
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 12px;
    }
    .info-label {
      font-weight: bold;
      width: 50%;
    }
    .info-value {
      width: 50%;
      text-align: right;
    }

    .divider {
      border-bottom: 1px dashed #000;
      margin: 12px 0;
    }

    /* TABLE STYLE */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    th, td {
      padding: 4px 0;
      white-space: nowrap;
    }

    th {
      font-weight: bold;
      text-align: left;
    }

    .col-name {
      width: 45%;        /* Co giãn cho tên món */
      white-space: normal;
      word-break: break-word;
    }
    .col-name  { width: 26%; white-space: normal; word-break: break-word; }
    .col-unit  { width: 13%; text-align: center; }
    .col-qty   { width: 13%; text-align: center; }
    .col-price { width: 24%; text-align: right; }
    .col-total { width: 24%; text-align: right; }


    /* Row dưới tên món dài */
    .note {
      font-size: 11px;
      color: #666;
      font-style: italic;
      padding-left: 5px;
    }

    /* SUMMARY */
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-size: 15px;
      font-weight: bold;
      padding: 6px 0;
      margin-top: 12px;
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: #777;
      margin-top: 14px;
    }
  </style>
</head>

<body>
  <div class="bill-container">

    <!-- Header -->
    <div class="header">
      <div style="font-size: 15px; font-weight: bold;">NHÀ HÀNG TEST</div>
      <div style="color: #666; font-size: 12px;">HÓA ĐƠN TẠM TÍNH</div>
    </div>

    <!-- INFO -->
    <div class="info-row"><div class="info-label">Bàn:</div>     <div class="info-value">Bàn ${selectedTable.tableNumber}</div></div>
    <div class="info-row"><div class="info-label">Đơn #:</div>    <div class="info-value">#${selectedOrder.id}</div></div>
    <div class="info-row"><div class="info-label">Ngày giờ:</div> <div class="info-value">${dateStr} - ${timeStr}</div></div>
    <div class="info-row"><div class="info-label">Khách:</div>    <div class="info-value">${guestCount} người</div></div>

    <div class="divider"></div>

    <!-- TABLE ITEMS -->
    <table>
      <thead>
        <tr>
          <th class="col-name">Tên món</th>
          <th class="col-unit">ĐV</th>
          <th class="col-qty">SL</th>
          <th class="col-price">Đơn giá</th>
          <th class="col-total">Thành tiền</th>
        </tr>
      </thead>

      <tbody>
        ${selectedOrder.orderDetails.map(i => `
          <tr>
            <td class="col-name">${i.menuItemName}</td>
            <td class="col-unit">${i.unit || "Phần"}</td>
            <td class="col-qty">${i.quantity}</td>
            <td class="col-price">${i.unitPrice.toLocaleString("vi-VN")}đ</td>
            <td class="col-total">${(i.unitPrice * i.quantity).toLocaleString("vi-VN")}đ</td>
          </tr>

          ${i.note ? `
          <tr>
            <td class="note" colspan="5">📝 ${i.note}</td>
          </tr>
          ` : ""}
        `).join("")}
      </tbody>
    </table>

    <div class="divider"></div>

    <!-- SUMMARY -->
    <div class="summary-row"><span>Tạm tính:</span> <span>${subtotal.toLocaleString("vi-VN")}đ</span></div>

    ${ tax > 0 ? `
    <div class="summary-row"><span>Thuế (10%):</span> <span>${tax.toLocaleString("vi-VN")}đ</span></div>
    ` : "" }

    <div class="total-row">
      <span>TỔNG CỘNG:</span>
      <span>${total.toLocaleString("vi-VN")}đ</span>
    </div>

      <div class="padding-top-20 split-info">
      ${ enableSplitBill ? `Mỗi người: ${amountPerGuest.toLocaleString("vi-VN")}đ` : "" }
    </div>
    <div class="footer">
      <p>Cảm ơn quý khách!</p>
      <p>Vui lòng kiểm tra hóa đơn trước khi thanh toán</p>
    </div>

  </div>

</body>
</html>
 
    `;


    // Mở window in
    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={enableSplitBill}
          onChange={(e) => setEnableSplitBill(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
        />
        <span>Chia bill theo số người</span>
      </label>
      <button
        onClick={handlePrintTempBill}
        disabled={!selectedOrder}
        className="flex-1 px-3 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Printer size={16} />
        In tạm
      </button>
    </div>
  );
}
