import React, { useEffect, useState, useCallback } from 'react';
import { customersApi, getApiErrorMessage, ordersApi, productsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, X, ShoppingCart, Trash2, ChevronDown } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-purple',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function OrderModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: 500 }),
      productsApi.list({ limit: 500 }),
    ]).then(([c, p]) => {
      setCustomers(c.data);
      setProducts(p.data);
    }).catch((e) => {
      toast.error(getApiErrorMessage(e, 'Unable to load order form data'), { id: 'order-form-load-error' });
    });
  }, []);

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx, field, val) =>
    setItems(i => i.map((it, j) => j === idx ? { ...it, [field]: val } : it));

  const getProduct = (id) => products.find(p => p.id === parseInt(id));

  const total = items.reduce((sum, it) => {
    const p = getProduct(it.product_id);
    return sum + (p ? p.price * (parseInt(it.quantity) || 0) : 0);
  }, 0);

  const handleSubmit = async () => {
    if (!customerId) return toast.error('Select a customer');
    const validItems = items.filter(i => i.product_id && parseInt(i.quantity) > 0);
    if (!validItems.length) return toast.error('Add at least one item');

    setLoading(true);
    try {
      await ordersApi.create({
        customer_id: parseInt(customerId),
        notes,
        items: validItems.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
        })),
      });
      toast.success('Order created successfully');
      onSave();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error creating order'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3 className="modal-title">Create New Order</h3>
          <button className="btn btn-ghost" onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>Customer *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>

            <div>
              <label style={{ marginBottom: 8, display: 'block', fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>
                Order Items *
              </label>
              <div className="order-items-list">
                {items.map((item, idx) => {
                  const prod = getProduct(item.product_id);
                  return (
                    <div key={idx} className="order-item-add">
                      <div className="field" style={{ flex: 2 }}>
                        <label>Product</label>
                        <select value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                              {p.name} — ₹{p.price} (Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ flex: 0.6 }}>
                        <label>Qty</label>
                        <input
                          type="number" min="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          max={prod?.stock_quantity || 9999}
                        />
                      </div>
                      <div style={{ flex: 0.8, paddingBottom: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <label>Subtotal</label>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', padding: '9px 4px' }}>
                          {prod ? `₹${(prod.price * (parseInt(item.quantity) || 0)).toFixed(2)}` : '—'}
                        </span>
                      </div>
                      {items.length > 1 && (
                        <button className="btn btn-danger" onClick={() => removeItem(idx)} style={{ padding: '6px', alignSelf: 'flex-end', marginBottom: 2 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button className="btn btn-secondary" onClick={addItem} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={13} /> Add Item
                </button>
              </div>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional order notes..." />
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Total Amount</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner" style={{width:14,height:14}} /> Processing...</> : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await ordersApi.list({ status: statusFilter || undefined });
      setOrders(r.data);
    } catch (e) {
      setOrders([]);
      toast.error(getApiErrorMessage(e, 'Unable to load orders'), { id: 'orders-load-error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(`Order ${newStatus}`);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to update status'));
    }
  };

  return (
    <div>
      {showModal && (
        <OrderModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}

      <div className="filters-row">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus /> New Order
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart />
              <h3>No orders found</h3>
              <p style={{ fontSize: 12 }}>Create your first order</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr>
                      <td><span className="mono" style={{ color: 'var(--accent)' }}>#{o.id.toString().padStart(4, '0')}</span></td>
                      <td style={{ fontWeight: 500 }}>{o.customer?.name || `#${o.customer_id}`}</td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{o.items?.length || 0} item(s)</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)' }}>₹{Number(o.total_amount).toFixed(2)}</td>
                      <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(o.created_at).toLocaleDateString()}</span></td>
                      <td>
                        <select
                          value={o.status}
                          onChange={e => handleStatusChange(o.id, e.target.value)}
                          style={{ minWidth: 120, fontSize: 12 }}
                        >
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                          style={{ padding: '5px 8px' }}
                        >
                          <ChevronDown size={14} style={{ transform: expandedId === o.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </button>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr>
                        <td colSpan={8} style={{ background: 'var(--surface-2)', padding: '12px 16px' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>ORDER ITEMS</div>
                          <div className="order-items-list">
                            {o.items?.map(item => (
                              <div key={item.id} className="order-item-row">
                                <span>{item.product?.name || `Product #${item.product_id}`}</span>
                                <span className="mono" style={{ color: 'var(--text-3)' }}>× {item.quantity}</span>
                                <span className="mono" style={{ color: 'var(--text-2)' }}>@ ₹{Number(item.unit_price).toFixed(2)}</span>
                                <span className="mono" style={{ color: 'var(--accent)' }}>= ₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {o.notes && (
                            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-2)' }}>
                              <span style={{ color: 'var(--text-3)' }}>Notes: </span>{o.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
