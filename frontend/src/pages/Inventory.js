import React, { useEffect, useState } from 'react';
import { getApiErrorMessage, productsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, Edit2 } from 'lucide-react';

export default function Inventory() {
  const [allProducts, setAllProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await productsApi.list({ limit: 500 });
      const all = r.data;
      setAllProducts(all);
      setLowStock(all.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold));
      setOutOfStock(all.filter(p => p.stock_quantity === 0));
    } catch (e) {
      setAllProducts([]);
      setLowStock([]);
      setOutOfStock([]);
      toast.error(getApiErrorMessage(e, 'Unable to load inventory'), { id: 'inventory-load-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestockSave = async (product) => {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) return toast.error('Invalid quantity');
    try {
      await productsApi.update(product.id, { stock_quantity: qty });
      toast.success(`Stock updated to ${qty}`);
      setEditingId(null);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Failed to update stock'));
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const totalValue = allProducts.reduce((s, p) => s + p.price * p.stock_quantity, 0);

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: allProducts.length, color: 'var(--accent)' },
          { label: 'Out of Stock', value: outOfStock.length, color: 'var(--red)' },
          { label: 'Low Stock', value: lowStock.length, color: 'var(--yellow)' },
          { label: 'Inventory Value', value: `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, color: 'var(--green)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ borderColor: `${color}33` }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Out of Stock ({outOfStock.length})
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Restock</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="mono" style={{ color: 'var(--accent)' }}>{p.sku}</span></td>
                    <td>{p.category || '—'}</td>
                    <td className="mono">₹{p.price.toFixed(2)}</td>
                    <td>
                      {editingId === p.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number" min="0" value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            style={{ width: 80 }}
                            autoFocus
                          />
                          <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleRestockSave(p)}>Save</button>
                          <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditingId(p.id); setEditQty(''); }}>
                          <Edit2 size={12} /> Set Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--yellow)' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Low Stock ({lowStock.length})
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Restock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => {
                  const pct = Math.round((p.stock_quantity / p.low_stock_threshold) * 100);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="mono" style={{ color: 'var(--accent)' }}>{p.sku}</span></td>
                      <td>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar">
                            <div className="stock-bar-fill" style={{ width: `${pct}%`, background: 'var(--yellow)' }} />
                          </div>
                          <span className="mono">{p.stock_quantity}</span>
                        </div>
                      </td>
                      <td><span className="mono" style={{ color: 'var(--text-3)' }}>{p.low_stock_threshold}</span></td>
                      <td>
                        {editingId === p.id ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="number" min="0" value={editQty} onChange={e => setEditQty(e.target.value)} style={{ width: 80 }} autoFocus />
                            <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleRestockSave(p)}>Save</button>
                            <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { setEditingId(p.id); setEditQty(p.stock_quantity.toString()); }}>
                            <Edit2 size={12} /> Restock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {outOfStock.length === 0 && lowStock.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Package />
            <h3>All stock levels are healthy</h3>
            <p style={{ fontSize: 12 }}>No products are below their threshold</p>
          </div>
        </div>
      )}
    </div>
  );
}
