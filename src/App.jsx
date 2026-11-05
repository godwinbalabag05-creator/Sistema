import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Diagnosis from "./pages/Diagnosis";
import Vehicles from "./pages/Vehicles";
import Shops from "./pages/Shops";
import Bookings from "./pages/Bookings";
import Mailbox from "./pages/Mailbox";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import ScrollToTop from "./components/ScrollToTop";
import ToastCenter from "./components/ToastCenter";
import ConfirmHost from "./components/ConfirmHost";
import { AuthProvider } from "./lib/AuthContext";
import { NotificationProvider } from "./lib/NotificationContext";
import { VehicleProvider } from "./lib/VehicleContext";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <AuthProvider>
        <NotificationProvider>
          <VehicleProvider>
            <ToastCenter />
            <ConfirmHost />

            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/diagnosis"
                element={
                  <ProtectedRoute>
                    <Diagnosis />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shops"
                element={
                  <ProtectedRoute>
                    <Shops />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mailbox"
                element={
                  <ProtectedRoute>
                    <Mailbox />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/shops"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Login and register share one layout, so the ad keeps playing */}
              <Route
                element={
                  <GuestRoute>
                    <AuthLayout />
                  </GuestRoute>
                }
              >
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </VehicleProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;