# 💰 Tích Hợp Khuyến Mãi - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Đã tích hợp tính năng **Quản Lý Khuyến Mãi** vào **RightPanel POS** với các chức năng:
- ✅ Tìm kiếm nhanh mã khuyến mãi
- ✅ Gợi ý tự động dựa trên tên & mã
- ✅ Hiển thị chi tiết giảm giá
- ✅ Áp dụng mã trực tiếp trong quá trình thanh toán
- ✅ Tính toán giảm giá tự động (% hoặc số tiền cố định)

---

## 🎯 Các File Được Chỉnh Sửa

### 1. `src/pages/admin/Invoices.tsx`
**Thay Đổi:** Điều chỉnh API response format để khớp với controller

**Chi tiết:**
```typescript
// Trước (sai cách)
const res = await axios.get(`${baseURL}/invoices`);
if (Array.isArray(res.data)) { ... }

// Sau (đúng cách - khớp với API Response wrapper)
const res = await axios.get<ApiResponse<Invoice[]>>(`${baseURL}/api/invoices`);
if (res.data.success) {
  setInvoices(res.data.data);
}
```

**Cải Thiện:**
- ✅ Type-safe API response handling
- ✅ Proper error messages từ API
- ✅ Endpoint path consistent với controller routing (`/api/invoices`)

---

### 2. `src/pages/pos/RightPanel.tsx`
**Thay Đổi:** Thêm component khuyến mãi vào panel thanh toán

#### 🔧 State Management
```typescript
const [promotions, setPromotions] = useState<Promotion[]>([]);
const [searchPromo, setSearchPromo] = useState('');
const [filteredPromos, setFilteredPromos] = useState<Promotion[]>([]);
const [showPromoSuggestions, setShowPromoSuggestions] = useState(false);
const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
```

#### 📡 Data Fetching
```typescript
useEffect(() => {
  const fetchActivePromotions = async () => {
    const baseURL = getApiBaseUrl();
    const response = await axios.get<ApiResponse<Promotion[]>>(
      `${baseURL}/api/promotions/active`
    );
    if (response.data.success) {
      setPromotions(response.data.data);
    }
  };
  fetchActivePromotions();
}, []);
```

#### 🔍 Search & Filter Logic
```typescript
useEffect(() => {
  if (!searchPromo.trim()) {
    setFilteredPromos(promotions.slice(0, 5)); // Top 5 suggestions
    return;
  }

  const query = searchPromo.toLowerCase();
  const filtered = promotions.filter(p =>
    p.code.toLowerCase().includes(query) ||
    p.name.toLowerCase().includes(query)
  ).slice(0, 8); // Max 8 results
  setFilteredPromos(filtered);
}, [searchPromo, promotions]);
```

#### 🎨 UI Components

**1. Promotion Search Input**
- 🔍 Icon tìm kiếm trực quan
- ✕ Button xóa tìm kiếm
- Placeholder: "Tìm mã hoặc tên khuyến mãi..."

**2. Suggestions Dropdown**
- Hiển thị khi người dùng gõ
- Tối đa 8 gợi ý
- Hiển thị: Mã + Tên + Giá trị giảm
- Click để chọn

**3. Applied Promotion Badge**
- Xanh lá cây (success color)
- Hiển thị mã & chi tiết giảm giá
- Button ✕ để hủy

**4. Discount Calculation in Summary**
```typescript
{appliedPromo && (
  <div className="flex justify-between text-blue-600 font-semibold">
    <span>💰 Khuyến mãi ({appliedPromo.code}):</span>
    <span>-{appliedPromo.discountPercent 
      ? Math.round(subTotal * (appliedPromo.discountPercent / 100))
      : appliedPromo.discountAmount
    }đ</span>
  </div>
)}
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────┐
│  RightPanel Component Mount        │
└──────────┬──────────────────────────┘
           │
           ├─► Fetch /api/promotions/active
           │   ✅ Response: ApiResponse<Promotion[]>
           │   └─► setPromotions()
           │
           └─► Display Payment Section
               
┌─────────────────────────────────────┐
│  User Types in Search Field        │
└──────────┬──────────────────────────┘
           │
           ├─► setSearchPromo(value)
           │
           ├─► Filter:
           │   - By code (case-insensitive)
           │   - By name (case-insensitive)
           │   - Max 8 results
           │
           └─► setFilteredPromos()
               └─► Show dropdown

┌─────────────────────────────────────┐
│  User Clicks Promotion             │
└──────────┬──────────────────────────┘
           │
           ├─► setAppliedPromo(promo)
           ├─► setSearchPromo('')
           └─► setShowPromoSuggestions(false)
               └─► Show success badge
                   └─► Calculate discount
```

---

## 🔌 API Integration

### Endpoint: GET `/api/promotions/active`

**Purpose:** Lấy danh sách khuyến mãi đang hoạt động

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Giảm giá cuối tuần",
      "code": "WEEKEND20",
      "discountPercent": 20,
      "discountAmount": null,
      "isValid": true,
      "isExpired": false
    },
    {
      "id": 2,
      "name": "Giảm số tiền cố định",
      "code": "FIXED50K",
      "discountPercent": null,
      "discountAmount": 50000,
      "isValid": true,
      "isExpired": false
    }
  ],
  "message": "Có 2 mã khuyến mãi đang hoạt động"
}
```

---

## 💻 Component Types

### Promotion Interface
```typescript
interface Promotion {
  id: number;
  name: string;
  code: string;
  discountPercent: number | null;      // Giảm theo % hoặc null
  discountAmount: number | null;       // Giảm số tiền hoặc null
  isValid: boolean;                    // Còn giá trị và trong hạn
  isExpired: boolean;                  // Đã hết hạn
}
```

### ApiResponse Interface
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}
```

---

## 🎯 Features & Benefits

| Feature | Benefit | UX Flow |
|---------|---------|---------|
| **Instant Search** | Tìm mã nhanh chóng | Type → Filter → Click |
| **Auto Suggestions** | Không cần nhớ mã | Gợi ý top 5 khi mở |
| **Real-time Calc** | Thấy giảm giá ngay | Applied → Badge → Summary |
| **One-Click Apply** | Áp dụng nhanh trong thanh toán | Click → Hủy ✕ |
| **Clear Feedback** | Biết đã áp dụng khuyến mãi | Green badge + discount line |

---

## 🧪 Testing Guide

### Test Case 1: Tìm kiếm Khuyến Mãi
1. Mở POS, chọn bàn có order
2. Scroll xuống phần thanh toán
3. Nhập "WEEK" → Gợi ý "WEEKEND20"
4. Nhập "50" → Gợi ý "FIXED50K"
5. Clear search → Hiện top 5

### Test Case 2: Áp dụng Mã
1. Tìm kiếm khuyến mãi
2. Click trên 1 suggestion
3. ✓ Search input clear
4. ✓ Green badge hiện
5. ✓ Discount line trong summary
6. ✓ Total amount updated

### Test Case 3: Hủy Áp Dụng
1. Áp dụng khuyến mãi
2. Click ✕ trên badge
3. ✓ Badge mất
4. ✓ Discount line mất
5. ✓ Total amount reset

### Test Case 4: Gợi ý Mặc Định
1. Mở POS payment section
2. ✓ Show top 5 active promotions
3. ✓ Có thể click trực tiếp

---

## 🚀 Cải Tiến Tương Lai

Có thể mở rộng feature:

1. **Promotion Usage History**
   - Lưu history khuyến mãi đã áp dụng
   - Hiển thị trong order details

2. **Promotion Validation**
   - Kiểm tra min order amount
   - Kiểm tra usage limit
   - Show error message nếu không hợp lệ

3. **Multiple Promotions**
   - Cho phép áp dụng nhiều mã
   - Auto calculate tổng giảm giá

4. **Discount Preview**
   - Hover để xem detail promotion
   - Show discount amount cụ thể

5. **Integration with Backend**
   - Gửi promo code lên API khi thanh toán
   - Backend validate & apply discount
   - Lưu promotion usage record

---

## 📝 Notes

- **API Endpoint:** `/api/promotions/active` được call khi component mount
- **Caching:** Promotions data được cache trong state, không re-fetch mỗi lần search
- **Search Performance:** Giới hạn 8 results để tránh dropdown quá dài
- **Discount Calculation:** Tính toán client-side để UX feedback nhanh (không phụ thuộc server)

---

## ✅ Checklist Hoàn Thành

- [x] Fetch active promotions từ API
- [x] Implement search/filter logic
- [x] Render suggestions dropdown
- [x] Display applied promotion badge
- [x] Calculate discount amount
- [x] Show discount in payment summary
- [x] Type-safe interfaces
- [x] Zero TypeScript errors
- [x] No lint warnings
- [x] Responsive UI
- [x] Clear UX feedback
