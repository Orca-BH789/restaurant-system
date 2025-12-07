import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Minimize2, Maximize2, Loader2, Bot, User} from "lucide-react";
import axios from "axios";
import getApiBaseUrl from "../../utils/getApiBaseUrl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: MenuSuggestion[];
  bookingData?: BookingRecommendation;
  restaurantInfo?: RestaurantInfo;
}

interface MenuSuggestion {
  menuItemId: number;
  name: string;
  description: string;
  price: number;
  reason: string;
}

interface BookingRecommendation {
  numberOfGuests: number;
  requestedTime: string;
  availableTablesCount: number;
  availableTables: Array<{
    id: number;
    tableNumber: number;
    tableName: string;
    capacity: number;
    location: string;
  }>;
  activePromotionsCount: number;
  promotions: Array<{
    id: number;
    code: string;
    name: string;
    discountPercent?: number;
    discountAmount?: number;
  }>;
  recommendedMenuItems: MenuSuggestion[];
}

interface RestaurantInfo {
  totalTables: number;
  totalCapacity: number;
  totalMenuItems: number;
  businessHours: string;
  location: string;
  phone: string;
}

export default function CustomerChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = getApiBaseUrl();

  // Customer theme colors - Red
  const colors = {
    primary: "bg-red-600 hover:bg-red-700",
    primarylinear: "from-red-600 to-red-700",
    secondary: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    userBubble: "bg-red-600",
    assistantBubble: "bg-gray-100",
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "👋 Xin chào! Tôi là trợ lý AI của Lẩu Việt Thái.\n\nTôi có thể giúp bạn:\n🍲 Tư vấn món ăn phù hợp\n🌶️ Gợi ý theo khẩu vị\n💰 Tìm món trong ngân sách\n⭐ Giới thiệu món đặc biệt\n📅 Tư vấn đặt bàn\n🎁 Khuyến mãi hiện có\n\nHãy cho tôi biết bạn muốn gì nhé!",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      // Lấy thông tin nhà hàng
      loadRestaurantInfo();
    }
  }, [isOpen, messages.length]);

  const loadRestaurantInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE}/aichat/public/restaurant-info`);
      // Có thể lưu thông tin này nếu cần sử dụng sau
      console.log("Restaurant Info:", response.data);
    } catch (error) {
      console.error("Error loading restaurant info:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gọi API public consult endpoint
      const response = await axios.post(
        `${API_BASE}/aichat/public/consult`,
        {
          message: userMessage.content,
          sessionId: sessionId || undefined,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      // Lưu sessionId nếu chưa có
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Có lỗi trong việc nhận phản hồi từ AI",
        timestamp: new Date(),
        suggestions: Array.isArray(data.data) && data.data.length > 0 
          ? (data.data as Array<Record<string, unknown>>).map((item) => ({
              menuItemId: (item.menuItemId as number) || 0,
              name: (item.name as string) || "Không tên",
              description: (item.description as string) || "",
              price: parseFloat((item.price as string | number) as string) || 0,
              reason: (item.reason as string) || ""
            }))
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      let errorContent = "❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
      
      if (error instanceof Error) {
        console.error("Error sending message:", error.message);
        errorContent = `❌ Lỗi: ${error.message}`;
      } else if (axios.isAxiosError(error)) {
        console.error("API Error:", error.response?.data || error.message);
        errorContent = `❌ Lỗi ${error.response?.status}: ${(error.response?.data as Record<string, unknown>)?.message || 'Vui lòng thử lại sau'}`;
      } else {
        console.error("Unknown error:", error);
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setIsOpen(false);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 ${colors.primary} text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50`}
        aria-label="Open chat"
      >
        <MessageSquare size={28} />
        <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 shadow-2xl bg-white rounded-2xl border ${colors.border} transition-all ${
        isMinimized
          ? "bottom-6 right-6 w-80 h-16"
          : "bottom-6 right-6 w-[420px] h-[650px]"
      }`}
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Header */}
      <div className={`bg-linear-to-r ${colors.primarylinear} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot size={28} />
            <span className="absolute -bottom-1 -right-1 bg-green-400 w-3 h-3 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h3 className="font-bold text-lg">🍲 Trợ lý AI</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang trả lời...
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Sẵn sàng hỗ trợ
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-2 rounded-lg transition"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={clearChat}
            className="hover:bg-white/20 p-2 rounded-lg transition"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[calc(100%-140px)] overflow-y-auto p-4 space-y-4 bg-linear-to-b from-gray-50 to-white">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } gap-2`}
                >
                  {msg.role === "assistant" && (
                    <div className={`w-8 h-8 rounded-full ${colors.secondary} flex items-center justify-center shrink-0 mt-1`}>
                      <Bot size={18} className={colors.text} />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                      msg.role === "user"
                        ? `${colors.userBubble} text-white rounded-tr-none`
                        : `${colors.assistantBubble} text-gray-800 rounded-tl-none`
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === "user" ? "text-white/70" : "text-gray-500"}`}>
                      {msg.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className={`w-8 h-8 rounded-full ${colors.userBubble} flex items-center justify-center shrink-0 mt-1`}>
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Menu Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 ml-10 space-y-2">
                    <p className={`text-xs font-bold ${colors.text} px-2 flex items-center gap-1`}>
                      ✨ Gợi ý món ăn dành cho bạn:
                    </p>
                    {msg.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.menuItemId}
                        className={`${colors.secondary} border ${colors.border} rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-800 mb-1">
                              🍽️ {suggestion.name}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {suggestion.description}
                            </p>
                            <div className={`mt-2 p-2 bg-white rounded-lg border ${colors.border}`}>
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold">💡 Lý do gợi ý:</span>
                                <br />
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-base ${colors.text}`}>
                              {formatCurrency(suggestion.price)}
                            </p>
                            <button className={`mt-2 ${colors.primary} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                              Đặt món
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className={`w-8 h-8 rounded-full ${colors.secondary} flex items-center justify-center shrink-0`}>
                  <Bot size={18} className={colors.text} />
                </div>
                <div className={`${colors.assistantBubble} rounded-2xl rounded-tl-none p-3 flex items-center gap-2 shadow-sm`}>
                  <Loader2 size={16} className={`animate-spin ${colors.text}`} />
                  <p className="text-sm text-gray-600">Đang suy nghĩ...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-red-300 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={`${colors.primary} text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-md`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Nhấn Enter để gửi • Shift + Enter để xuống dòng
            </p>
          </div>
        </>
      )}
    </div>
  );
}