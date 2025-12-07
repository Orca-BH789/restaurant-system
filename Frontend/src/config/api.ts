/**
 * API Configuration
 * Centralized API URL configuration
 */

// Helper function to get the correct API base URL
export const getAPIBaseURL = (): string => {
  // Always use production URL or fallback
  return import.meta.env.VITE_API_BASE_URL_PROD || 'https://webdemocuahangtraicay.io.vn/core/api';
};

export const API_BASE_URL = getAPIBaseURL();

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/Auth/login',
  AUTH_LOGOUT: '/Auth/logout',
  AUTH_FORGOT_PASSWORD: '/Auth/forgot-password',
  AUTH_RESET_PASSWORD: '/Auth/reset-password',
  AUTH_REFRESH_TOKEN: '/auth/refresh-token',

  // Tables
  TABLES: '/Tables',
  TABLE_BY_ID: (id: number) => `/Tables/${id}`,
  TABLE_STATUS: (id: number) => `/Tables/${id}/status`,
  TABLES_MOVE: (fromId: number, toId: number) => `/tables/${fromId}/move-to/${toId}`,
  TABLES_MERGE: '/tables/merge',

  // Orders
  ORDERS: '/Orders',
  ORDER_BY_ID: (id: number) => `/Orders/${id}`,
  ORDER_STATUS: (id: number) => `/Orders/${id}/status`,
  ORDER_COMPLETE: (id: number) => `/Orders/${id}/complete`,
  ORDER_REQUEST_PAYMENT: (id: number) => `/Orders/${id}/request-payment`,
  ORDER_ACTIVATE_TABLE: (tableId: number) => `/Orders/activate-table/${tableId}`,
  ORDER_SCAN_TABLE: (tableId: number) => `/orders/scan-table/${tableId}`,
  ORDER_CURRENT: (tableId: number) => `/Orders/Tables/${tableId}/current`,
  ORDERS_MERGE: '/Orders/merge',
  ORDERS_SPLIT: '/Orders/split',

  // Order Details
  ORDER_DETAILS: '/OrderDetails',
  ORDER_DETAIL_BY_ID: (id: number) => `/OrderDetails/${id}`,

  // Menu
  CATEGORIES: '/Categories',
  MENU_ITEMS: '/MenuItems',
  MENU_ITEM_BY_ID: (id: number) => `/MenuItems/${id}`,

  // Invoices
  INVOICES: '/Invoices',
  INVOICE_BY_ID: (id: number) => `/Invoices/${id}`,
  INVOICE_PAY: (orderId: number) => `/Invoices/Pay/${orderId}`,
  INVOICE_FROM_ORDER: (orderId: number) => `/Invoices/from-order/${orderId}`,
  INVOICE_STATUS: (id: number) => `/Invoices/${id}/status`,

  // Kitchen
  KITCHEN: '/Kitchen',
  KITCHEN_UPDATE_STATUS: (id: number) => `/Kitchen/update-status/${id}`,
  KITCHEN_TABLE: (tableId: number) => `/Kitchen/table/${tableId}`,

  // Payments (VietQR)
  PAYMENT_VIETQR_GENERATE: 'Payment/vietqr/generate',
  PAYMENT_VIETQR_CHECK_STATUS: (refId: string) => `/Payment/vietqr/check/${refId}`,

  // Settings
  SETTINGS: '/Settings',
  SETTINGS_BY_KEY: (key: string) => `/Settings/${key}`,

  // Notifications
  NOTIFICATIONS: '/Notifications',

  // Promotions
  PROMOTIONS_ACTIVE: '/Promotions/active',
  PROMOTIONS: '/Promotions',
  PROMOTION_BY_ID: (id: number) => `/Promotions/${id}`,

  //Reservations
  RESERVATIONS: '/Reservations',
  RESERVATION_BY_ID: (id: number) => `/Reservations/${id}`,
  RESERVATION_BY_NUMBER: (number: string) => `/Reservations/number/${number}`,
  RESERVATION_CUSTOMER: (phone: string) => `/Reservations/customer/${phone}`,
  RESERVATION_CONFIRM: (id: number) => `/Reservations/${id}/confirm`,
  RESERVATION_ARRIVE: (id: number) => `/Reservations/${id}/arrive`,
  RESERVATION_CANCEL: (id: number) => `/Reservations/${id}/cancel`,
  RESERVATION_SUGGEST_TABLES: '/Reservations/suggest-tables',
  RESERVATION_CAPACITY: '/Reservations/capacity',
  RESERVATION_DASHBOARD: (date: string) => `/Reservations/dashboard?date=${date}`,
  RESERVATION_TIMELINE: (date: string) => `/Reservations/timeline?date=${date}`,
};
