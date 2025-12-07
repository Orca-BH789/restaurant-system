import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "success", message: "" });
    }, 3000);
  };

  // 🧠 Fetch settings từ backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const baseURL = getApiBaseUrl();
        const res = await axios.get(`${baseURL}/Settings`);
        const map: Record<string, string> = {};
        res.data.forEach((s: Setting) => (map[s.key] = s.value));
        setSettings(map);
      } catch (err) {
        console.error("❌ Lỗi khi tải Settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      await axios.put(`${getApiBaseUrl()}/Settings/${key}`, {
        key,
        value,
      });
      showNotification("success", "✅ Lưu thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      showNotification("error", "❌ Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-gray-500">Đang tải cấu hình...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* NOTIFICATION */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-xl ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-medium`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cài đặt</h1>
      </div>

      {/* SETTINGS CARD */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tên nhà hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên nhà hàng</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings["RestaurantName"] || ""}
                onChange={(e) => handleChange("RestaurantName", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => saveSetting("RestaurantName", settings["RestaurantName"] || "")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Email liên hệ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email liên hệ</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={settings["RestaurantEmail"] || ""}
                onChange={(e) => handleChange("RestaurantEmail", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => saveSetting("RestaurantEmail", settings["RestaurantEmail"] || "")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings["RestaurantPhone"] || ""}
                onChange={(e) => handleChange("RestaurantPhone", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => saveSetting("RestaurantPhone", settings["RestaurantPhone"] || "")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Thuế (%) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thuế (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={settings["TaxRate"] || ""}
                onChange={(e) => handleChange("TaxRate", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => saveSetting("TaxRate", settings["TaxRate"] || "")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tiền tệ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiền tệ</label>
            <div className="flex gap-2">
              <select
                value={settings["Currency"] || "VND"}
                onChange={(e) => handleChange("Currency", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <button
                onClick={() => saveSetting("Currency", settings["Currency"] || "VND")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cho phép khách đặt món */}
        <div className="mt-6 pt-6 border-t flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings["AllowGuestOrder"] === "true"}
            onChange={(e) =>
              handleChange("AllowGuestOrder", e.target.checked ? "true" : "false")
            }
            className="w-4 h-4 rounded border border-gray-300"
          />
          <label className="text-sm font-medium text-gray-700">Cho phép khách tự đặt món</label>
          <button
            onClick={() => saveSetting("AllowGuestOrder", settings["AllowGuestOrder"] || "false")}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
