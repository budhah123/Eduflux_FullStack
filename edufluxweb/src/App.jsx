import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DocumentViewer from './pages/DocumentViewer'
import { ToastProvider } from './context/ToastContext'

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
          <Route path="/documents/:id/view" element={<DocumentViewer />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
