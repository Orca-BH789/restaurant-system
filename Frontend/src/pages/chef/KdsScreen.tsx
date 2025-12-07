import { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import { ChefHat, RotateCcw, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface KitchenItem {
  id: number;
  orderId?: number;
  kitchenCode: string | null;
  note: string | null;
  status: string;
  quantity: number;
  menuItemName: string;
  table: number;
  updatedAt?: string;
}

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Ordered: { bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", label: "Đơn hàng mới" },
  Pending: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800", label: "Chờ nấu" },
  Cooking: { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-800", label: "Đang nấu" },
  Ready: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-800", label: "Chín rồi" },
  Done: { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-800", label: "Hoàn tất" },
};

const statusFlow = ["Ordered", "Pending", "Cooking", "Ready", "Done"];

export default function KdsScreen() {
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchData = async () => {
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get<KitchenItem[]>(`${baseURL}/Kitchen`);
      setItems(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải món:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: number, _currentStatus: string, action: "next" | "undo") => {
    try {
      const baseURL = getApiBaseUrl();
      const url = action === "next" ? `${baseURL}/Kitchen/next/${id}` : `${baseURL}/Kitchen/undo/${id}`;
      await axios.put(url);
      fetchData();
    } catch (err) {
      console.error("❌ Cập nhật thất bại:", err);
    }
  };

  const handleTableComplete = async (tableNumber: number) => {
    try {
      const baseURL = getApiBaseUrl();
      await axios.put(`${baseURL}/Kitchen/table-done/${tableNumber}`);
      fetchData();
    } catch (err) {
      console.error("❌ Lỗi hoàn tất bàn:", err);
    }
  };

  // Group by table
  const grouped = items.reduce((acc: Record<number, KitchenItem[]>, item) => {
    if (!acc[item.table]) acc[item.table] = [];
    acc[item.table].push(item);
    return acc;
  }, {});

  const tables = Object.entries(grouped)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([table, items]) => ({ table: Number(table), items }));

  const totalPages = Math.ceil(tables.length / itemsPerPage);
  const paginatedTables = tables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = items.filter((i) => i.status !== "Done").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <ChefHat size={64} className="mx-auto mb-4 text-amber-400 animate-bounce" />
          <p className="text-xl text-slate-300">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          <div className="flex items-center gap-3">
            <ChefHat size={40} className="text-amber-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Kitchen Display System</h1>
              <p className="text-sm text-slate-400">Hệ thống hiển thị nhà bếp</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-sm text-slate-400">Món đang chờ</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {paginatedTables.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
            <ChefHat size={64} className="mx-auto mb-4 text-slate-500 opacity-50" />
            <p className="text-xl text-slate-400">Không có đơn hàng nào 😊</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedTables.map(({ table, items: tableItems }) => {
                const pendingItems = tableItems.filter((i) => i.status !== "Done");
                const allDone = pendingItems.length === 0;

                return (
                  <div
                    key={table}
                    className={`rounded-xl border-2 transition-all overflow-hidden shadow-xl ${
                      allDone
                        ? "bg-emerald-900 border-emerald-600"
                        : "bg-slate-800 border-slate-700 hover:border-amber-500"
                    }`}
                  >
                    {/* Table Header */}
                    <div
                      className={`p-4 ${
                        allDone ? "bg-emerald-800" : "bg-slate-700"
                      } flex items-center justify-between`}
                    >
                      <h2 className="text-2xl font-bold text-white">🍽️ Bàn {table}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        allDone ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                      }`}>
                        {pendingItems.length}/{tableItems.length}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {tableItems.map((item) => {
                        const config = statusConfig[item.status];
                        const currentIndex = statusFlow.indexOf(item.status);
                        const isDone = item.status === "Done";

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border-2 transition ${config.bg} ${config.border}`}
                          >
                            {/* Item Info */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className={`font-bold text-lg ${config.text}`}>
                                  {item.menuItemName}
                                </p>
                                <p className="text-sm text-slate-400">
                                  × {item.quantity}
                                  {item.kitchenCode && ` • ${item.kitchenCode}`}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${config.text}`}>
                                {config.label}
                              </span>
                            </div>

                            {/* Note */}
                            {item.note && (
                              <p className="text-xs text-slate-300 mb-2 italic border-l-2 border-amber-400 pl-2">
                                📝 {item.note}
                              </p>
                            )}

                            {/* Actions */}
                            {!isDone && (
                              <div className="flex gap-2">
                                {/* Undo Button */}
                                {currentIndex > 0 && (
                                  <button
                                    onClick={() => handleUpdateStatus(item.id, item.status, "undo")}
                                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded text-xs font-semibold transition flex items-center justify-center gap-1"
                                    title="Quay lại"
                                  >
                                    <RotateCcw size={14} />
                                    Quay lại
                                  </button>
                                )}

                                {/* Next Button */}
                                <button
                                  onClick={() => handleUpdateStatus(item.id, item.status, "next")}
                                  className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition flex items-center justify-center gap-1 text-white ${
                                    item.status === "Ready"
                                      ? "bg-emerald-600 hover:bg-emerald-500"
                                      : "bg-amber-500 hover:bg-amber-600"
                                  }`}
                                  title={item.status === "Ready" ? "Hoàn tất" : "Chuyển tiếp"}
                                >
                                  <CheckCircle size={14} />
                                  {item.status === "Ready" ? "Hoàn tất" : "Tiếp"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Table Footer */}
                    {!allDone && (
                      <div className="p-3 bg-slate-700 border-t border-slate-600">
                        <button
                          onClick={() => handleTableComplete(table)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-semibold transition"
                        >
                          ✅ Hoàn tất bàn {table}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-2 rounded-lg transition"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        currentPage === page
                          ? "bg-amber-500 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-2 rounded-lg transition"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
