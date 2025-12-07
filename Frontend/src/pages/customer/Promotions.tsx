import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { Copy, Check } from "lucide-react";
import { Toast } from "../../components/shared/Toast";

interface Promotion {
  id: number;
  code: string;
  name: string;
  description: string;
  discountPercent: number | null;
  discountAmount: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  isExpired: boolean;
  remainingUsage: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse<Promotion[]>>(
        `${API_BASE_URL}/Promotions/active`
      );

      if (response.data.success) {
        setPromotions(response.data.data || []);
      } else {
        setError("Không thể tải danh sách khuyến mãi");
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải khuyến mãi:", err);
      setError("Lỗi khi tải danh sách khuyến mãi 😢");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setNotification({
      message: `Đã sao chép mã: ${code}`,
      type: "success",
    });

    setTimeout(() => {
      setCopiedCode(null);
      setNotification(null);
    }, 2000);
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discountPercent !== null) {
      return `${promotion.discountPercent}%`;
    } else {
      return `${(promotion.discountAmount / 1000).toFixed(0)}k`;
    }
  };

  const daysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <p className="text-center mt-10">⏳ Đang tải khuyến mãi...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-black text-red-600 uppercase">
            Khuyến mãi hoạt động
          </h2>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white rounded-xl border-2 border-red-600 font-black hover:bg-red-600 hover:text-white transition"
          >
            Quay lại
          </button>
        </div>

        {/* Danh sách khuyến mãi */}
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">
              Hiện tại không có khuyến mãi nào hoạt động
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promotion) => {
              const daysLeft = daysRemaining(promotion.endDate);
              const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;

              return (
                <div
                  key={promotion.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-100 hover:scale-[1.02] transition"
                >
                  {/* Horizontal Layout */}
                  <div className="flex items-stretch">
                    {/* Left Side - Discount Badge */}
                    <div className="relative bg-linear-to-br from-red-500 to-red-700 p-6 text-white flex flex-col items-center justify-center min-w-[200px] border-dashed border-4 border-red-300 m-4 rounded-xl">
                      {isExpiringSoon && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-red-700 px-2 py-1 rounded-full text-xs font-black">
                          ĐÃ HẾT HẠN
                        </div>
                      )}
                      <p className="text-xs text-red-100 mb-1">MÃ GIẢM</p>
                      <p className="text-5xl font-black">
                        {formatDiscount(promotion)}
                      </p>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex-1 p-6 flex flex-col justify-center">
                      {/* Title and Code */}
                      <h3 className="text-lg font-black text-red-600 mb-2">
                        NHẬP MÃ: {promotion.code}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-3">
                        {promotion.name}
                      </p>

                      {/* Details */}
                      <div className="space-y-1 text-xs text-gray-600">
                        {promotion.minOrderAmount && (
                          <div>
                            <span>Mã giảm {formatDiscount(promotion)} cho đơn tối thiểu </span>
                            <span className="font-black text-gray-800">
                              {(promotion.minOrderAmount / 1000).toFixed(0)}k
                            </span>
                          </div>
                        )}

                        {promotion.maxDiscountAmount && (
                          <div>
                            <span>Giảm tối đa: </span>
                            <span className="font-black text-gray-800">
                              {(promotion.maxDiscountAmount / 1000).toFixed(0)}k
                            </span>
                          </div>
                        )}

                        <div>
                          <span>HSD: </span>
                          <span className={`font-black ${isExpiringSoon ? 'text-red-600' : 'text-gray-800'}`}>
                            {daysLeft > 0 ? new Date(promotion.endDate).toLocaleDateString('vi-VN') : "Đã hết hạn"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => copyToClipboard(promotion.code)}
                    className={`w-full py-2 px-4 font-black transition flex items-center justify-center gap-2 text-sm border-t ${
                      copiedCode === promotion.code
                        ? "bg-green-500 text-white"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {copiedCode === promotion.code ? (
                      <>
                        <Check className="w-4 h-4" />
                        ĐÃ SAO CHÉP
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        SAO CHÉP MÃ
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
