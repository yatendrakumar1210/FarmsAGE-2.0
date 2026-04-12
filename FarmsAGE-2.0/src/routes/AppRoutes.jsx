import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../Pages/Home";
import Cart from "../Pages/Cart";
import Contact from "../Pages/Contact";
import Login from "../Pages/Login";
import Fruits from "../Pages/Fruits";
import Vegetables from "../Pages/Vegetables";

import Organic from "../Pages/Organic";
import AllProducts from "../Pages/AllProducts";
import CompleteProfile from "../Pages/CompleteProfile";
import Checkout from "../Pages/Checkout";
import OrderSuccess from "../Pages/OrderSuccess";
import MyOrders from "../Pages/MyOrders";

// Admin Imports
import AdminLayout from "../Pages/Admin/AdminLayout";
import Dashboard from "../Pages/Admin/Dashboard";
import ManageProducts from "../Pages/Admin/ManageProducts";
import ManageOrders from "../Pages/Admin/ManageOrders";
import ManageUsers from "../Pages/Admin/ManageUsers";
import AdminRoute from "./AdminRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/category/fruits" element={<Fruits />} />
      <Route path="/category/vegetables" element={<Vegetables />} />
  
      <Route path="/category/organic" element={<Organic />} />
      <Route path="/category/all" element={<AllProducts />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/my-orders" element={<MyOrders />} />

      {/* Admin Panel Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;


