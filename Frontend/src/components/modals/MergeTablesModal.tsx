import { X } from "lucide-react";
import { useState } from "react";
import type { Table } from "../../services/APIService";

export function MergeTablesModal({
  sourceTable,
  occupiedTables,
  emptyTables,
  onClose,
  onConfirm,
}: {
  sourceTable: Table;
  occupiedTables: Table[];
  emptyTables: Table[];
  onClose: () => void;
  onConfirm: (targetTableId: number) => void;
}) {
  const [selectedTargetTable, setSelectedTargetTable] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedTargetTable) {
      onConfirm(selectedTargetTable);
      setSelectedTargetTable(null);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-bold">Ghép bàn</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-slate-600 mb-4">
            Ghép bàn {sourceTable.tableNumber} vào 1 bàn khác
          </p>

          {/* Occupied Tables Section */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">📍 Bàn có khách</p>
            <div className="max-h-32 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {occupiedTables.length > 0 ? (
                occupiedTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTargetTable(table.id)}
                    className={`w-full p-3 text-left border rounded-lg transition ${
                      selectedTargetTable === table.id
                        ? "bg-blue-100 border-blue-400 border-2"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-medium">Bàn {table.tableNumber}</div>
                    <div className="text-xs text-slate-500">
                      {table.guestCount || 0} khách | #{table.currentOrderId}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-slate-400 py-3 text-sm">
                  Không có bàn khác đang có khách
                </div>
              )}
            </div>
          </div>

          {/* Empty Tables Section */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">🪑 Bàn trống</p>
            <div className="max-h-32 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {emptyTables.length > 0 ? (
                emptyTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTargetTable(table.id)}
                    className={`w-full p-3 text-left border rounded-lg transition ${
                      selectedTargetTable === table.id
                        ? "bg-blue-100 border-blue-400 border-2"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-medium">Bàn {table.tableNumber}</div>
                    <div className="text-xs text-slate-500">
                      {table.tableName || table.location}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-slate-400 py-3 text-sm">
                  Không có bàn trống
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTargetTable}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
