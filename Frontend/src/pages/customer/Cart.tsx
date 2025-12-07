import { useLocation, useNavigate } from "react-router-dom";

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
}

interface LocationState {
  cart?: { id: number; qty: number }[];
}

export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Lấy state từ router location
  const state = location.state as LocationState | null;

  // ✅ Map dữ liệu về CartItem đầy đủ
  const cart: CartItem[] = state?.cart
    ? state.cart.map((item) => ({
        id: item.id,
        name:
          item.id === 1
            ? "Lẩu Tom Yum Thái"
            : item.id === 2
            ? "Lẩu Bò Tứ Xuyên"
            : "Lẩu Hải Sản Đặc Biệt",
        price:
          item.id === 1 ? 299000 : item.id === 2 ? 429000 : 559000,
        image:
          item.id === 1
            ? "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500"
            : item.id === 2
            ? "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=500"
            : "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500",
        qty: item.qty,
      }))
    : [];

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const goToPayment = () => {
    if (cart.length > 0) {
      navigate("/payment", { state: { cart, total } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 text-center">
          Giỏ hàng của bạn 🛒
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống 😢</p>
            <button
              onClick={() => navigate("/order")}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold"
            >
              Quay lại đặt món
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white rounded-2xl shadow p-4 border"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover mr-4"
                  />
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg text-gray-800">
                      {item.name}
                    </h2>
                    <p className="text-gray-500">
                      Số lượng:{" "}
                      <span className="font-semibold text-amber-600">
                        {item.qty}
                      </span>
                    </p>
                    <p className="text-amber-600 font-semibold mt-1">
                      {(item.price * item.qty).toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white p-6 rounded-2xl shadow-md border text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Tổng thanh toán
              </h2>
              <p className="text-3xl font-bold text-green-600 mb-6">
                {total.toLocaleString()}đ
              </p>

              <button
                onClick={goToPayment}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
              >
                Tiến hành thanh toán 💳
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
