import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
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
  Eye,
  Mail,
  Phone,
  User,
  ShoppingBag,
  Calendar as CalendarIcon,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ==================== TYPES ====================

interface Customer {
  id: number;
  fullName: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalReservations: number;
  totalSpent: number;
}

interface CustomerDetail extends Customer {
  orders: Order[];
  reservations: Reservation[];
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  orderTime: string;
}

interface Reservation {
  id: number;
  reservationNumber: string;
  reservationTime: string;
  status: string;
  numberOfGuests: number;
}

interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}



interface Notification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

type SortField = 'fullName' | 'phone' | 'totalOrders' | 'totalSpent' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// ==================== MAIN COMPONENT ====================

const CustomerDashboard: React.FC = () => {
  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasOrdersFilter, setHasOrdersFilter] = useState<'all' | 'with' | 'without'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | CustomerDetail | null>(null);

  // Form
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ==================== API CALLS ====================

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNumber: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: sortField,
        isDescending: (sortOrder === 'desc').toString(),
      });

      if (searchTerm) params.append('searchTerm', searchTerm);
      if (hasOrdersFilter === 'with') params.append('hasOrders', 'true');
      if (hasOrdersFilter === 'without') params.append('hasOrders', 'false');

      const response = await axios.get<PagedResponse<Customer>>(
        `${API_BASE_URL}/customers?${params}`
      );

      setCustomers(response.data.data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi tải danh sách khách hàng';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortOrder, searchTerm, hasOrdersFilter]);

  const fetchCustomerDetail = async (id: number) => {
    try {
      const response = await axios.get<CustomerDetail>(`${API_BASE_URL}/customers/${id}`);
      setSelectedCustomer(response.data);
      setShowDetailModal(true);
    } catch {
      showNotification('error', 'Lỗi khi tải chi tiết khách hàng');
    }
  };

  const createCustomer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/customers`, {
        fullName: formData.fullName,
        phone: formData.phone || null,
        email: formData.email || null,
      });

      showNotification('success', 'Thêm khách hàng thành công');
      setShowAddModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi tạo khách hàng';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async () => {
    if (!selectedCustomer || !validateForm()) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/customers/${selectedCustomer.id}`, {
        id: selectedCustomer.id,
        fullName: formData.fullName,
        phone: formData.phone || null,
        email: formData.email || null,
      });

      showNotification('success', 'Cập nhật khách hàng thành công');
      setShowEditModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi cập nhật khách hàng';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/customers/${selectedCustomer.id}`);

      showNotification('success', 'Xóa khách hàng thành công');
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi khi xóa khách hàng';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = 'Tên khách hàng là bắt buộc';
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ fullName: '', phone: '', email: '' });
    setFormErrors({});
    setSelectedCustomer(null);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const csvContent = [
      ['STT', 'Tên', 'SĐT', 'Email', 'Đơn hàng', 'Đặt bàn', 'Tổng chi', 'Ngày tạo'].join(','),
      ...filteredCustomers.map((c, i) => [
        i + 1,
        c.fullName,
        c.phone || '',
        c.email || '',
        c.totalOrders,
        c.totalReservations,
        c.totalSpent.toLocaleString(),
        new Date(c.createdAt).toLocaleDateString('vi-VN'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    let filtered = [...customers];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter
    if (hasOrdersFilter === 'with') {
      filtered = filtered.filter((c) => c.totalOrders > 0);
    } else if (hasOrdersFilter === 'without') {
      filtered = filtered.filter((c) => c.totalOrders === 0);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, hasOrdersFilter]);

  // ==================== PAGINATION ====================

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Quản lý Khách hàng</h1>
          <p className="text-gray-600">Tổng: {filteredCustomers.length} khách hàng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export danh sách khách hàng"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Thêm khách hàng mới"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER PANEL */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={hasOrdersFilter}
            onChange={(e) => {
              setHasOrdersFilter(e.target.value as 'all' | 'with' | 'without');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả khách hàng</option>
            <option value="with">Có đơn hàng</option>
            <option value="without">Chưa có đơn hàng</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setHasOrdersFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Hiển thị {currentCustomers.length} / {filteredCustomers.length} khách hàng
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">STT</th>
                <th
                  className="px-6 py-3 text-left text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('fullName')}
                  title="Click để sắp xếp"
                >
                  <div className="flex items-center gap-2">
                    Tên khách hàng
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">SĐT</th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">Email</th>
                <th
                  className="px-6 py-3 text-center text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('totalOrders')}
                  title="Click để sắp xếp"
                >
                  <div className="flex items-center justify-center gap-2">
                    Đơn hàng
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-center text-gray-700 font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('totalSpent')}
                  title="Click để sắp xếp"
                >
                  <div className="flex items-center justify-center gap-2">
                    Tổng chi
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-gray-700 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Đang tải...</p>
                  </td>
                </tr>
              ) : currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                currentCustomers.map((customer, index) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-semibold text-gray-900">{customer.fullName}</div>
                          <div className="text-xs text-gray-500">ID: #{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {customer.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {customer.phone}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {customer.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {customer.email}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        <ShoppingBag className="w-4 h-4" />
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {(customer.totalSpent / 1000).toFixed(1)}k
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => fetchCustomerDetail(customer.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setFormData({
                              fullName: customer.fullName,
                              phone: customer.phone || '',
                              email: customer.email || '',
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
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
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages} ({filteredCustomers.length} mục)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      : 'border border-gray-300 hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedCustomer && 'orders' in selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b bg-linear-to-r from-blue-50 to-blue-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Tên khách hàng</p>
                    <p className="font-bold text-gray-900">{selectedCustomer.fullName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Số điện thoại</p>
                    <p className="font-bold text-gray-900">{selectedCustomer.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Email</p>
                    <p className="font-bold text-gray-900 break-all">{selectedCustomer.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Ngày tạo</p>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Đơn hàng</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                  <CalendarIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Đặt bàn</p>
                  <p className="text-2xl font-bold text-green-600">{selectedCustomer.totalReservations}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                  <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Tổng chi</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(selectedCustomer.totalSpent / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>

              {/* Orders */}
              {selectedCustomer.orders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    Đơn hàng gần đây ({selectedCustomer.orders.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.orderTime).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{(order.totalAmount / 1000).toFixed(1)}k</p>
                          <p className="text-xs text-gray-500">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reservations */}
              {selectedCustomer.reservations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-green-600" />
                    Đặt bàn gần đây ({selectedCustomer.reservations.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCustomer.reservations.map((res) => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{res.reservationNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(res.reservationTime).toLocaleString('vi-VN')} · {res.numberOfGuests} khách
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          {res.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.orders.length === 0 && selectedCustomer.reservations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Khách hàng này chưa có đơn hàng hoặc đặt bàn</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex justify-between items-center border-b bg-linear-to-r from-blue-50 to-blue-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {showAddModal ? 'Thêm khách hàng mới' : 'Chỉnh sửa khách hàng'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Tên khách hàng <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên khách hàng"
                />
                {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Số điện thoại
                  </span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0123456789"
                />
                {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@example.com"
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={showAddModal ? createCustomer : updateCustomer}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Đang xử lý...' : showAddModal ? 'Tạo mới' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn xóa khách hàng{' '}
                <span className="font-bold">"{selectedCustomer.fullName}"</span>?
              </p>

              {selectedCustomer.totalOrders > 0 && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                  <XCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Khách hàng này có <strong>{selectedCustomer.totalOrders}</strong> đơn hàng. Xóa sẽ ảnh hưởng dữ liệu thống kê.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCustomer(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={deleteCustomer}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Đang xử lý...' : 'Xóa khách hàng'}
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

export default CustomerDashboard;
