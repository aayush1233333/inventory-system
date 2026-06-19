import React, { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  AlertTriangle,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

import './index.css';
import Dashboard from './pages/Dashboard';

const Customers = lazy(() => import('./pages/Customers'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Orders = lazy(() => import('./pages/Orders'));
const Products = lazy(() => import('./pages/Products'));

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/inventory', icon: AlertTriangle, label: 'Inventory' },
];

function Sidebar({ open, onClose }) {
  const location = useLocation();

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header-row">
        <div className="sidebar-logo" style={{ flex: 1, borderBottom: 'none', padding: '24px 20px' }}>
          <h1>
            Stock<span>Flow</span>
          </h1>
        </div>
        <button className="btn btn-ghost sidebar-close-btn" onClick={onClose}><X /></button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon /> {label}
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}

function PageTitle() {
  const location = useLocation();
  const titles = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/customers': 'Customers',
    '/orders': 'Orders',
    '/inventory': 'Inventory Alerts',
  };

  const path = Object.keys(titles).find(
    (key) => key === location.pathname || (key !== '/' && location.pathname.startsWith(key))
  );

  return <span className="topbar-title">{titles[path] || 'StockFlow'}</span>;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost hamburger-btn" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <PageTitle />
          </div>
        </header>
        <main className="page-body">
          <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-2)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
          },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
