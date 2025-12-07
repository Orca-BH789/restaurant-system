import { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  isAvailable: boolean;
  unit: string;
}

export default function Menu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseURL = getApiBaseUrl();
        const [catRes, menuRes] = await Promise.all([
          axios.get<Category[]>(`${baseURL}/Categories`),
          axios.get<MenuItem[]>(`${baseURL}/MenuItems`),
        ]);

        setCategories(catRes.data);
        setMenuItems(menuRes.data);
      } catch (err) {
        console.error("❌ Lỗi khi tải menu:", err);
        setError("Không thể tải dữ liệu menu 😢");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">⏳ Đang tải thực đơn...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-red-50 py-16">
      <div className="container mx-auto px-4">
        {/* Tiêu đề */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-black text-red-600 uppercase">
            Toàn bộ thực đơn
          </h2>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white rounded-xl border-2 border-red-600 font-black hover:bg-red-600 hover:text-white transition"
          >
            Quay lại
          </button>
        </div>

        {/* Nhóm theo danh mục */}
        {categories.map((cat) => {
          const items = menuItems.filter((m) => m.categoryId === cat.id);
          if (items.length === 0) return null;

          return (
            <div key={cat.id} className="mb-12">
              <h3 className="text-2xl font-extrabold text-red-500 mb-6">
                {cat.name}
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-red-100 hover:scale-[1.02] transition"
                  >
                    <div className="relative">
                      <img
                        src={
                          "https://webdemocuahangtraicay.io.vn/core"+ item.imageUrl ||
                          "https://cdn4.iconfinder.com/data/icons/solid-part-6/128/ImageUrl_icon-1024.png"
                        }
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      {!item.isAvailable && (
                        <span className="absolute top-3 left-3 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-black">
                          HẾT HÀNG
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-black mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {item.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-red-600">
                          {item.price.toLocaleString()}đ
                        </span>
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
