import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SLIDE_INTERVAL = 3000;


const HiddenSecretMessage = () => {
  return (
    <div
      style={{
        opacity: 0,
        pointerEvents: "none",
        userSelect: "none",
      }}
      className="fixed bottom-0 left-0 text-[10px]"
    >
      Hello there! If you're reading this, you're probably exploring DevTools  
      If you’d like to share feedback, feel free to contact me:  
      peterparker7898@gmail.com  
      Best of luck and stay well!
    </div>
  );
};

export default function Home() {
  const [current, setCurrent] = useState(0);  
  const navigate = useNavigate();

  const slides = [
    {
      title: "LẨU TOM YUM THÁI",
      subtitle: "Hương vị chua cay đặc trưng Thái Lan",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1920",
    },
    {
      title: "LẨU BÒ TỨ XUYÊN",
      subtitle: "Ma là cay nồng, vị bò Úc thượng hạng",
      image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=1920",
    },
    {
      title: "LẨU HẢI SẢN ĐẶC BIỆT",
      subtitle: "Tôm càng, cua biển, cá tươi sống hảo hạng",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920",
    },
  ];

  const menuItems = [
    {
      id: 1,
      name: "LẨU TOM YUM THÁI",
      desc: "Chua cay đặc trưng với tôm tươi và gia vị Thái chính hiệu.",
      price: "299.000đ",
      img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
    },
    {
      id: 2,
      name: "LẨU BÒ TỨ XUYÊN",
      desc: "Ma là cay nồng Tứ Xuyên, thịt bò Úc thượng hạng.",
      price: "429.000đ",
      img: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600",
    },
    {
      id: 3,
      name: "LẨU HẢI SẢN ĐẶC BIỆT",
      desc: "Tôm càng, cua biển, cá tươi sống hảo hạng từ Phú Quốc.",
      price: "559.000đ",
      img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="bg-white">
      {/* --- Hero Banner --- */}
      <section className="relative h-[80vh] sm:h-[70vh] overflow-hidden rounded-b-3xl shadow-lg">
        <img
          src={slides[current].image}
          alt={slides[current].title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-red-900/80 via-red-600/60 to-orange-500/40" />
        <div className="relative z-10 h-full flex items-center px-6 md:px-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white uppercase leading-tight drop-shadow-lg">
              {slides[current].title}
            </h1>
            <p className="text-lg md:text-2xl text-orange-200 font-medium uppercase mt-2">
              {slides[current].subtitle}
            </p>
            <button  
              onClick={() => navigate("/booking")}
              className="mt-6 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-md transition"
            >
              ĐẶT NGAY
            </button>
          </div>
        </div>
      </section>

      {/* --- Featured Menu --- */}
      <section className="py-16 px-6 md:px-12 bg-linear-to-b from-red-50 to-white">
        <h2 className="text-3xl md:text-5xl font-extrabold text-center text-red-700 uppercase mb-12">
          Món ăn nổi bật
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1"
            >
              <img
                src={item.img}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-red-600">
                    {item.price}
                  </span>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition">
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>  
      <HiddenSecretMessage />
    </div>
  );
}
