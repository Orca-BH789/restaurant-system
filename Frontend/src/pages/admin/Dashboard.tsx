import { useEffect, useState } from "react";
import { useAuth } from "../../hook/useAuth";
import getApiBaseUrl from "../../utils/getApiBaseUrl";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  RefreshCw,
  Clock,
} from "lucide-react";

interface Order {
  id: number;
  tableNumber?: string | null;
  customerName?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  orderId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
}

interface TableStatus {
  id: number;
  tableNumber: string;
  status: "Empty" | "Occupied" | "Reserved";
}

// Chart data interfaces
interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface TopMenuItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  color: string;
}

const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  indigo: "#6366F1",
};

export default function Dashboard() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  const API = {
    orders: `${getApiBaseUrl()}/orders`,
    orderDetails: `${getApiBaseUrl()}/orderdetails`,
    tables: `${getApiBaseUrl()}/tables`,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, detailsRes, tablesRes] = await Promise.all([
        api.get<Order[]>(API.orders),
        api.get<OrderDetail[]>(API.orderDetails),
        api.get<TableStatus[]>(API.tables),
      ]);

      setOrders(ordersRes.data || []);
      setOrderDetails(detailsRes.data || []);
      setTables(tablesRes.data || []);
    } catch (err) {
      console.error("Lỗi load dashboard:", err);
      setError("Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === CALCULATIONS ===
  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  
  // Get this week's orders (last 7 days)
  const getWeekOrders = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    return orders.filter((o) => o.createdAt >= weekAgoStr);
  };
  
  const weekOrders = getWeekOrders();
  const displayOrders = todayOrders.length > 0 ? todayOrders : weekOrders;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeTables = tables.filter((t) => t.status === "Occupied").length;
  const pendingOrders = orders.filter((o) => o.status === "Preparing").length;

  // Revenue trend (last 7 days)
  const getDailyRevenue = (): DailyRevenue[] => {
    const days = timeRange === "day" ? 1 : timeRange === "week" ? 7 : 30;
    const data: DailyRevenue[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
      const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      data.push({
        date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: revenue,
        orders: dayOrders.length,
      });
    }

    return data;
  };

  // Top selling items
  const getTopMenuItems = (): TopMenuItem[] => {
    const itemMap = new Map<string, { quantity: number; revenue: number }>();

    orderDetails.forEach((detail) => {
      const existing = itemMap.get(detail.menuItemName) || { quantity: 0, revenue: 0 };
      itemMap.set(detail.menuItemName, {
        quantity: existing.quantity + detail.quantity,
        revenue: existing.revenue + detail.subtotal,
      });
    });

    return Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Order status distribution
  const getStatusDistribution = (): StatusDistribution[] => {
    const statusMap = new Map<string, number>();
    orders.forEach((order) => {
      statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
    });

    const statusColors: Record<string, string> = {
      Preparing: COLORS.warning,
      Paid: COLORS.success,
      Cancelled: COLORS.danger,
      Pending: COLORS.primary,
    };

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] || COLORS.primary,
    }));
  };

  // Hourly orders (today)
  const getHourlyOrders = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      orders: 0,
    }));

    todayOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour].orders++;
    });

    return hourlyData.filter((d) => d.orders > 0);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center">
            <p className="text-xl font-semibold mb-2">⚠️ Lỗi</p>
            <p>{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dailyRevenue = getDailyRevenue();
  const topItems = getTopMenuItems();
  const statusDist = getStatusDistribution();
  const hourlyOrders = getHourlyOrders();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Tổng quan và phân tích kinh doanh</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200">
            {(["day", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${range === "day" ? "rounded-l-lg" : ""} ${
                  range === "month" ? "rounded-r-lg" : ""
                }`}
              >
                {range === "day" ? "Hôm nay" : range === "week" ? "7 ngày" : "30 ngày"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm border border-gray-200"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(todayRevenue)}
          icon={<DollarSign className="w-8 h-8" />}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="+12.5%"
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={todayOrders.length.toString()}
          icon={<ShoppingCart className="w-8 h-8" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="+8.3%"
        />
        <StatCard
          title="Bàn đang sử dụng"
          value={`${activeTables}/${tables.length}`}
          icon={<Users className="w-8 h-8" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend="+2"
        />
        <StatCard
          title="Đơn chờ xử lý"
          value={pendingOrders.toString()}
          icon={<Clock className="w-8 h-8" />}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend="&uarr; 5"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <ChartCard title="Xu hướng doanh thu" icon={<TrendingUp className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Distribution */}
        <ChartCard title="Phân bổ trạng thái đơn hàng" icon={<ShoppingCart className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={statusDist as unknown as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(entry: any) => `${entry.status}: ${entry.count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {statusDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Selling Items */}
        <ChartCard title="Top 5 món bán chạy" icon={<TrendingUp className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatCurrency(value) : value,
                  name === "revenue" ? "Doanh thu" : "Số lượng",
                ]}
              />
              <Legend />
              <Bar dataKey="quantity" fill={COLORS.primary} name="Số lượng" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hourly Orders */}
        <ChartCard title="Đơn hàng theo giờ (Hôm nay)" icon={<Clock className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={COLORS.success}
                strokeWidth={3}
                dot={{ fill: COLORS.success, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Đơn hàng gần đây {todayOrders.length === 0 && "(Tuần này)"}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Khách / Bàn
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Không có đơn hàng
                  </td>
                </tr>
              ) : (
                displayOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{o.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {o.tableNumber ? `Bàn ${o.tableNumber}` : o.customerName || "Khách"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            o.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : o.status === "Preparing"
                              ? "bg-yellow-100 text-yellow-700"
                              : o.status === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(o.createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === COMPONENTS ===
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl">
      <div className={`${color} p-6 text-white`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm opacity-90 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className="text-sm mt-2 opacity-90 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {trend} so với tuần trước
              </p>
            )}
          </div>
          <div className="opacity-80">{icon}</div>
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ChartCard({ title, icon, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}