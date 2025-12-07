import { X } from "lucide-react";
import type { Table } from "../../services/APIService";

export function TransferTableModal({
  sourceTable,
  availableTables,
  onClose,
  onConfirm,
}: {
  sourceTable: Table;
  availableTables: Table[];
  onClose: () => void;
  onConfirm: (targetTableId: number) => void;
}) {
  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-bold">Chuyển bàn</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-600 mb-4">
            Chọn bàn để chuyển đơn hàng từ bàn {sourceTable.tableNumber}
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {availableTables.length > 0 ? (
              availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onConfirm(table.id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <div className="font-medium">Bàn {table.tableNumber}</div>
                  <div className="text-xs text-slate-500">
                    Sức chứa: {table.capacity} | {table.guestCount || 0} khách
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-slate-400 py-4">
                Không có bàn trống
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
