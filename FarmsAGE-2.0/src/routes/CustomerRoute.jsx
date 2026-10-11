import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * CustomerRoute
 * Strictly isolates customer routes.
 * 1. Delivery partners are redirected away from customer storefront routes.
 * 2. Vendor accounts are blocked from customer-only transactional/account routes (cart, checkout, my-orders, etc.)
 *    and redirected to the appropriate vendor area, while preserving public product browsing.
 */
const CustomerRoute = ({ children, customerOnly = false }) => {
  const { user } = useAuth();
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const activeUser = user || storedUser;

  if (activeUser) {
    const role = activeUser.role?.toLowerCase();

    // Preserve existing delivery partner isolation
    if (role === "delivery") {
      const deliveryStatus = activeUser.deliveryStatus?.toLowerCase();
      const destination =
        deliveryStatus === "approved"
          ? "/delivery/dashboard"
          : "/delivery/profile";
      return <Navigate to={destination} replace />;
    }

    // Isolate vendors from customer-only routes (cart, checkout, orders, profile)
    if (role === "vendor" && customerOnly) {
      const shopStatus = activeUser.shopStatus?.toLowerCase();
      const destination =
        shopStatus === "approved"
          ? "/vendor/dashboard"
          : "/vendor/profile";
      return <Navigate to={destination} replace />;
    }
  }

  return children;
};

export default CustomerRoute;
