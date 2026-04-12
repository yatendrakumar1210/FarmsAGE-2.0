import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const adminUser = user || storedUser;

  console.log("AdminRoute - Current User:", adminUser);

  if (!adminUser || adminUser.role?.toLowerCase() !== 'admin') {
    console.warn("Access denied. Redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;


