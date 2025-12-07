import { Loader2 } from "lucide-react";

export function LoadingOverlay({ message = "Đang tải..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="text-lg font-semibold text-slate-700">{message}</div>
      </div>
    </div>
  );
}
