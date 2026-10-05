import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * CustomerRoute
 * Strictly isolates customer storefront routes from delivery partner accounts.
 * If the authenticated user has role === "delivery", they are redirected immediately
 * to the appropriate delivery route (/delivery/dashboard if approved, /delivery/profile otherwise).
 */
const CustomerRoute = ({ children }) => {
  const { user } = useAuth();
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const activeUser = user || storedUser;

  if (activeUser && activeUser.role?.toLowerCase() === "delivery") {
    const deliveryStatus = activeUser.deliveryStatus?.toLowerCase();
    const destination =
      deliveryStatus === "approved"
        ? "/delivery/dashboard"
        : "/delivery/profile";
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default CustomerRoute;
