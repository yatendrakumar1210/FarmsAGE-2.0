import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ShoppingBasket, ShoppingCart, Users, LogOut } from 'lucide-react';
import './admin.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span>FarmsAGE</span> ADMIN
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingBasket size={20} />
            Products
          </NavLink>
          <NavLink to="/admin/orders" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} />
            Orders
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            Users
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title">
            <h2>Welcome Back, {user?.name || 'Admin'}</h2>
          </div>

          <div className="topbar-user">
            <div className="user-info">
              <p className="user-role">Administrator</p>
            </div>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
