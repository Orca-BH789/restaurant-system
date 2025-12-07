// src/routes/AdminLayout.tsx
import React, { useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, Home, List, Users as UsersIcon, CookingPot, SquareMenu,ChefHat, LogOut, HandPlatter, ScrollText,Settings, Calendar, ChevronDown  } from "lucide-react";
import Orders from "../../pages/admin/Orders";
import Users from "../../pages/admin/Users";
import Menu from "../../pages/admin/Menu";
import Categories from "../../pages/admin/Categories";
import Tables from "../../pages/admin/Tables";
import Invoices from "../../pages/admin/Invoices";
import OrderDtl from "../../pages/admin/Expense";
import  Settings1  from "../../pages/admin/Settings";
import { useAuth } from "../../hook/useAuth";
import Dashboard from "../../pages/admin/Dashboard";
import TableQRPrint from "../../pages/admin/TableQRPrint";
import Promotions from "../../pages/admin/Promotions";
import Reservations from "../../pages/admin/Reservations";
import Customers from "../../pages/admin/Customers";
import Profile from "../../pages/admin/Profile";
import ChatBot from "../../components/shared/AdminChatBot";



function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    business: true,
    restaurant: true,
    bookings: true,
    system: false,
  });
  
  const LinkItem = ({
    to,
    label,
    Icon,
  }: {
    to: string;
    label: string;
    Icon?: React.ElementType;
  }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 py-3 px-4 rounded-lg transition ${
          isActive
            ? "bg-blue-600 text-white shadow"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      {Icon && <Icon size={18} />}
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const GroupHeader = ({ group, label }: { group: string; label: string }) => (
    <button
      onClick={() => toggleGroup(group)}
      className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition"
    >
      <span>{label}</span>
      <ChevronDown
        size={16}
        className={`transition-transform ${expandedGroups[group] ? "rotate-0" : "-rotate-90"}`}
      />
    </button>
  );

  const handleLogout = () => {
    logout();  
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
      <div className="px-6 py-6 border-b border-gray-200">
        <h1 className="text-xl font-extrabold text-blue-600">VietThai Admin</h1>
        <p className="text-sm text-gray-400">Management Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto">
        {/* Main */}
        <LinkItem to="/admin" label="Dashboard" Icon={Home} />

        {/* Business */}
        <div>
          <GroupHeader group="business" label="Business" />
          {expandedGroups.business && (
            <div className="space-y-1">
              <LinkItem to="/admin/orders" label="Orders" Icon={CookingPot} />
              <LinkItem to="/admin/invoices" label="Invoices" Icon={ScrollText} />
              <LinkItem to="/admin/promotions" label="Promotions" Icon={CookingPot} />
              <LinkItem to="/admin/orderdtl" label="Expense" Icon={ChefHat} />
            </div>
          )}
        </div>

        {/* Restaurant */}
        <div>
          <GroupHeader group="restaurant" label="Restaurant" />
          {expandedGroups.restaurant && (
            <div className="space-y-1">
              <LinkItem to="/admin/menu" label="Menu" Icon={SquareMenu} />
              <LinkItem to="/admin/categories" label="Categories" Icon={List} />
              <LinkItem to="/admin/tables" label="Tables" Icon={HandPlatter} />
            </div>
          )}
        </div>

        {/* Booking & Customers */}
        <div>
          <GroupHeader group="bookings" label="Bookings" />
          {expandedGroups.bookings && (
            <div className="space-y-1">
              <LinkItem to="/admin/reservations" label="Reservations" Icon={Calendar} />
              <LinkItem to="/admin/customers" label="Customers" Icon={UsersIcon} />
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <GroupHeader group="system" label="System" />
          {expandedGroups.system && (
            <div className="space-y-1">
              <LinkItem to="/admin/users" label="Users" Icon={UsersIcon} />
              <LinkItem to="/admin/settings" label="Settings" Icon={Settings} />
            </div>
          )}
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-gray-200">
        <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-600 w-full text-left">
            <LogOut size={24} /> Logout
          </button>
      </div>
    </aside>
  );
}
// Topbar component
function Topbar({ onToggle }: { onToggle?: () => void }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Người dùng";
  const firstLetter = username.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        <button
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={onToggle}
          aria-label="Toggle menu"
        >
          <MenuIcon size={20} />
        </button>

        <div className="flex items-center gap-4 ml-auto">
          <button 
            onClick={() => navigate('/admin/profile')}
            className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition cursor-pointer"
          >
            <span>Xin chào,</span>
            <span className="font-semibold text-blue-600">{username}</span>
          </button>
          <button 
            onClick={() => navigate('/admin/profile')}
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold hover:bg-blue-700 transition"
          >
            {firstLetter}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (ẩn trên mobile) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-xl">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Topbar onToggle={() => setMobileOpen((s) => !s)} />

        <main className="flex-1 bg-gray-50 p-6">
          <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orderdtl" element={<OrderDtl />} />
            <Route path="users" element={<Users />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="categories" element={<Categories />} />
            <Route path="menu" element={<Menu/>} />
            <Route path="tables" element={<Tables />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="settings" element={<Settings1 />} />
            <Route path="/print/table/:id" element={<TableQRPrint />} />
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 text-center py-3 text-sm text-gray-500">
          © {new Date().getFullYear()} Admin System
        </footer>
      </div>
      
      {/* AI ChatBot */}
      <ChatBot />
    </div>
  );
}