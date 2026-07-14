import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminProtectedRoute() {
  const adminToken = sessionStorage.getItem('adminToken');

  if (!adminToken) {
    // If not logged in as admin, redirect to admin login page
    return <Navigate to="/admin/login" replace />;
  }

  // If logged in, render child routes (like AdminLayout/Outlet)
  return <Outlet />;
}
