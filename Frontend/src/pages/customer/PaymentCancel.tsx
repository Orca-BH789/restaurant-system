import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-red-500 to-orange-600 rounded-full mb-6 shadow-lg">
          <XCircle className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Thanh toán bị hủy ❌</h1>
        <p className="text-gray-600 text-lg mb-6">Đơn hàng của bạn chưa được hoàn tất</p>
        
        <div className="text-xl font-semibold text-gray-700">
          Quay về sau <span className="text-red-600">{countdown}</span> giây...
        </div>
      </div>
    </div>
  );
}
