import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Copy
} from 'lucide-react';
import { useAuth } from '../../hook/useAuth';

// ==================== TYPES ====================

interface Promotion {
  id: number;
  name: string;
  code: string;
  description: string;
  discountPercent: number | null;
  discountAmount: number | null;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  minOrderAmount: number;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  isExpired: boolean;
  isValid: boolean;
  remainingUsage: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PromotionFormData {
  name: string;
  code: string;
  description: string;
  discountType: 'percent' | 'amount';
  discountPercent: number | null;
  discountAmount: number | null;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  minOrderAmount: number;
  usageLimit: number | null;
  active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

type SortField = 'name' | 'code' | 'startDate' | 'endDate' | 'usageCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface Notification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ==================== MAIN COMPONENT ====================

const PromotionDashboard: React.FC = () => {
  const { api } = useAuth();

  // State Management
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percent' | 'amount'>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  
  // Form
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    code: '',
    description: '',
    discountType: 'percent',
    discountPercent: null,
    discountAmount: null,
    maxDiscountAmount: null,
    startDate: '',
    endDate: '',
    minOrderAmount: 0,
    usageLimit: null,
    active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ==================== API CALLS ====================

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Promotion[]>>('/promotions');
      if (response.data.success) {
        setPromotions(response.data.data);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi tải danh sách khuyến mãi';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createPromotion = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountPercent: formData.discountType === 'percent' ? formData.discountPercent : null,
        discountAmount: formData.discountType === 'amount' ? formData.discountAmount : null,
        maxDiscountAmount: formData.maxDiscountAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minOrderAmount: formData.minOrderAmount,
        usageLimit: formData.usageLimit,
        active: formData.active
      };

      const response = await api.post<ApiResponse<Promotion>>('/promotions', payload);
      if (response.data.success) {
        showNotification('success', 'Tạo mã khuyến mãi thành công');
        setShowAddModal(false);
        resetForm();
        fetchPromotions();
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi tạo khuyến mãi';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updatePromotion = async () => {
    if (!selectedPromotion || !validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        discountPercent: formData.discountType === 'percent' ? formData.discountPercent : null,
        discountAmount: formData.discountType === 'amount' ? formData.discountAmount : null,
        maxDiscountAmount: formData.maxDiscountAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minOrderAmount: formData.minOrderAmount,
        usageLimit: formData.usageLimit,
        active: formData.active
      };

      const response = await api.put<ApiResponse<Promotion>>(
        `/promotions/${selectedPromotion.id}`,
        payload
      );
      
      if (response.data.success) {
        showNotification('success', 'Cập nhật khuyến mãi thành công');
        setShowEditModal(false);
        resetForm();
        fetchPromotions();
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi cập nhật khuyến mãi';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deletePromotion = async () => {
    if (!selectedPromotion) return;

    setLoading(true);
    try {
      const response = await api.delete<ApiResponse<boolean>>(
        `/promotions/${selectedPromotion.id}`
      );
      
      if (response.data.success) {
        showNotification('success', 'Xóa khuyến mãi thành công');
        setShowDeleteConfirm(false);
        setSelectedPromotion(null);
        fetchPromotions();
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi xóa khuyến mãi';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Tên khuyến mãi là bắt buộc';
    if (!formData.code.trim()) errors.code = 'Mã khuyến mãi là bắt buộc';
    if (!/^[A-Z0-9]+$/.test(formData.code.toUpperCase())) {
      errors.code = 'Mã chỉ chứa chữ HOA và số';
    }
    
    if (formData.discountType === 'percent') {
      if (!formData.discountPercent || formData.discountPercent <= 0 || formData.discountPercent > 100) {
        errors.discountPercent = 'Phần trăm giảm từ 0-100';
      }
    } else {
      if (!formData.discountAmount || formData.discountAmount <= 0) {
        errors.discountAmount = 'Số tiền giảm phải > 0';
      }
    }

    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) errors.endDate = 'Ngày kết thúc là bắt buộc';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      discountType: 'percent',
      discountPercent: null,
      discountAmount: null,
      maxDiscountAmount: null,
      startDate: '',
      endDate: '',
      minOrderAmount: 0,
      usageLimit: null,
      active: true
    });
    setFormErrors({});
    setSelectedPromotion(null);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Mã', 'Tên', 'Loại giảm', 'Giá trị', 'Bắt đầu', 'Kết thúc', 'Đã dùng', 'Trạng thái'].join(','),
      ...filteredPromotions.map(p => [
        p.code,
        p.name,
        p.discountPercent ? 'Phần trăm' : 'Số tiền',
        p.discountPercent ? `${p.discountPercent}%` : `${p.discountAmount?.toLocaleString()}đ`,
        new Date(p.startDate).toLocaleDateString('vi-VN'),
        new Date(p.endDate).toLocaleDateString('vi-VN'),
        `${p.usageCount}${p.usageLimit ? `/${p.usageLimit}` : ''}`,
        p.isValid ? 'Hoạt động' : 'Không hoạt động'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `promotions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showNotification('success', `Đã copy mã: ${code}`);
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    let filtered = [...promotions];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.active && !p.isExpired);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(p => !p.active);
    } else if (statusFilter === 'expired') {
      filtered = filtered.filter(p => p.isExpired);
    }

    // Type filter
    if (typeFilter === 'percent') {
      filtered = filtered.filter(p => p.discountPercent !== null);
    } else if (typeFilter === 'amount') {
      filtered = filtered.filter(p => p.discountAmount !== null);
    }

    // Validity filter
    if (validityFilter === 'valid') {
      filtered = filtered.filter(p => p.isValid);
    } else if (validityFilter === 'invalid') {
      filtered = filtered.filter(p => !p.isValid);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number | boolean | null = a[sortField as keyof Promotion];
      let bVal: string | number | boolean | null = b[sortField as keyof Promotion];

      if (sortField === 'startDate' || sortField === 'endDate' || sortField === 'createdAt') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }

      if (aVal != null && bVal != null) {
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredPromotions(filtered);
    setCurrentPage(1);
  }, [promotions, searchTerm, statusFilter, typeFilter, validityFilter, sortField, sortOrder]);

  // ==================== PAGINATION ====================

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPromotions = filteredPromotions.slice(startIndex, endIndex);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Khuyến Mãi</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchPromotions}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER PANEL */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'expired')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="expired">Đã hết hạn</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'percent' | 'amount')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả loại</option>
            <option value="percent">Giảm phần trăm</option>
            <option value="amount">Giảm số tiền</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setValidityFilter('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Hiển thị {currentPromotions.length} / {filteredPromotions.length} khuyến mãi
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-2">
                    Mã
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Tên khuyến mãi
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-semibold">Loại giảm giá</th>
                <th 
                  className="px-4 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center gap-2">
                    Thời gian
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('usageCount')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Đã sử dụng
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-gray-700 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center text-gray-700 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : currentPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy khuyến mãi nào
                  </td>
                </tr>
              ) : (
                currentPromotions.map((promotion) => (
                  <tr
                    key={promotion.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm">
                          {promotion.code}
                        </code>
                        <button
                          onClick={() => copyCode(promotion.code)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Copy mã"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{promotion.name}</div>
                        {promotion.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {promotion.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {promotion.discountPercent !== null ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Percent className="w-4 h-4" />
                          <span className="font-semibold">{promotion.discountPercent}%</span>
                          {promotion.maxDiscountAmount && (
                            <span className="text-xs text-gray-500">
                              (max {promotion.maxDiscountAmount.toLocaleString()}đ)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">
                            {promotion.discountAmount?.toLocaleString()}đ
                          </span>
                        </div>
                      )}
                      {promotion.minOrderAmount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Đơn tối thiểu: {promotion.minOrderAmount.toLocaleString()}đ
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          {new Date(promotion.startDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          →
                          {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold">{promotion.usageCount}</span>
                        {promotion.usageLimit && (
                          <span className="text-gray-500">/ {promotion.usageLimit}</span>
                        )}
                      </div>
                      {promotion.remainingUsage !== null && promotion.remainingUsage <= 10 && (
                        <div className="text-xs text-orange-600 mt-1">
                          Còn {promotion.remainingUsage} lượt
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {promotion.isValid ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Hoạt động
                          </span>
                        ) : promotion.isExpired ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Hết hạn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Không hoạt động
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            setFormData({
                              name: promotion.name,
                              code: promotion.code,
                              description: promotion.description || '',
                              discountType: promotion.discountPercent !== null ? 'percent' : 'amount',
                              discountPercent: promotion.discountPercent,
                              discountAmount: promotion.discountAmount,
                              maxDiscountAmount: promotion.maxDiscountAmount,
                              startDate: promotion.startDate.split('T')[0],
                              endDate: promotion.endDate.split('T')[0],
                              minOrderAmount: promotion.minOrderAmount,
                              usageLimit: promotion.usageLimit,
                              active: promotion.active
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPromotion(promotion);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {renderPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === '...'}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'cursor-default'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                {showAddModal ? 'Thêm mã khuyến mãi mới' : 'Chỉnh sửa khuyến mãi'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VD: Giảm giá cuối tuần"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={showEditModal}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase ${
                    formErrors.code ? 'border-red-500' : 'border-gray-300'
                  } ${showEditModal ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="VD: WEEKEND20"
                  maxLength={20}
                />
                {formErrors.code && <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>}
                {showEditModal && <p className="text-gray-500 text-sm mt-1">Không thể thay đổi mã</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Mô tả về khuyến mãi..."
                  maxLength={500}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giảm giá <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percent"
                      checked={formData.discountType === 'percent'}
                      onChange={() => setFormData({ 
                        ...formData, 
                        discountType: 'percent',
                        discountAmount: null 
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Giảm theo phần trăm (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="amount"
                      checked={formData.discountType === 'amount'}
                      onChange={() => setFormData({ 
                        ...formData, 
                        discountType: 'amount',
                        discountPercent: null,
                        maxDiscountAmount: null
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Giảm số tiền cố định</span>
                  </label>
                </div>
              </div>

              {/* Discount Value */}
              <div className="grid grid-cols-2 gap-4">
                {formData.discountType === 'percent' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phần trăm giảm (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.discountPercent || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          discountPercent: e.target.value ? Number(e.target.value) : null 
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.discountPercent ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="20"
                        min="0"
                        max="100"
                      />
                      {formErrors.discountPercent && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.discountPercent}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giảm tối đa (đ)
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          maxDiscountAmount: e.target.value ? Number(e.target.value) : null 
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100000"
                        min="0"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền giảm (đ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discountAmount || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discountAmount: e.target.value ? Number(e.target.value) : null 
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.discountAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="50000"
                      min="0"
                    />
                    {formErrors.discountAmount && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.discountAmount}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn hàng tối thiểu (đ)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      minOrderAmount: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới hạn số lần sử dụng
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      usageLimit: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Không giới hạn"
                    min="1"
                    
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Kích hoạt ngay
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={showAddModal ? createPromotion : updatePromotion}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang xử lý...' : showAddModal ? 'Tạo mới' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && selectedPromotion && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Bạn có chắc chắn muốn xóa mã khuyến mãi{' '}
                <span className="font-bold text-gray-800">{selectedPromotion.code}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedPromotion.usageCount > 0
                  ? 'Mã này đã được sử dụng và sẽ được vô hiệu hóa thay vì xóa.'
                  : 'Hành động này không thể hoàn tác.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedPromotion(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={deletePromotion}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang xử lý...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-6 py-3 rounded-lg shadow-xl text-white flex items-center gap-2 animate-slide-in ${
              notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {notif.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {notif.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromotionDashboard;