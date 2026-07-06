import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Coupons from './pages/Coupons';
import Customers from './pages/Customers';
import Subscribers from './pages/Subscribers';

// Guard for protected admin paths
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout container
const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login */}
          <Route path="/login" element={<Login />} />

          {/* Protected dashboard endpoints */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Orders />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Products />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupons"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Coupons />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscribers"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Subscribers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
