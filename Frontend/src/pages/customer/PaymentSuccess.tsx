import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
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
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Thanh toán thành công! ✅</h1>
        <p className="text-gray-600 text-lg mb-6">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
        
        <div className="text-xl font-semibold text-gray-700">
          Quay về sau <span className="text-green-600">{countdown}</span> giây...
        </div>
      </div>
    </div>
  );
}
