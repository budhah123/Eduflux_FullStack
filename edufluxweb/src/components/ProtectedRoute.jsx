import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../utils/auth';

export default function ProtectedRoute() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
