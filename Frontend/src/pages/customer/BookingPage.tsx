import { useState, useEffect } from "react";
import { MapPin, Phone, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { APIService } from "../../services/APIService"; 
import axiosInstance from "../../utils/axiosConfig"; 
import { AxiosError } from 'axios';
const apiService = new APIService(axiosInstance);
import type { CreateReservationDTO, TableSuggestionDTO } from "../../services/APIService";

const nameRegex = /^[A-Za-zÀ-ỹ\s]{2,50}$/;
const phoneRegex = /^(0|\+84)[0-9]{9}$/;
const sanitize = (str: string) => str.replace(/[<>${}()=;]/g, "");

const formatDateTimeForBackend = (date: string, time: string): string => {
  return `${date}T${time}:00`;
};

const validateReservationTime = (reservationTime: string): boolean => {
  const now = new Date();
  const selectedTime = new Date(reservationTime);

  const minTime = new Date(now.getTime() + 30 * 60 * 1000);
  if (selectedTime < minTime) {
    return false;
  }

  const hour = selectedTime.getHours();
  if (hour < 10 || hour > 22) {
    return false;
  }

  return true;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {  
    const backendError = error.response?.data;
    
    // Backend error structure: { success: false, error: { code, message, details } }
    if (backendError?.error?.message) {
      return backendError.error.message;
    }
    
    return backendError?.message 
      || backendError?.title
      || error.message 
      || "Có lỗi xảy ra. Vui lòng thử lại!";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Có lỗi xảy ra. Vui lòng thử lại!";
};

const BookingPage = () => { 
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    guests: "2",
    area: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTableSuggestions, setShowTableSuggestions] = useState(false);
  const [reservationNumber, setReservationNumber] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestedTables, setSuggestedTables] = useState<TableSuggestionDTO[]>([]);
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);

  useEffect(() => {
    loadCapacity();
  }, []);

  const loadCapacity = async () => {
    try {
      const cap = await apiService.getCurrentCapacity();
      setCapacity(cap);
    } catch (error) {
      console.error("Không thể tải capacity:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: sanitize(String(value)) });
    setErrorMessage("");
  };

  const handleLoadSuggestions = async () => {
    if (!form.date || !form.time) {
      setErrorMessage("Vui lòng chọn ngày và giờ trước");
      return;
    }

    const reservationDateTime = formatDateTimeForBackend(form.date, form.time);

    if (!validateReservationTime(reservationDateTime)) {
      setErrorMessage("Thời gian đặt bàn không hợp lệ. Phải đặt trước ít nhất 30 phút trong khung giờ 10:00 - 22:00");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    
    try {
      const tables = await apiService.getSuggestedTables(
        Number(form.guests),
        reservationDateTime,
        form.area || undefined
      );
      
      if (tables.length === 0) {
        setErrorMessage("Không có bàn phù hợp. Vui lòng chọn thời gian khác.");
        setShowTableSuggestions(false);
      } else {
        setSuggestedTables(tables);
        setShowTableSuggestions(true);
      }
    } catch (error) {
      console.error("Error loading table suggestions:", error);
      setErrorMessage(getErrorMessage(error));
      setShowTableSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (tableId: number) => {
    if (selectedTableIds.includes(tableId)) {
      setSelectedTableIds(selectedTableIds.filter((id) => id !== tableId));
    } else {
      setSelectedTableIds([...selectedTableIds, tableId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    // ========== VALIDATIONS ==========
    if (!nameRegex.test(form.name)) {
      setErrorMessage("Tên không hợp lệ! (2-50 ký tự, chỉ chữ cái)");
      return;
    }

    if (!phoneRegex.test(form.phone)) {
      setErrorMessage("Số điện thoại không hợp lệ! (VD: 0901234567)");
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrorMessage("Email không hợp lệ!");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(form.date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setErrorMessage("Ngày đặt không hợp lệ!");
      return;
    }

    if (!form.time) {
      setErrorMessage("Vui lòng chọn giờ");
      return;
    }

    const hour = Number(form.time.split(":")[0]);
    if (hour < 10 || hour > 22) {
      setErrorMessage("Chỉ nhận đặt từ 10:00 - 22:00");
      return;
    }

    const reservationDateTime = formatDateTimeForBackend(form.date, form.time);
    if (!validateReservationTime(reservationDateTime)) {
      setErrorMessage("Phải đặt trước ít nhất 30 phút!");
      return;
    }
    
    const guestCount = parseInt(form.guests, 10);
    
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
      setErrorMessage("Số khách phải từ 1 đến 20");
      return;
    }

    setLoading(true);
    
    try {
      const dto: CreateReservationDTO = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || undefined,
        numberOfGuests: guestCount,
        reservationTime: reservationDateTime,
        preferredArea: form.area || undefined,
        notes: form.notes.trim() || undefined,
      };

      console.log("Sending reservation DTO:", dto);

      const response = await apiService.createReservation(dto);

      console.log("Backend response:", response);

      // ===== XỬ LÝ RESPONSE KHỚP VỚI BACKEND =====
      // Backend trả về: { success: boolean, data?: ReservationDetailDTO, message?: string }
      
      if (response.success && response.data) {
        // SUCCESS - Lấy reservationNumber từ response.data
        const resNumber = response.data.reservationNumber || "";
        
        setReservationNumber(resNumber);
        setShowSuccess(true);
        setShowTableSuggestions(false);
        
        // Reset form
        setForm({
          name: "",
          phone: "",
          email: "",
          date: "",
          time: "",
          guests: "2",
          area: "",
          notes: "",
        });
        setSelectedTableIds([]);
        setSuggestedTables([]);
        
        loadCapacity();
      } 
      else if (!response.success) {
        // ERROR - Hiển thị message
        const errorMsg = response.message || "Không thể tạo đặt bàn";
        setErrorMessage(errorMsg);
      }
      else {
        // Fallback
        setErrorMessage("Không thể tạo đặt bàn. Vui lòng thử lại!");
      }
      
    } catch (error) {
      console.error("Exception caught:", error);
      
      const errorMsg = getErrorMessage(error);
      setErrorMessage(errorMsg);
      
      // Gợi ý cho lỗi capacity
      if (errorMsg.toLowerCase().includes("capacity") || 
          errorMsg.toLowerCase().includes("đầy") ||
          errorMsg.toLowerCase().includes("vượt quá")) {
        setErrorMessage(`${errorMsg}\n\nGợi ý: Thử chọn thời gian khác hoặc ít khách hơn.`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    setReservationNumber("");
  };

  return (
    <div className="min-h-screen bg-red-50">    
      <div className="relative h-72 flex items-center justify-center text-white">
        <img
          src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1920"
          alt="Hotpot"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-extrabold uppercase tracking-wider mb-4">
            Đặt bàn Online
          </h1>
          <p className="text-xl">
            Công suất hiện tại: <span className="font-bold">{capacity.toFixed(0)}%</span>
            {capacity >= 50 && (
              <span className="ml-2 px-3 py-1 bg-yellow-500 text-black rounded-full text-sm font-bold">
                ⚠️ Sắp đầy
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">      
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-6 uppercase">
            Thông tin đặt bàn
          </h2>

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-start">
              <AlertCircle className="mr-2 mt-0.5 shrink-0" size={20} />
              <span className="whitespace-pre-line">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Họ và tên *"
                maxLength={50}
                required
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Số điện thoại *"
                maxLength={11}
                required
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
            </div>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              disabled={loading}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              />
            </div>
        
            <div className="grid sm:grid-cols-2 gap-4">
              <select
                name="guests"
                value={form.guests}
                onChange={handleChange}
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              >
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1} khách
                  </option>
                ))}
              </select>

              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                disabled={loading}
                className="p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              >
                <option value="">Tất cả khu vực</option>
                <option value="Phòng chung">Phòng chung</option>
                <option value="Bàn VIP">Bàn VIP</option>
                <option value="Khu ngoài trời">Khu ngoài trời</option>
                <option value="Phòng riêng">Phòng riêng</option>
              </select>
            </div>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Yêu cầu đặc biệt..."
              disabled={loading}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              rows={4}
              maxLength={1000}
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleLoadSuggestions}
                disabled={loading || !form.date || !form.time}
                className="py-3 rounded-xl font-bold text-lg border-2 border-red-600 text-red-600 hover:bg-red-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 transition"
              >
                Gợi ý bàn
              </button>

              <button
                type="submit"
                disabled={loading}
                className="py-4 rounded-xl font-black text-lg shadow-xl transition bg-linear-to-r from-red-600 to-orange-500 text-white hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </form>

          {/* TABLE SUGGESTIONS */}
          {showTableSuggestions && suggestedTables.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h3 className="font-bold text-lg mb-3 text-blue-800">
                Gợi ý bàn phù hợp
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {suggestedTables.map((table) => (
                  <div
                    key={table.tableId}
                    onClick={() => toggleTableSelection(table.tableId)}
                    className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                      selectedTableIds.includes(table.tableId)
                        ? "bg-green-100 border-green-500"
                        : "bg-white border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold">{table.tableName}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({table.capacity} chỗ - {table.location})
                        </span>
                      </div>
                      {selectedTableIds.includes(table.tableId) && (
                        <CheckCircle className="text-green-600" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-6 uppercase">
              Liên hệ nhanh
            </h2>
            <ul className="space-y-6 text-gray-700 font-semibold">
              <li className="flex items-center space-x-3">
                <span className="bg-red-600 text-white p-3 rounded-full">
                  <MapPin size={20} />
                </span>
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>

              <li className="flex items-center space-x-3">
                <span className="bg-red-600 text-white p-3 rounded-full">
                  <Phone size={20} />
                </span>
                <span>(028) 3999 8888</span>
              </li>

              <li className="flex items-center space-x-3">
                <span className="bg-red-600 text-white p-3 rounded-full">
                  <MessageSquare size={20} />
                </span>
                <span>INFO@VIETTHAI-HOTPOT.VN</span>
              </li>

              <li className="flex items-center space-x-3">
                <span className="bg-red-600 text-white p-3 rounded-full">
                  <Clock size={20} />
                </span>
                <span>10:00 - 22:00 hàng ngày</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-red-100">
            <iframe
              title="Google Map"
              src="https://www.google.com/maps?q=10.7768893,106.7004238&hl=vi&z=17&output=embed"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Đặt bàn thành công!
              </h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Mã đặt bàn của bạn:</p>
                <p className="text-3xl font-black text-green-700">{reservationNumber}</p>
              </div>
              <p className="text-gray-700 mb-6">
                Vui lòng lưu lại mã này để tra cứu đặt bàn. Chúng tôi sẽ gửi email xác nhận trong ít phút.
              </p>
              <button
                onClick={closeSuccessModal}
                className="w-full py-3 bg-linear-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:scale-105 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;