import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DeliveryRoute = ({ children }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const deliveryUser = user || storedUser;

  if (
    !token ||
    token === "null" ||
    token === "undefined" ||
    !deliveryUser ||
    (deliveryUser.role?.toLowerCase() !== "delivery" &&
      deliveryUser.role?.toLowerCase() !== "admin")
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default DeliveryRoute;
