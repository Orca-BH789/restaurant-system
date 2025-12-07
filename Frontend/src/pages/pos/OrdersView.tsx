import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Order } from "../../services/APIService";

export function OrdersView({
  orders,
  onRefresh,
}: {
  orders: Order[];
  onRefresh: (status?: string) => Promise<void>;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const statuses = [
    { value: "all", label: "Tất cả", color: "bg-slate-100" },
    {
      value: "Ordered",
      label: "Đang phục vụ",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "PendingPayment",
      label: "Chờ thanh toán",
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      value: "Completed",
      label: "Hoàn thành",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "Cancelled",
      label: "Đã hủy",
      color: "bg-red-100 text-red-700",
    },
  ];

  const filteredOrders =
    filterStatus === "all"
      ? orders.filter((o) => {
          const orderDate = new Date(o.orderTime).toISOString().split("T")[0];
          return orderDate === selectedDate;
        })
      : orders.filter((o) => {
          const orderDate = new Date(o.orderTime).toISOString().split("T")[0];
          return o.status === filterStatus && orderDate === selectedDate;
        });

  return (
    <div className="flex-1 p-4">
      <div className="bg-white rounded-lg shadow">
        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Danh sách đơn hàng</h2>
            <button
              onClick={() =>
                onRefresh(filterStatus === "all" ? undefined : filterStatus)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filterStatus === status.value
                      ? status.color + " font-medium"
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Mã đơn
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Bàn
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Số khách
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">
                    #{order.id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.tables
                      ?.map((t) => `Bàn ${t.tableNumber}`)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.customerName || "Khách lẻ"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.numberOfGuests}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">
                    {order.totalAmount.toLocaleString()}đ
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "Ordered"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "PendingPayment"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status === "Ordered"
                        ? "Đang phục vụ"
                        : order.status === "PendingPayment"
                        ? "Chờ thanh toán"
                        : order.status === "Completed"
                        ? "Hoàn thành"
                        : "Đã hủy"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(order.orderTime).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:underline">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Không có đơn hàng nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
