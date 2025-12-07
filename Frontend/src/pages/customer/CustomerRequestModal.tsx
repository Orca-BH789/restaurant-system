import { useState } from 'react';

// ✅ Define types
interface Request {
  code: string;
  title: string;
  icon: string;
  category: 'service' | 'food' | 'payment' | 'environment' | 'other';
}

interface Category {
  name: string;
  color: string;
}

type CategoryKey = 'service' | 'food' | 'payment' | 'environment' | 'other';

interface CustomerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestCode: string, requestNote: string) => Promise<void>;
}

const REQUESTS: Request[] = [
  { code: "call_staff", title: "Gọi nhân viên", icon: "🙋", category: "service" },
  { code: "request_payment", title: "Yêu cầu thanh toán", icon: "💳", category: "payment" },
  { code: "more_water", title: "Xin thêm nước", icon: "🥤", category: "food" },
  { code: "more_utensils", title: "Xin chén/dĩa/đũa", icon: "🍴", category: "food" },
  { code: "more_condiments", title: "Xin gia vị", icon: "🌶️", category: "food" },
  { code: "clean_table", title: "Lau bàn", icon: "🧹", category: "service" },
  { code: "cancel_dish", title: "Hủy món", icon: "❌", category: "food" },
  { code: "check_order_status", title: "Kiểm tra món", icon: "⏰", category: "food" },
  { code: "takeaway_pack", title: "Đóng gói mang về", icon: "📦", category: "food" },
  { code: "more_tissues", title: "Xin khăn giấy", icon: "🧻", category: "service" },
  { code: "baby_chair", title: "Xin ghế trẻ em", icon: "👶", category: "service" },
  { code: "adjust_ac", title: "Điều chỉnh nhiệt độ", icon: "❄️", category: "environment" },
  { code: "adjust_light", title: "Điều chỉnh ánh sáng", icon: "💡", category: "environment" },
  { code: "print_invoice", title: "In hóa đơn", icon: "🧾", category: "payment" },
  { code: "split_bill", title: "Tách hóa đơn", icon: "✂️", category: "payment" },
  { code: "merge_bill", title: "Gộp hóa đơn", icon: "🔗", category: "payment" },
  { code: "other_support", title: "Yêu cầu khác", icon: "💬", category: "other" }
];

const CATEGORIES: Record<CategoryKey, Category> = {
  service: { name: "Dịch vụ", color: "bg-blue-500" },
  food: { name: "Đồ ăn/uống", color: "bg-green-500" },
  payment: { name: "Thanh toán", color: "bg-purple-500" },
  environment: { name: "Môi trường", color: "bg-orange-500" },
  other: { name: "Khác", color: "bg-gray-500" }
};

export default function CustomerRequestModal({ isOpen, onClose, onSubmit }: CustomerRequestModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSending) {
      onClose();
    }
  };

  const handleRequestClick = async (request: Request) => {
    if (request.code === "other_support") {
      setSelectedRequest(request);
      setShowNoteInput(true);
    } else {
      await handleSubmit(request.code, "");
    }
  };

  const handleSubmit = async (requestCode: string, requestNote: string) => {
    setIsSending(true);
    try {
      await onSubmit(requestCode, requestNote);
      // Reset state after success
      setNote("");
      setShowNoteInput(false);
      setSelectedRequest(null);
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitWithNote = async () => {
    if (selectedRequest && note.trim()) {
      await handleSubmit(selectedRequest.code, note);
    }
  };

  const filteredRequests = selectedCategory
    ? REQUESTS.filter(r => r.category === selectedCategory)
    : REQUESTS;

  if (showNoteInput) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
          <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">{selectedRequest?.icon}</span>
              <span>{selectedRequest?.title}</span>
            </h2>
            <button
              onClick={() => {
                setShowNoteInput(false);
                setSelectedRequest(null);
                setNote("");
              }}
              disabled={isSending}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-gray-600 mb-4">
              Vui lòng mô tả chi tiết yêu cầu của bạn:
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Xin thêm 1 ly nước chanh..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none resize-none"
              rows={5}
              autoFocus
              disabled={isSending}
            />
          </div>

          <div className="border-t p-6 bg-linear-to-br from-amber-50 to-orange-50">
            <button
              onClick={handleSubmitWithNote}
              disabled={!note.trim() || isSending}
              className="w-full py-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi yêu cầu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-6 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Gọi phục vụ</span>
          </h2>
          <button
            onClick={onClose}
            disabled={isSending}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-linear-to-br from-amber-50 to-orange-50 p-4 border-b">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              disabled={isSending}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:shadow-md"
              }`}
            >
              Tất cả
            </button>
            {(Object.entries(CATEGORIES) as [CategoryKey, Category][]).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                disabled={isSending}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:shadow-md"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredRequests.map((request) => (
              <button
                key={request.code}
                onClick={() => handleRequestClick(request)}
                disabled={isSending}
                className="bg-linear-to-br from-white to-gray-50 hover:from-amber-50 hover:to-orange-50 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-3 group border-2 border-transparent hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {request.icon}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">
                    {request.title}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES[request.category].color} text-white`}>
                    {CATEGORIES[request.category].name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-linear-to-br from-amber-50 to-orange-50 sticky bottom-0">
          <p className="text-center text-sm text-gray-600">
            {isSending ? "Đang gửi yêu cầu..." : "Nhân viên sẽ đến hỗ trợ bạn ngay 🙏"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}