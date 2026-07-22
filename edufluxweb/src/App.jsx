import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DocumentViewer from './pages/DocumentViewer'
import DocumentViewerComparison from './pages/DocumentViewerComparison'
import Subscription from './pages/Subscription'
import PricingUnlock from './pages/PricingUnlock'
import PaymentCallback from './pages/PaymentCallback'
import { ToastProvider } from './context/ToastContext'

// Admin Components
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminUserManagement from './admin/AdminUserManagement'
import AdminDocumentManagement from './admin/AdminDocumentManagement'
import AdminLogin from './admin/AdminLogin'
import AdminProtectedRoute from './admin/AdminProtectedRoute'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-upload" element={<Dashboard />} />
          <Route path="/browse-panel" element={<Dashboard />} />
          <Route path="/pricing" element={<PricingUnlock />} />
          <Route path="/unlock" element={<PricingUnlock />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/subscription/khalti/callback" element={<PaymentCallback provider="khalti" />} />
          <Route path="/subscription/esewa/callback" element={<PaymentCallback provider="esewa" />} />
          <Route path="/subscription/failed" element={<PaymentCallback isFailure={true} />} />
          <Route path="/documents/:id/view" element={<DocumentViewer />} />
          <Route path="/documents/preview-comparison" element={<DocumentViewerComparison />} />

          
          {/* Admin Portal Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="documents" element={<AdminDocumentManagement />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

