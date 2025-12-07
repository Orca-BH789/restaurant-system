import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../utils/getApiBaseUrl";

// ==========================================
// Types
// ==========================================

interface User {
  username: string;
  role: string;
  token?: string;  
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  username: string;
  role: string;
  token?: string;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{
    user: User;
    message: string;
  }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  api: typeof api;
}

// ==========================================
// Axios Instance Configuration
// ==========================================

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ==========================================
// Request Interceptor
// ==========================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor với Refresh Token Logic
// ==========================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const AUTH_ENDPOINTS = [
  '/auth/refresh-token',
  '/auth/login',
  '/auth/logout', 
  '/auth/forgot-password',
  '/auth/reset-password'
];

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    console.error(
      `❌ Response error: ${originalRequest?.url} - ${error.response?.status}`,
      error.response?.data
    );

    if (!originalRequest) {
      return Promise.reject(error);
    }
   
    const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && !isAuthEndpoint) {      
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount >= 2) {
        console.error("❌ Max retry attempts reached");
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        console.error("❌ Request already retried");
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log("⏳ Waiting for refresh token...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log("🔄 Retrying original request after refresh");
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      originalRequest._retryCount += 1;
      isRefreshing = true;

      console.log("🔄 Starting refresh token...");

      try {
        await Promise.race([
          api.post("/auth/refresh-token"),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Refresh timeout')), 5000)
          )
        ]);

        console.log("✅ Refresh token successful");
        isRefreshing = false;
        processQueue(null);

        return api(originalRequest);
        
      } catch (refreshError) {
        console.error("❌ Refresh token failed:", refreshError);
        
        isRefreshing = false;
        processQueue(refreshError as AxiosError);

        localStorage.clear();
        
        const authPaths = ['/login', '/forgot-password', '/reset-password'];
        if (!authPaths.some(path => window.location.pathname.includes(path))) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.error("❌ Forbidden - Không có quyền truy cập");
    } else if (error.response?.status === 404) {
      console.error("❌ Not found - API endpoint không tồn tại");
    } else if (error.response?.status === 500) {
      console.error("❌ Server error");
    }

    return Promise.reject(error);
  }
);

// ==========================================
// useAuth Hook
// ==========================================

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const checkAuthRef = useRef(false);

  // ✅ FIX: Wrap checkAuth trong useCallback với navigate dependency
  const checkAuth = useCallback(async () => {
    console.log("🔍 Checking authentication status...");
    
    const authPaths = ['/login', '/forgot-password', '/reset-password'];
    if (authPaths.some(path => window.location.pathname.includes(path))) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get<User>("/auth/me");
      
      if (response.data) {
        console.log("✅ User authenticated:", response.data);
        setUser(response.data);       
        
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("username", response.data.username);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("❌ Authentication check failed:", axiosError.message);
      
      setUser(null);
      localStorage.clear();
     
      if (axiosError.response?.status === 401) {
        if (!authPaths.some(path => window.location.pathname.includes(path))) {
          navigate('/login', { replace: true });
        }
      }
    } finally {
      setLoading(false);
      console.log("✅ Auth check completed");
    }
  }, [navigate]); // 

  //  useEffect với checkAuth trong dependencies
  useEffect(() => {
    if (checkAuthRef.current) return;
    checkAuthRef.current = true;

    const initAuth = async () => {
      const authPaths = ['/login', '/forgot-password', '/reset-password'];
      if (authPaths.some(path => window.location.pathname.includes(path))) {
        setLoading(false);
        return;
      }

      await checkAuth();
    };
    
    initAuth();
  }, [checkAuth]); // ✅ Include checkAuth

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log("🔐 Attempting login...");
    
    try {
      localStorage.clear();
      
      const response = await api.post<LoginResponse>("/auth/login", credentials);
      
      if (!response.data) {
        throw new Error("Invalid response from server");
      }
      console.log("✅ Login successful:", response.data);   
        
      const userData: User = {
        username: response.data.username,
        role: response.data.role,     
      };
      
      // ✅ Set user state TRƯỚC khi set localStorage
      setUser(userData);
      localStorage.setItem("role", userData.role);
      localStorage.setItem("username", userData.username);

      return {
        user: userData,
        message: response.data.message || "Đăng nhập thành công"
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: LoginResponse }>;
      console.error("❌ Login failed:", axiosError);      
   
      let errorMessage = "Đăng nhập thất bại";
      
      if (axiosError.response?.status === 400) {
        errorMessage = "Thông tin đăng nhập không hợp lệ";
      } else if (axiosError.response?.status === 401) {
        errorMessage = "Tên đăng nhập hoặc mật khẩu không đúng";
      } else if (axiosError.response?.status === 429) {
        errorMessage = "Quá nhiều lần thử. Vui lòng thử lại sau";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (!axiosError.response) {
        errorMessage = "Không thể kết nối đến máy chủ";
      }
      
      throw new Error(errorMessage);
    }
  }, []); // ✅ No dependencies needed

  // Logout function
  const logout = useCallback(async () => {
    console.log("👋 Logging out...");
    
    try {
      await api.post("/auth/logout");
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("⚠️ Logout error (continuing anyway):", error);
    } finally {    
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);   
      isRefreshing = false;
      processQueue(null);      
    
      navigate("/login", { replace: true });
    }
  }, [navigate]); 
  return { 
    user,
    loading,
    login,
    logout,
    checkAuth,
    api
  };
}

export { api };
export type { User, LoginCredentials, LoginResponse, AuthContextValue };