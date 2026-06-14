/**
 * App.jsx — Router setup with protected and public routes
 *
 * Route structure:
 * - /login          → LoginPage (public, redirects to dashboard if authenticated)
 * - /register       → RegisterPage (public, redirects to dashboard if authenticated)
 * - /dashboard      → DashboardPage (protected)
 * - /groups/new     → CreateGroupPage (protected) — Phase 3
 * - /groups/:id     → GroupDetailPage (protected) — Phase 3
 * - /groups/:id/expenses/new → AddExpensePage (protected) — Phase 4
 * - /expenses/:id   → ExpenseDetailPage (protected) — Phase 4
 * - /*              → Redirect to /login
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

import CreateGroupPage from './pages/CreateGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AddExpensePage from './pages/AddExpensePage';
import ImportPage from './pages/ImportPage';

import ExpenseDetailPage from './pages/ExpenseDetailPage';

// Redirect authenticated users away from auth pages
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/groups/new" element={<ProtectedRoute><CreateGroupPage /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
      <Route path="/groups/:groupId/expenses/new" element={<ProtectedRoute><AddExpensePage /></ProtectedRoute>} />
      <Route path="/expenses/:expenseId" element={<ProtectedRoute><ExpenseDetailPage /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
