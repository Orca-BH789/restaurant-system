import { useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import type { ToastType } from "../../services/APIService";

export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: ToastType;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : type === "warning"
      ? "bg-yellow-500"
      : "bg-blue-500";

  const icon =
    type === "success" ? (
      <Check size={20} />
    ) : type === "error" ? (
      <X size={20} />
    ) : type === "warning" ? (
      <AlertCircle size={20} />
    ) : null;

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 shadow-lg flex items-center gap-3 animate-slide-in`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
