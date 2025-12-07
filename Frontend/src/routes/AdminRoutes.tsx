import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../components/layouts/AdminLayout";

export const adminRoutes = (
  <>
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute role="Admin">
          <AdminLayout />
        </ProtectedRoute>
      }
    />
  </>
);