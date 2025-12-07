import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import { adminRoutes } from "./routes/AdminRoutes";
import { customerRoutes } from "./routes/CustomerRoutes";
import { chefRoutes } from "./routes/ChefRoutes";
import { posRoutes } from "./routes/POSRoutes";
import TableQRPrint from "./pages/admin/TableQRPrint";
import ForgotPassword from "./pages/auth/ForgotPassword"; 
import ResetPassword from "./pages/auth/ResetPassword";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/print/table/:id" element={<TableQRPrint />} />

      {/* Customer routes */}
      {customerRoutes}

      {/* Chef routes */}
      {chefRoutes}

      {/* Admin routes */}
      {adminRoutes}

      {/* POS routes */}
      {posRoutes}

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;