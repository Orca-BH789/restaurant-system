import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import POSLayout from "../components/layouts/POSLayout";
import PaymentPageRoute from "../pages/pos/PaymentPageRoute";

export const posRoutes = (
  <>
    <Route
      path="/pos/*"
      element={
        <ProtectedRoute role="staff">
          <POSLayout />
        </ProtectedRoute>
      }
    />
    <Route
      path="/pos/payment/:invoiceId"
      element={
        <ProtectedRoute role="staff">
          <PaymentPageRoute />
        </ProtectedRoute>
      }
    />
  </>
);