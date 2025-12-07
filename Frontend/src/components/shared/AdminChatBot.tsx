import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Minimize2, Maximize2, Loader2, Bot, User } from "lucide-react";
import getApiBaseUrl from "../../utils/getApiBaseUrl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: MenuSuggestion[];
  analytics?: AnalyticsData;
  recommendations?: RecommendationData[];
  alerts?: AlertData[];
  actionButtons?: ActionButton[];
}

interface MenuSuggestion {
  menuItemId: number;
  name: string;
  description: string;
  price: number;
  reason: string;
}

interface AnalyticsData {
  queryType: string;
  summary: string;
  data: Record<string, unknown>;
  visualization?: "chart" | "table" | "stat";
}

interface RecommendationData {
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  icon: string;
}

interface AlertData {
  level: "warning" | "critical" | "info";
  message: string;
  timestamp: string;
  action?: string;
}

interface ActionButton {
  label: string;
  action: string;
  style: "primary" | "secondary" | "danger";
}

interface SendMessageResponse {
  sessionId: string;
  response: string;
  intentType: string;
  data?: MenuSuggestion[] | AnalyticsData | RecommendationData[] | AlertData[];
  timestamp: string;
}

export default function AdminChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = getApiBaseUrl();

  // Admin theme colors - Blue
  const colors = {
    primary: "bg-blue-600 hover:bg-blue-700",
    primarylinear: "from-blue-600 to-blue-700",
    secondary: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    userBubble: "bg-blue-600",
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
        content: "👋 Xin chào! Tôi giúp gì được cho bạn?\n\n📊 Thống kê doanh thu • 🍽️ Phân tích menu • ⚠️ Cảnh báo • 🎁 Khuyến mãi • 🤖 Dự báo xu hướng",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/aichat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as SendMessageResponse;

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      // Determine response type and parse accordingly
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      // Handle different intent types
      if (data.intentType === "analytics" && data.data) {
        responseMessage.analytics = data.data as AnalyticsData;
      } else if (data.intentType === "recommendations" && data.data) {
        responseMessage.recommendations = data.data as RecommendationData[];
      } else if (data.intentType === "alerts" && data.data) {
        responseMessage.alerts = data.data as AlertData[];
      } else if (data.intentType === "menu_suggestion" && Array.isArray(data.data)) {
        responseMessage.suggestions = data.data as MenuSuggestion[];
      } else if (data.intentType === "action" && data.data) {
        responseMessage.actionButtons = data.data as unknown as ActionButton[];
      }

      setMessages((prev) => [...prev, responseMessage]);
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
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
        className={`fixed bottom-6 right-6 ${colors.primary} text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 animate-bounce`}
        aria-label="Open admin chat"
      >
        <MessageSquare size={28} />
        <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white animate-pulse"></span>
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
            <Bot size={28} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 bg-green-400 w-3 h-3 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h3 className="font-bold text-lg">🤖 Assistant</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
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
                      ✨ Gợi ý món ăn:
                    </p>
                    {msg.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.menuItemId}
                        className={`${colors.secondary} border ${colors.border} rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1`}
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
                                <span className="font-semibold">💡 Lý do:</span>
                                <br />
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-base ${colors.text}`}>
                              {formatCurrency(suggestion.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Analytics Display */}
                {msg.analytics && (
                  <div className="mt-3 ml-10">
                    <div className={`${colors.secondary} border ${colors.border} rounded-xl p-4`}>
                      <h4 className={`font-bold text-sm ${colors.text} mb-2 flex items-center gap-2`}>
                        📊 Thống kê
                      </h4>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-gray-700 font-medium mb-2">
                          {msg.analytics.summary}
                        </p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(msg.analytics.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations Display */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 ml-10 space-y-2">
                    <p className={`text-xs font-bold ${colors.text} px-2 flex items-center gap-1`}>
                      💡 Khuyến cáo:
                    </p>
                    {msg.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          rec.priority === "high"
                            ? "bg-red-50 border-red-200"
                            : rec.priority === "medium"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <h5 className="font-semibold text-sm text-gray-800 mb-1">
                          {rec.icon} {rec.title}
                        </h5>
                        <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                        <button className={`text-xs font-semibold px-2 py-1 rounded ${
                          rec.priority === "high"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : rec.priority === "medium"
                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}>
                          {rec.action}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alerts Display */}
                {msg.alerts && msg.alerts.length > 0 && (
                  <div className="mt-3 ml-10 space-y-2">
                    <p className={`text-xs font-bold text-red-600 px-2 flex items-center gap-1`}>
                      ⚠️ Cảnh báo:
                    </p>
                    {msg.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          alert.level === "critical"
                            ? "bg-red-100 border-red-400"
                            : alert.level === "warning"
                            ? "bg-yellow-100 border-yellow-400"
                            : "bg-blue-100 border-blue-400"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          alert.level === "critical"
                            ? "text-red-800"
                            : alert.level === "warning"
                            ? "text-yellow-800"
                            : "text-blue-800"
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{alert.timestamp}</p>
                        {alert.action && (
                          <button className="text-xs font-semibold mt-2 px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900">
                            {alert.action}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons Display */}
                {msg.actionButtons && msg.actionButtons.length > 0 && (
                  <div className="mt-3 ml-10 flex flex-wrap gap-2">
                    {msg.actionButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          btn.style === "primary"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : btn.style === "danger"
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                      >
                        {btn.label}
                      </button>
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
                  <p className="text-sm text-gray-600">Đang phân tích dữ liệu...</p>
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
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-400 text-sm"
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