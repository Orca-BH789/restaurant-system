import { createContext } from "react";

export interface PosNotification {
  id: number;
  type: string;
  targetRole: string;
  tableId?: number;
  orderId?: number;
  referenceId?: string;
  title: string;
  message: string;
  payload?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: PosNotification[];
  addNotification: (notification: PosNotification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
