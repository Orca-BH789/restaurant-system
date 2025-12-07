import type { AxiosInstance } from "axios";

// ==========================================
// Types & Interfaces
// ==========================================

export type Table = {
  id: number;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  location?: string;
  status: string;
  isActive: boolean;
  currentOrderId?: number | null;
  guestCount?: number;
  mergedWith?: number[];
  isHidden?: boolean;
  qrCodeUrl?: string;
};

export type OrderItem = {
  id: number;
  orderId: number;
  menuItemId: number;
  unit:string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Order = {
  id: number;
  tableIds?: number[];
  tables?: Table[];
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  numberOfGuests?: number;
  orderDetails: OrderItem[];
  status: string;
  orderType: string;
  orderTime: string;
  staffId?: number;
  staffName?: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  isAvailable: boolean;
  category?: { name: string };
};

export type OrderTable = {
  id: number;
  orderId: number;
  tableId: number;
  order?: Order;
  table?: Table;
};

export type CreateOrderDetailDTO = {
  orderId: number;
  menuItemId: number;
  quantity: number;
  unitPrice?: number;
  note?: string;
};

export type UpdateOrderDetailDTO = {
  quantity: number;
  unitPrice: number;
  note?: string;
};

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export type TableSuggestionDTO = {
  tableId: number;
  tableName: string;
  capacity: number;
  location: string; // Backend dùng Location, không phải Area
};

export type CreateReservationDTO = {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  numberOfGuests: number;
  reservationTime: string;
  preferredArea?: string;
  notes?: string;
};

export type ReservationDetailDTO = {
  id: number;
  customerId?: number;
  reservationNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  numberOfGuests: number;
  reservationTime: string;
  status: "Pending" | "Confirmed" | "Arrived" | "Cancelled";
  notes?: string;
  preferredArea?: string;
  suggestedTables: TableSuggestionDTO[];
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  orderId?: number;
  orderNumber?: string;
};

// Dashboard response từ backend
export type DashboardDTO = {
  date: string;
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  arrivedCount: number;
  cancelledCount: number;
  currentCapacityPercent: number;
  overdueReservations: ReservationDetailDTO[];
  upcomingReservations: ReservationDetailDTO[];
};

// Backend response structure từ controller
export type BackendCreateReservationResponse = {
  success: boolean;
  data?: ReservationDetailDTO;
  message?: string;
};

export type BackendErrorResponse = {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
};

export type BackendSuggestTablesResponse = {
  success: boolean;
  data: TableSuggestionDTO[];
  message?: string;
};

export type BackendCapacityResponse = {
  success: boolean;
  data: {
    capacityPercent: number;
    isAvailable: boolean;
    message: string;
  };
};

export type PaginatedReservationResponse = {
  success: boolean;
  data: {
    data: ReservationDetailDTO[];
    totalCount: number;
    pageNumber: number;
  };
  message?: string;
};

// ==========================================
// API Service Class
// ==========================================

export class APIService {
  private apiInstance: AxiosInstance;

  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(apiInstance: AxiosInstance) {
    this.apiInstance = apiInstance;
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.apiInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Nếu đang refresh thì đợi
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error('Refresh timeout'));
              }, 10000);

              this.refreshSubscribers.push(() => {
                clearTimeout(timeoutId);
                resolve(this.apiInstance(originalRequest));
              });
            });
          }
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await fetch('/api/auth/refresh-token', {
              method: 'POST',
              credentials: 'include'
            });

            this.isRefreshing = false;
            this.refreshSubscribers.forEach(cb => cb('refreshed'));
            this.refreshSubscribers = [];

            return this.apiInstance(originalRequest);

          } catch (refreshError) {
            // Refresh thất bại → Đăng xuất
            this.isRefreshing = false;
            this.refreshSubscribers = [];

            // Redirect về login
            window.location.href = 'https://localhost:5173/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleResponse<T>(response: { data: T }): Promise<T> {
    return response.data;
  }

  // ========== Tables API ==========
  async getTables(): Promise<Table[]> {
    const response = await this.apiInstance.get<Table[]>("/Tables");
    return this.handleResponse(response);
  }

  async getTable(id: number): Promise<Table> {
    const response = await this.apiInstance.get<Table>(`/Tables/${id}`);
    return this.handleResponse(response);
  }

  async updateTableStatus(id: number, status: string): Promise<void> {
    const response = await this.apiInstance.patch<void>(`/Tables/${id}/status`, {
      status,
    });
    return this.handleResponse(response);
  }

  async getCurrentOrder(tableId: number): Promise<Order | null> {
    try {
      const response = await this.apiInstance.get<Order>(
        `Orders/Tables/${tableId}/current`
      );
      return this.handleResponse(response);
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) return null;
      }
      throw error;
    }
  }

  async revokeAllTokens(): Promise<void> {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    const response = await this.apiInstance.post<void>(
      '/auth/revoke-all-tokens',
      {},
      {
        headers: {
          'X-CSRF-TOKEN': csrfToken || ''
        }
      }
    );
    return this.handleResponse(response);
  }

  // ========== Orders API ==========
  async getOrders(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    staffId?: number;
  }): Promise<Order[]> {
    const response = await this.apiInstance.get<Order[]>("/Orders", {
      params,
    });
    return this.handleResponse(response);
  }

  async getOrder(id: number): Promise<Order> {
    const response = await this.apiInstance.get<Order>(`/Orders/${id}`);
    return this.handleResponse(response);
  }

  async activateTable(
    tableId: number,
    dto: {
      customerId?: number;
      customerName?: string;
      customerPhone?: string;
      numberOfGuests: number;
    }
  ): Promise<{
    message: string;
    order: Order;
    qrUrl: string;
    token: string;
  }> {
    const response = await this.apiInstance.post<{
      message: string;
      order: Order;
      qrUrl: string;
      token: string;
    }>(`/Orders/activate-table/${tableId}`, dto);
    return this.handleResponse(response);
  }

  async updateOrderStatus(id: number, status: string): Promise<void> {
    const response = await this.apiInstance.put<void>(
      `/Orders/${id}/status`,
      JSON.stringify(status)
    );
    return this.handleResponse(response);
  }

  async requestPayment(orderId: number): Promise<void> {
    const response = await this.apiInstance.post<void>(
      `/Orders/${orderId}/request-payment`
    );
    return this.handleResponse(response);
  }

  async completeOrder(
    orderId: number,
    paymentMethod: string,
    amountPaid: number
  ): Promise<{ message: string; invoiceId: number }> {
    const response = await this.apiInstance.post<{
      message: string;
      invoiceId: number;
    }>(`/Orders/${orderId}/complete`, {
      paymentMethod,
      amountPaid,
    });
    return this.handleResponse(response);
  }

  async mergeOrders(
    sourceOrderId: number,
    targetOrderId: number
  ): Promise<void> {
    const response = await this.apiInstance.post<void>("/Orders/merge", {
      sourceOrderId,
      targetOrderId,
    });
    return this.handleResponse(response);
  }

  async splitOrder(
    orderId: number,
    itemIds: number[],
    newTableId?: number
  ): Promise<Order> {
    const response = await this.apiInstance.post<Order>(
      `/Orders/${orderId}/split`,
      {
        orderDetailIds: itemIds,
        newTableId,
      }
    );
    return this.handleResponse(response);
  }

  // ========== Order Details API ==========
  async addOrderItem(dto: CreateOrderDetailDTO): Promise<OrderItem> {
    const response = await this.apiInstance.post<OrderItem>(
      "/OrderDetails",
      dto
    );
    return this.handleResponse(response);
  }

  async updateOrderItem(id: number, dto: UpdateOrderDetailDTO): Promise<void> {
    const response = await this.apiInstance.put<void>(
      `/OrderDetails/${id}`,
      dto
    );
    return this.handleResponse(response);
  }

  async deleteOrderItem(id: number): Promise<void> {
    const response = await this.apiInstance.delete<void>(
      `/OrderDetails/${id}`
    );
    return this.handleResponse(response);
  }

  async updateOrderItemStatus(id: number, status: string): Promise<void> {
    const response = await this.apiInstance.put<void>(
      `/OrderDetails/${id}/status`,
      JSON.stringify(status)
    );
    return this.handleResponse(response);
  }

  // ========== Order Tables API ==========
  async getOrderTables(): Promise<OrderTable[]> {
    const response = await this.apiInstance.get<OrderTable[]>("/OrderTables");
    return this.handleResponse(response);
  }

  async linkTableToOrder(
    orderId: number,
    tableId: number
  ): Promise<OrderTable> {
    const response = await this.apiInstance.post<OrderTable>("/OrderTables", {
      orderId,
      tableId,
    });
    return this.handleResponse(response);
  }

  async unlinkTableFromOrder(orderTableId: number): Promise<void> {
    const response = await this.apiInstance.delete<void>(
      `/OrderTables/${orderTableId}`
    );
    return this.handleResponse(response);
  }

  // ========== Transfer & Merge API ==========
  async transferTable(fromTableId: number, toTableId: number): Promise<{ message: string }> {
    const response = await this.apiInstance.post<{ message: string }>(
      `/Tables/${fromTableId}/move-to/${toTableId}`
    );
    return this.handleResponse(response);
  }

  async mergeTables(tableIds: number[]): Promise<{ message: string }> {
    const response = await this.apiInstance.post<{ message: string }>("/Tables/merge", {
      tableIds
    });
    return this.handleResponse(response);
  }

  // ========== Menu Items API ==========
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await this.apiInstance.get<MenuItem[]>("/MenuItems");
      return this.handleResponse(response);
    } catch (error) {
      // Fallback to mock data if API not implemented
      console.warn("Using mock menu data", error);
      return [
        {
          id: 1,
          name: "Phở Bò",
          description: "Phở truyền thống",
          price: 65000,
          categoryId: 1,
          isAvailable: true,
        },
        {
          id: 2,
          name: "Bún Bò Huế",
          description: "Bún bò Huế cay",
          price: 60000,
          categoryId: 1,
          isAvailable: true,
        },
        {
          id: 3,
          name: "Cơm Tấm",
          description: "Cơm tấm sườn bì chả",
          price: 55000,
          categoryId: 1,
          isAvailable: true,
        },
        {
          id: 4,
          name: "Gỏi Cuốn",
          description: "Gỏi cuốn tôm thịt",
          price: 35000,
          categoryId: 2,
          isAvailable: true,
        },
        {
          id: 5,
          name: "Nem Rán",
          description: "Nem rán giòn",
          price: 40000,
          categoryId: 2,
          isAvailable: true,
        },
        {
          id: 6,
          name: "Cà Phê Sữa Đá",
          description: "Cà phê sữa truyền thống",
          price: 25000,
          categoryId: 3,
          isAvailable: true,
        },
        {
          id: 7,
          name: "Trà Đào",
          description: "Trà đào cam sả",
          price: 30000,
          categoryId: 3,
          isAvailable: true,
        },
      ];
    }
    
  } 
  // ========== Reservations API ==========

  /**
   * Tạo đặt bàn mới
   */
  async createReservation(dto: CreateReservationDTO): Promise<BackendCreateReservationResponse> {
    const response = await this.apiInstance.post<BackendCreateReservationResponse>(
      "/reservations",
      dto
    );
    return this.handleResponse(response);
  }

  /**
   * Lấy thông tin đặt bàn theo ID
   */
  async getReservationById(id: number): Promise<BackendCreateReservationResponse> {
    const response = await this.apiInstance.get<BackendCreateReservationResponse>(
      `/reservations/${id}`
    );
    return this.handleResponse(response);
  }

  async getReservationByNumber(reservationNumber: string): Promise<BackendCreateReservationResponse> {
    const response = await this.apiInstance.get<BackendCreateReservationResponse>(
      `/reservations/by-number/${reservationNumber}`
    );
    return this.handleResponse(response);
  }

  /**
   * Lấy danh sách đặt bàn của khách hàng theo số điện thoại
   */
  async getCustomerReservations(phone: string): Promise<ReservationDetailDTO[]> {
    try {
      const response = await this.apiInstance.get<{ success: boolean; data: { data: ReservationDetailDTO[]; totalCount: number; pageNumber: number } }>(
        `/reservations/my-reservations?phone=${phone}`
      );
      const result = await this.handleResponse(response);
      
      if (result.success && result.data && result.data.data) {
        return Array.isArray(result.data.data) ? result.data.data : [];
      }
      
      return [];
    } catch (error) {
      console.error("Error getting customer reservations:", error);
      return [];
    }
  }

  async getSuggestedTables(
    numberOfGuests: number,
    reservationTime: string,
    preferredArea?: string
  ): Promise<TableSuggestionDTO[]> {
    try {
      const params: Record<string, string> = {
        numberOfGuests: numberOfGuests.toString(),
        reservationTime: reservationTime,
      };

      if (preferredArea) {
        params.preferredArea = preferredArea;
      }

      console.log("Calling suggest-tables with params:", params);

      const response = await this.apiInstance.get<BackendSuggestTablesResponse>(
        "/reservations/suggest-tables",
        { params }
      );

      const result = await this.handleResponse(response);
      
      console.log("Suggest tables result:", result);

      // Backend trả về { success, data, message }
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error("Error in getSuggestedTables:", error);
      throw error;
    }
  }

  /**
   * Lấy % capacity hiện tại
   */
  async getCurrentCapacity(): Promise<number> {
    try {
      const response = await this.apiInstance.get<BackendCapacityResponse>(
        "/reservations/capacity"
      );
      const result = await this.handleResponse(response);
      
      if (result.success && result.data) {
        return result.data.capacityPercent;
      }
      
      return 0;
    } catch (error) {
      console.error("Error getting capacity:", error);
      return 0;
    }
  }

  /**
   * Xác nhận đặt bàn (Pending -> Confirmed)
   */
  async confirmReservation(id: number): Promise<{ success: boolean; message: string }> {
    const response = await this.apiInstance.put<{ success: boolean; message: string }>(
      `/reservations/${id}/confirm`
    );
    return this.handleResponse(response);
  }

  /**
   * Hủy đặt bàn
   */
  async cancelReservation(
    id: number,
    cancelReason?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.apiInstance.delete<{ success: boolean; message: string }>(
      `/reservations/${id}`,
      { data: { cancelReason } }
    );
    return this.handleResponse(response);
  }

  /**
   * Lấy dashboard theo ngày (STAFF/ADMIN)
   */
  async getDashboard(date: string): Promise<{ dashboard: DashboardDTO; reservations: ReservationDetailDTO[] }> {
    try {
      const response = await this.apiInstance.get<{ success: boolean; data: DashboardDTO }>(
        `/reservations/dashboard?date=${date}`
      );
      const result = await this.handleResponse(response);
      
      if (result.success && result.data) {
        const dashboard = result.data;
        // Combine all reservations from dashboard
        const reservations = [
          ...dashboard.overdueReservations,
          ...dashboard.upcomingReservations
        ];
        return { dashboard, reservations };
      }
      
      return { 
        dashboard: {
          date,
          totalReservations: 0,
          pendingCount: 0,
          confirmedCount: 0,
          arrivedCount: 0,
          cancelledCount: 0,
          currentCapacityPercent: 0,
          overdueReservations: [],
          upcomingReservations: []
        },
        reservations: []
      };
    } catch (error) {
      console.error("Error getting dashboard:", error);
      return { 
        dashboard: {
          date,
          totalReservations: 0,
          pendingCount: 0,
          confirmedCount: 0,
          arrivedCount: 0,
          cancelledCount: 0,
          currentCapacityPercent: 0,
          overdueReservations: [],
          upcomingReservations: []
        },
        reservations: []
      };
    }
  }

  /**
   * Lấy danh sách đặt bàn (STAFF/ADMIN) - với pagination
   * Backend trả về: { success: true, data: { data: [...], totalCount, pageNumber } }
   * hoặc trực tiếp: { data: [...], totalCount, pageNumber }
   */
  async getReservations(query?: Record<string, string | number | boolean>): Promise<{ data: ReservationDetailDTO[]; totalCount: number; pageNumber: number }> {
    try {
      const response = await this.apiInstance.get<{ success?: boolean; data: { data: ReservationDetailDTO[]; totalCount: number; pageNumber: number } | ReservationDetailDTO[] }>(
        `/reservations`,
        { params: query }
      );
      const result = await this.handleResponse(response);
      
      // Handle different response structures from backend
      // Case 1: { success: true, data: { data: [...], totalCount, pageNumber } }
      if (result.success && result.data && typeof result.data === 'object' && 'data' in result.data) {
        const paginatedData = result.data as { data: ReservationDetailDTO[]; totalCount: number; pageNumber: number };
        return {
          data: Array.isArray(paginatedData.data) ? paginatedData.data : [],
          totalCount: paginatedData.totalCount || 0,
          pageNumber: paginatedData.pageNumber || 1
        };
      }
      
      // Case 2: Direct response { data: [...], totalCount, pageNumber }
      if (result.data && typeof result.data === 'object' && 'data' in result.data) {
        const paginatedData = result.data as { data: ReservationDetailDTO[]; totalCount: number; pageNumber: number };
        return {
          data: Array.isArray(paginatedData.data) ? paginatedData.data : [],
          totalCount: paginatedData.totalCount || 0,
          pageNumber: paginatedData.pageNumber || 1
        };
      }
      
      // Case 3: Response is array directly
      if (Array.isArray(result.data)) {
        return {
          data: result.data,
          totalCount: result.data.length,
          pageNumber: 1
        };
      }
      
      return {
        data: [],
        totalCount: 0,
        pageNumber: 1
      };
    } catch (error) {
      console.error("Error getting reservations list:", error);
      return {
        data: [],
        totalCount: 0,
        pageNumber: 1
      };
    }
  }

  /**
   * Lấy danh sách đặt bàn theo ngày (alias for getDashboard - for compatibility)
   */
  async getReservationsByDate(date: string): Promise<{ dashboard: DashboardDTO; reservations: ReservationDetailDTO[] }> {
    return this.getDashboard(date);
  }

  /**
   * Xác nhận khách đến (Check-in) - Tạo order tự động
   */
  async arriveReservation(id: number): Promise<{ success: boolean; message: string; data?: { orderId: number } }> {
    const response = await this.apiInstance.post<{ success: boolean; message: string; data?: { orderId: number } }>(
      `/reservations/${id}/arrive`
    );
    return this.handleResponse(response);
  }
}



export default APIService;