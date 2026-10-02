import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VendorRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const vendorUser = user || storedUser;

  if (!token || token === "null" || token === "undefined" || !vendorUser || (vendorUser.role?.toLowerCase() !== 'vendor' && vendorUser.role?.toLowerCase() !== 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default VendorRoute;
