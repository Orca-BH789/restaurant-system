import { useState } from "react";
import { Users, QrCode } from "lucide-react";
import { RightPanel } from "./RightPanel";
import type { Table, Order, MenuItem } from "../../services/APIService";

export function TablesView({
  tables,
  menuItems,
  selectedTable,
  selectedOrder,
  fullscreen,
  onTableClick,
  onAddOrderItem,
  onUpdateItemQuantity,
  onRequestPayment,
  onShowQR,
  onTransferTable,
  onMergeTable,
  onOpenPayment,
}: {
  tables: Table[];
  menuItems: MenuItem[];
  selectedTable: Table | null;
  selectedOrder: Order | null;
  fullscreen: boolean;
  onTableClick: (table: Table) => void;
  onAddOrderItem: (
    orderId: number,
    menuItemId: number,
    quantity?: number,
    note?: string
  ) => Promise<void>;
  onUpdateItemQuantity: (
    orderDetailId: number,
    newQuantity: number
  ) => Promise<void>;
  onRequestPayment: (orderId: number) => Promise<void>;
  onShowQR?: (tableId: number) => void;
  onTransferTable?: () => void;
  onMergeTable?: () => void;
  onOpenPayment?: (orderId: number) => void;
}) {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const locations = ["all", ...new Set(tables.map((t) => t.location || "Khác"))];

  const filteredTables =
    selectedLocation === "all"
      ? tables
      : tables.filter((t) => (t.location || "Khác") === selectedLocation);

  const shouldShowRightPanel = selectedTable && !fullscreen;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 p-3 overflow-hidden flex flex-col">
        <div
          className={`h-full grid ${
            shouldShowRightPanel ? "grid-cols-12" : "grid-cols-1"
          } gap-3`}
        >
          <div className={`${shouldShowRightPanel ? "col-span-7" : "col-span-1"} flex flex-col overflow-hidden`}>
            <div className="mb-3 bg-white rounded-lg shadow-sm p-2 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-sm ${
                      selectedLocation === loc
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200"
                    } transition`}
                  >
                    {loc === "all" ? "Tất cả" : loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-3">
              <div
                className={`grid ${
                  fullscreen
                    ? "grid-cols-8"
                    : shouldShowRightPanel
                    ? "grid-cols-4"
                    : "grid-cols-6"
                } gap-2`}
              >
                {filteredTables.map((table) => (
                  <div
                    key={table.id}
                    onClick={() => onTableClick(table)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-105 shrink-0 ${
                      table.status === "Available"
                        ? "bg-green-100 border-2 border-green-300 hover:bg-green-200"
                        : table.status === "Occupied"
                        ? "bg-red-100 border-2 border-red-300 hover:bg-red-200"
                        : "bg-yellow-100 border-2 border-yellow-300 hover:bg-yellow-200"
                    } ${
                      selectedTable?.id === table.id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="font-bold text-base">
                          Bàn {table.tableNumber}
                        </div>
                        <div className="text-xs text-slate-600">
                          {table.tableName || table.location}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {table.currentOrderId && (
                          <div className="text-xs bg-white px-1.5 py-0.5 rounded">
                            #{table.currentOrderId}
                          </div>
                        )}
                        {table.status === "Occupied" &&
                          table.qrCodeUrl &&
                          onShowQR && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowQR(table.id);
                              }}
                              className="p-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                              title="Xem QR Code"
                            >
                              <QrCode size={12} />
                            </button>
                          )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <Users size={12} />
                        <span>
                          {table.guestCount || 0}/{table.capacity}
                        </span>
                      </div>
                      {table.status === "Available" && (
                        <div className="text-xs text-green-700 font-medium">
                          Trống
                        </div>
                      )}
                      {table.status === "Occupied" && (
                        <div className="text-xs text-red-700 font-medium">
                          Đang dùng
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg shadow-sm flex gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-100 border-2 border-green-300"></div>
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-100 border-2 border-red-300"></div>
                <span>Đang dùng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                <span>Đang chờ</span>
              </div>
            </div>
          </div>

          {shouldShowRightPanel && (
            <div className="col-span-5 overflow-hidden">
              <RightPanel
                selectedTable={selectedTable}
                selectedOrder={selectedOrder}
                menuItems={menuItems}
                onAddOrderItem={onAddOrderItem}
                onUpdateItemQuantity={onUpdateItemQuantity}
                onRequestPayment={onRequestPayment}
                onTransferTable={onTransferTable}
                onMergeTable={onMergeTable}
                onOpenPayment={onOpenPayment}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
