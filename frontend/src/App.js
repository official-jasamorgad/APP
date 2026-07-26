import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "@/App.css";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetail from "@/pages/ProductDetail";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetail from "@/pages/ServiceDetail";
import StoresPage from "@/pages/StoresPage";
import StoreDetail from "@/pages/StoreDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderDetail from "@/pages/OrderDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import SearchPage from "@/pages/SearchPage";
import CustomerDashboard from "@/pages/dashboard/CustomerDashboard";
import StoreDashboard from "@/pages/dashboard/StoreDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthCallback from "@/components/AuthCallback";
import DigitalHub from "@/pages/DigitalHub";
import DigitalCheckout from "@/pages/DigitalCheckout";
import DigitalOrderDetail from "@/pages/DigitalOrderDetail";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";
import { CartProvider } from "@/context/CartContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// Synchronously catch Emergent OAuth session_id in URL fragment before any Route renders
function OAuthGate({ children }) {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return children;
}

function App() {
  return (
    <div className="App" data-testid="app-root">
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <OAuthGate>
                  <Routes>
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/services/:id" element={<ServiceDetail />} />
                      <Route path="/stores" element={<StoresPage />} />
                      <Route path="/stores/:id" element={<StoreDetail />} />
                      <Route path="/digital" element={<DigitalHub />} />
                      <Route path="/digital/:id" element={<ProtectedRoute><DigitalCheckout /></ProtectedRoute>} />
                      <Route path="/digital/orders/:id" element={<ProtectedRoute><DigitalOrderDetail /></ProtectedRoute>} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route
                        path="/dashboard/customer"
                        element={<ProtectedRoute roles={["customer", "store_owner", "admin"]}><CustomerDashboard /></ProtectedRoute>}
                      />
                      <Route
                        path="/dashboard/store"
                        element={<ProtectedRoute roles={["store_owner", "admin"]}><StoreDashboard /></ProtectedRoute>}
                      />
                      <Route
                        path="/dashboard/admin"
                        element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>}
                      />
                    </Route>
                  </Routes>
                </OAuthGate>
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
