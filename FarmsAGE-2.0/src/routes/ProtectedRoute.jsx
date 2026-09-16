import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const activeUser = user || storedUser;

  if (!token || !activeUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
