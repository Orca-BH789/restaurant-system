import React from 'react';

// --- COMPONENTS NHỎ ---

// Icon Container
const FeatureIcon = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100 text-orange-600 shadow-lg shadow-orange-500/20 transform transition-transform group-hover:rotate-12 duration-300">
    {children}
  </div>
);

// SVG Icons
const FreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/></svg>;
const RecipeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const SpaceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/></svg>;

// --- DATA ---
const teamMembers = [
  { name: 'Phạm Tuấn Hưng', role: 'Bếp Trưởng (Head Chef)', imageUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&q=80&w=400', quote: "Nấu ăn là nghệ thuật, người đầu bếp là nghệ sĩ." },
  { name: 'Nguyễn Thu Hà', role: 'Quản lý nhà hàng', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=400&auto=format&fit=crop', quote: "Sự hài lòng của khách hàng là niềm vui của chúng tôi." }, 
  { name: 'Trần Minh Đức', role: 'Chuyên gia pha chế', imageUrl: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&q=80&w=400', quote: "Mỗi ly đồ uống là một câu chuyện riêng." },
];

const timelineEvents = [
  { year: '2015', title: 'Khởi đầu', description: 'Quán lẩu nhỏ đầu tiên được mở tại góc phố cổ với chỉ 5 bàn ăn và niềm đam mê ẩm thực cháy bỏng.' },
  { year: '2018', title: 'Mở rộng', description: 'Được thực khách yêu mến, chúng tôi mở rộng sang cơ sở thứ 2 với không gian rộng rãi và menu đa dạng hơn.' },
  { year: '2023', title: 'Nâng tầm', description: 'Tái định vị thương hiệu Res_M (Restaurant Master), nâng cấp không gian sang trọng và chuẩn hóa quy trình phục vụ.' },
  { year: 'Hôm nay', title: 'Điểm đến yêu thích', description: 'Trở thành điểm đến quen thuộc cho các bữa tiệc gia đình, gặp gỡ đối tác với hương vị Lẩu Việt Thái độc bản.' },
];

export default function About() {
  return (
    // Sử dụng duy nhất font-sans cho toàn bộ page
    <div className="font-sans text-stone-800 bg-stone-50 selection:bg-orange-600 selection:text-white overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1625937759420-26d7e003e04c?q=80&w=1470&auto=format&fit=crop" 
            alt="Hotpot background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-stone-900/60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          {/* Đã xóa font-serif, dùng font mặc định đậm */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up delay-100 shadow-black drop-shadow-lg">
            Đánh thức vị giác <br />
            <span className="text-orange-400">bằng cả trái tim</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-stone-200 mb-10 leading-relaxed animate-fade-in-up delay-200 font-light">
            Chào mừng đến với không gian ẩm thực ấm cúng, nơi hương vị lẩu chua cay hòa quyện cùng nguyên liệu tươi ngon thượng hạng.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in-up delay-300">
             <button className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full shadow-lg shadow-orange-900/40 transition-all hover:-translate-y-1 transform">
              Đặt Bàn Ngay
            </button>
            <button className="px-10 py-4 bg-transparent hover:bg-white/10 text-white border-2 border-white font-bold rounded-full shadow-sm transition-all hover:-translate-y-1 backdrop-blur-sm">
              Xem Thực Đơn
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURES Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest text-orange-600 uppercase mb-3">Cam kết của chúng tôi</h2>
            {/* Tiêu đề dùng font sans bình thường */}
            <h3 className="text-3xl md:text-4xl font-bold text-stone-900">Trải nghiệm ẩm thực hoàn hảo</h3>
            <div className="w-24 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="group text-center px-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="mx-auto flex justify-center">
                <FeatureIcon><FreshIcon /></FeatureIcon>
              </div>
              <h4 className="text-xl font-bold mb-3 text-stone-800">Nguyên liệu Tươi Sạch</h4>
              <p className="text-stone-600 leading-relaxed">
                Rau củ được nhập mới mỗi ngày từ nông trại Đà Lạt. Thịt bò, hải sản được tuyển chọn kỹ càng đảm bảo độ tươi ngon nhất.
              </p>
            </div>
            {/* Card 2 */}
            <div className="group text-center px-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="mx-auto flex justify-center">
                <FeatureIcon><RecipeIcon /></FeatureIcon>
              </div>
              <h4 className="text-xl font-bold mb-3 text-stone-800">Công thức Độc Quyền</h4>
              <p className="text-stone-600 leading-relaxed">
                Nước lẩu được hầm từ xương ống trong 12 giờ, kết hợp với các loại gia vị thảo mộc bí truyền tạo nên hương vị khó quên.
              </p>
            </div>
            {/* Card 3 */}
            <div className="group text-center px-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="mx-auto flex justify-center">
                <FeatureIcon><SpaceIcon /></FeatureIcon>
              </div>
              <h4 className="text-xl font-bold mb-3 text-stone-800">Không gian Ấm Cúng</h4>
              <p className="text-stone-600 leading-relaxed">
                Thiết kế hiện đại nhưng gần gũi, phù hợp cho những bữa tiệc gia đình, hẹn hò lãng mạn hay gặp gỡ đối tác.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STORY Section */}
      <section className="py-24 bg-stone-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
             <div className="w-full md:w-1/2">
                {/* Tiêu đề dùng font sans bình thường */}
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-stone-900">Hành trình 10 năm <br/>giữ lửa đam mê</h2>
                <p className="text-stone-600 mb-8 text-lg leading-relaxed">
                  Từ một quán ăn nhỏ vỉa hè, chúng tôi đã đi một chặng đường dài để mang đến trải nghiệm ẩm thực trọn vẹn nhất cho khách hàng. Mỗi món ăn là một câu chuyện, mỗi thực khách là một người bạn.
                </p>
                
                <div className="space-y-8 border-l-2 border-orange-200 pl-8 ml-2">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[41px] top-1 w-5 h-5 bg-orange-500 rounded-full border-4 border-stone-50"></div>
                      <span className="text-orange-600 font-bold text-sm block mb-1">{event.year}</span>
                      <h4 className="text-lg font-bold text-stone-800">{event.title}</h4>
                      <p className="text-stone-500 text-sm mt-1">{event.description}</p>
                    </div>
                  ))}
                </div>
             </div>
             <div className="w-full md:w-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 rounded-3xl rotate-6 transform translate-y-4 translate-x-4 opacity-20"></div>
                  <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1374&auto=format&fit=crop" alt="Our Restaurant Story" className="relative rounded-3xl shadow-2xl w-full object-cover h-[600px]" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 4. CHEF & TEAM Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          {/* Tiêu đề dùng font sans bình thường */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-stone-900">Đầu bếp & Cộng sự</h2>
          <p className="text-stone-500 max-w-2xl mx-auto mb-12">Những bàn tay tài hoa tạo nên hương vị đặc trưng của nhà hàng.</p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member) => (
              <div key={member.name} className="group relative">
                <div className="aspect-3/4 overflow-hidden rounded-2xl mb-4 bg-stone-200">
                  <img 
                    src={member.imageUrl} 
                    alt={member.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x533?text=Image+Not+Found';
                    }} 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm italic">"{member.quote}"</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-stone-900">{member.name}</h3>
                <p className="text-orange-600 font-medium text-sm uppercase tracking-wide mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION (Booking) */}
      <section className="py-24 relative overflow-hidden bg-stone-900">
        <div className="absolute inset-0 opacity-40">
           <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1470&auto=format&fit=crop" alt="Booking background" className="w-full h-full object-cover" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          {/* Tiêu đề dùng font sans bình thường */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Sẵn sàng thưởng thức?</h2>
          <p className="text-stone-300 max-w-2xl mx-auto mb-10 text-lg">
            Để đảm bảo được phục vụ tốt nhất, quý khách vui lòng đặt bàn trước khi đến. Chúng tôi luôn dành những vị trí đẹp nhất cho bạn.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl max-w-4xl mx-auto border border-white/20">
             <div className="grid md:grid-cols-3 gap-4 mb-6">
                <input type="text" placeholder="Họ và tên" className="w-full px-4 py-3 rounded-xl bg-white/80 border-0 focus:ring-2 focus:ring-orange-500 text-stone-800 placeholder-stone-500" />
                <input type="tel" placeholder="Số điện thoại" className="w-full px-4 py-3 rounded-xl bg-white/80 border-0 focus:ring-2 focus:ring-orange-500 text-stone-800 placeholder-stone-500" />
                <select className="w-full px-4 py-3 rounded-xl bg-white/80 border-0 focus:ring-2 focus:ring-orange-500 text-stone-800">
                  <option>2 Người</option>
                  <option>4 Người</option>
                  <option>6+ Người</option>
                  <option>Đặt tiệc lớn</option>
                </select>
             </div>
             <button className="w-full md:w-auto px-12 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-xl transition-all hover:scale-105 text-lg">
              Xác Nhận Đặt Bàn
            </button>
            <p className="text-stone-400 text-sm mt-4">Hoặc gọi hotline: <span className="text-orange-400 font-bold text-lg">1900 1234</span></p>
          </div>
        </div>
      </section>
    </div>
  );
}