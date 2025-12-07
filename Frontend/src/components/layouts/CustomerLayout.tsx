import { useState } from 'react';
  import { Search, Menu as MenuIcon, X , MapPin, Phone, MessageSquare, Clock} from "lucide-react";
  import { Outlet } from "react-router-dom";
  import ChatBot from "../../components/shared/CustomerChatBot";

  const COMPANY_NAME = "LẨU VIỆT THÁI";

  export default function CustomerLayout() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  ;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-red-600 text-white relative z-50 shadow-2xl">
        <div className="bg-red-700 py-2 text-center">
          <p className="font-bold uppercase text-sm tracking-wide">
            🔥 KHAI TRƯƠNG - GIẢM TỚI 40% TẤT CẢ MÓN LẨU 🔥
          </p>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <a
                href="/"
                className="text-3xl font-black tracking-wider uppercase hover:text-red-200"
              >
                {COMPANY_NAME}
              </a>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="/promotions" className="hover:text-red-200 uppercase font-bold">
                KHUYẾN MÃI
              </a>
              <a href="/menu" className="hover:text-red-200 uppercase font-bold">
                THỰC ĐƠN
              </a>
              <a href="/stores" className="hover:text-red-200 uppercase font-bold">
                CỬA HÀNG
              </a>
              <a href="/about" className="hover:text-red-200 uppercase font-bold">
                VỀ CHÚNG TÔI
              </a>
              <a
                href="/booking"
                className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-full border-2 border-orange-400 uppercase font-bold"
              >
                ĐẶT BÀN
              </a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
         

              <button className="bg-red-700 hover:bg-red-800 p-3 rounded-full">
                <Search size={20} />
              </button>          
          

              <button
                className="lg:hidden bg-red-700 hover:bg-red-800 p-3 rounded-full"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-red-700 border-t-4 border-red-500">
            <nav className="container mx-auto px-4 py-6 space-y-4">
              <a href="/promotions" className="block uppercase font-bold">
                KHUYẾN MÃI
              </a>
              <a href="/menu" className="block uppercase font-bold">
                THỰC ĐƠN
              </a>
              <a href="#stores" className="block uppercase font-bold">
                CỬA HÀNG
              </a>
              <a href="#about" className="block uppercase font-bold">
                VỀ CHÚNG TÔI
              </a>
              <a
                href="/booking"
                className="block bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-full text-center font-bold"
              >
                ĐẶT BÀN
              </a>
            </nav>
          </div>
        )}
      </header>
    
        {/* Main content */}
        <main className="flex-1 w-full">
          <Outlet />
         {/* <Routes>
            <Route path="/" element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="booking" element={<Booking />} />
            <Route path="/order" element={<CustomerOrder />} />
            <Route path="/kitchen" element={<KdsScreen />} />
            <Route path="payment" element={<Payment />} />
            <Route path="feedback" element={<Feedback />} />
          </Routes>*/}
        </main>

        {/* Footer */}
        <footer className="bg-[#001F3F] text-white pt-16 pb-8">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-12">
          {/* Logo & About */}
          <div>
            <h3 className="text-3xl font-extrabold mb-6 text-[#E30613] uppercase tracking-wide">
              {COMPANY_NAME}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Nhà hàng lẩu Việt Thái đầu tiên tại Việt Nam, mang đến trải nghiệm
              ẩm thực độc đáo và khó quên.
            </p>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xl font-bold mb-6 uppercase text-[#F6A600]">
              Thông tin
            </h4>
            <ul className="space-y-3">
              <li><a href="/about" className="hover:text-[#F6A600] transition">Về chúng tôi</a></li>
              <li><a href="/menu" className="hover:text-[#F6A600] transition">Thực đơn</a></li>
              <li><a href="/promotions" className="hover:text-[#F6A600] transition">Khuyến mãi</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xl font-bold mb-6 uppercase text-[#F6A600]">
              Dịch vụ
            </h4>
            <ul className="space-y-3">
              <li><a href="/booking" className="hover:text-[#F6A600] transition">Đặt bàn trực tuyến</a></li>              
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-bold mb-6 uppercase text-[#F6A600]">
              Liên hệ
            </h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-center space-x-3">
                <span className="bg-[#E30613] p-2 rounded-full"><MapPin size={18} /></span>
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-[#E30613] p-2 rounded-full"><Phone size={18} /></span>
                <span>(028) 3999 8888</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-[#E30613] p-2 rounded-full"><MessageSquare size={18} /></span>
                <span>INFO@VIETTHAI-HOTPOT.VN</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="bg-[#E30613] p-2 rounded-full"><Clock size={18} /></span>
                <span>10:00 - 23:00 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-700 pt-6 text-center">
          <p className="text-sm text-gray-400 tracking-wider">
            &copy; 2024 {COMPANY_NAME}. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
      
      {/* AI ChatBot */}
      <ChatBot/>
    </div>
    )
  }