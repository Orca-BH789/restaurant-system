import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { Zap, ChevronRight } from "lucide-react";

interface Promotion {
  id: number;
  code: string;
  title: string;
  discountValue: number;
  discountType: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export default function PromotionalBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await axios.get<ApiResponse<Promotion[]>>(
        `${API_BASE_URL}/Promotions/active`
      );

      if (response.data.success && response.data.data) {
        setPromotions(response.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  useEffect(() => {
    if (promotions.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [promotions.length]);

  if (promotions.length === 0) {
    return null;
  }

  const current = promotions[currentIndex];

  return (
    <div
      className="relative overflow-hidden bg-linear-to-r from-orange-400 via-orange-500 to-red-600 py-4 px-6 md:py-6 md:px-12 my-6 rounded-2xl shadow-xl cursor-pointer transform hover:scale-105 transition-transform duration-300"
      onClick={() => navigate("/promotions")}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.1%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center justify-center">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm md:text-base uppercase">
              {current.title}
            </p>
            <p className="text-white/90 text-xs md:text-sm font-semibold">
              Mã: <span className="font-mono">{current.code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <div className="text-right">
            <p className="text-white font-extrabold text-lg md:text-2xl">
              {current.discountType === "Percentage"
                ? `${current.discountValue}%`
                : `${(current.discountValue / 1000).toFixed(0)}k`}
            </p>
            <p className="text-white/80 text-xs md:text-sm">giảm ngay</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white shrink-0" />
        </div>
      </div>

      {/* Dots Indicator */}
      {promotions.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 w-2 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
