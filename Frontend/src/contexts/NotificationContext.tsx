import { useState, useCallback, type ReactNode } from "react";
import { NotificationContext, type PosNotification } from "./NotificationContextDefinition";

export type { PosNotification };

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PosNotification[]>([]);

  const addNotification = useCallback((notification: PosNotification) => {
    setNotifications((prev) => {
      // Kiểm tra xem notification này đã tồn tại chưa
      const isDuplicate = prev.some((n) => n.id === notification.id);
      if (isDuplicate) return prev;
      
      // Thêm notification mới lên đầu danh sách
      return [notification, ...prev];
    });
  }, []);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
