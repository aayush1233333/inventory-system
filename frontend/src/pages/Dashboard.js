import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../lib/api';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Package,
  PackagePlus,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

const STATS_CONFIG = [
  {
    key: 'total_revenue',
    label: 'Total Revenue',
    icon: TrendingUp,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    format: (v) => `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
  },
  {
    key: 'total_orders',
    label: 'Total Orders',
    icon: ShoppingCart,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
    format: (v) => v,
  },
  {
    key: 'pending_orders',
    label: 'Pending Orders',
    icon: Clock,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    format: (v) => v,
  },
  {
    key: 'total_products',
    label: 'Products',
    icon: Package,
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.1)',
    format: (v) => v,
  },
  {
    key: 'total_customers',
    label: 'Customers',
    icon: Users,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
    format: (v) => v,
  },
  {
    key: 'low_stock_products',
    label: 'Low Stock Alerts',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    format: (v) => v,
  },
];

const QUICK_ACTIONS = [
  {
    href: '/products',
    label: 'Add a new product',
    icon: PackagePlus,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
  },
  {
    href: '/customers',
    label: 'Register a customer',
    icon: UserPlus,
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.1)',
  },
  {
    href: '/orders',
    label: 'Create an order',
    icon: ShoppingCart,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    href: '/inventory',
    label: 'View stock alerts',
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <h2>System Overview</h2>
        <p>Real-time metrics across your inventory and orders</p>
      </div>

      <div className="stats-grid">
        {STATS_CONFIG.map(({ key, label, icon: Icon, color, bg, format }) => (
          <div
            key={key}
            className="stat-card"
            style={{ '--accent-color': color, '--icon-bg': bg }}
          >
            <div className="stat-icon">
              <Icon />
            </div>
            <div className={`stat-value ${key === 'total_revenue' ? 'stat-value-revenue' : ''}`}>
              {stats ? format(stats[key]) : '—'}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, bg }) => (
            <Link
              key={href}
              to={href}
              className="quick-action"
              style={{ '--quick-color': color, '--quick-bg': bg }}
            >
              <span className="quick-action-icon"><Icon /></span>
              <span>{label}</span>
              <ArrowRight className="quick-action-arrow" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
