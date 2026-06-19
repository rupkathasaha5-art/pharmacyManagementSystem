// components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isLoggedIn, userData } = useContext(AppContext);

  // 1. If the user is completely unauthenticated, redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 2. If role restrictions are passed, verify the user has authorization
  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    // If authenticated but unauthorized role, boot them back to a safe public area (like home)
    return <Navigate to="/" replace />;
  }

  // Render the child layout elements safely
  return <Outlet />;
};

export default ProtectedRoute;