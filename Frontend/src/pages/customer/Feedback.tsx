import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const total = location.state?.total ?? 0;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = () => {
    if (rating === 0) return alert("Vui lòng chọn số sao đánh giá 🌟");

    setSubmitted(true);

    // Giả lập gửi dữ liệu phản hồi
    setTimeout(() => {
      alert("Cảm ơn bạn đã phản hồi 💬");
      navigate("/menu"); // quay về menu sau khi gửi
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md border">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-800 text-center">
          Cảm ơn bạn đã dùng bữa! 🍽️
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Tổng thanh toán của bạn:{" "}
          <span className="text-green-600 font-semibold">
            {total.toLocaleString()}đ
          </span>
        </p>

        <div className="text-center mb-6">
          <p className="text-gray-700 font-medium mb-3">
            Hãy đánh giá trải nghiệm của bạn ⭐
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl ${
                  rating >= star ? "text-yellow-400" : "text-gray-300"
                } transition-colors`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về món ăn hoặc dịch vụ..."
            rows={4}
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-700"
          />
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-colors ${
              submitted
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {submitted ? "Đang gửi..." : "Gửi phản hồi 💌"}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/menu")}
            className="text-sm text-gray-500 hover:text-amber-600 transition-colors underline"
          >
            Quay lại trang Menu
          </button>
        </div>
      </div>
    </div>
  );
}
