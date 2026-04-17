import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Loading Screen Component
const PageLoader = () => (
  <div style={{ 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#f8fafc' 
  }}>
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

// Lazy Imports
const Home = lazy(() => import("../Pages/Home"));
const Cart = lazy(() => import("../Pages/Cart"));
const Contact = lazy(() => import("../Pages/Contact"));
const Login = lazy(() => import("../Pages/Login"));
const Fruits = lazy(() => import("../Pages/Fruits"));
const Vegetables = lazy(() => import("../Pages/Vegetables"));
const Organic = lazy(() => import("../Pages/Organic"));
const AllProducts = lazy(() => import("../Pages/AllProducts"));
const CompleteProfile = lazy(() => import("../Pages/CompleteProfile"));
const Checkout = lazy(() => import("../Pages/Checkout"));
const OrderSuccess = lazy(() => import("../Pages/OrderSuccess"));
const MyOrders = lazy(() => import("../Pages/MyOrders"));

// Admin Lazy Imports
const AdminLayout = lazy(() => import("../Pages/Admin/AdminLayout"));
const Dashboard = lazy(() => import("../Pages/Admin/Dashboard"));
const ManageProducts = lazy(() => import("../Pages/Admin/ManageProducts"));
const ManageOrders = lazy(() => import("../Pages/Admin/ManageOrders"));
const ManageUsers = lazy(() => import("../Pages/Admin/ManageUsers"));
const AdminRoute = lazy(() => import("./AdminRoute"));

// Vendor Lazy Imports
const VendorLayout = lazy(() => import("../Pages/Vendor/VendorLayout"));
const VendorDashboard = lazy(() => import("../Pages/Vendor/VendorDashboard"));
const VendorProducts = lazy(() => import("../Pages/Vendor/VendorProducts"));
const VendorOrders = lazy(() => import("../Pages/Vendor/VendorOrders"));
const VendorProfile = lazy(() => import("../Pages/Vendor/VendorProfile"));
const VendorRoute = lazy(() => import("./VendorRoute"));
const VendorStore = lazy(() => import("../Pages/VendorStore"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
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

        {/* Public Vendor Store Page */}
        <Route path="/vendor/:vendorId/store" element={<VendorStore />} />

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

        {/* Vendor Panel Routes */}
        <Route path="/vendor" element={
          <VendorRoute>
            <VendorLayout />
          </VendorRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
