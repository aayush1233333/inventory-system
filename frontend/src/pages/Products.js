import React, { useEffect, useState, useCallback } from 'react';
import { getApiErrorMessage, productsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';

const EMPTY_FORM = {
  name: '', sku: '', description: '', price: '', stock_quantity: '',
  low_stock_threshold: '10', category: ''
};

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const cleanText = (value) => (value ?? '').toString().trim();
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    const price = parseFloat(form.price);
    const stockQuantity = parseInt(form.stock_quantity, 10);
    const lowStockThreshold = form.low_stock_threshold === ''
      ? 10
      : parseInt(form.low_stock_threshold, 10);

    if (!Number.isFinite(price) || price <= 0) return toast.error('Enter a valid product price');
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) return toast.error('Enter a valid stock quantity');
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) return toast.error('Enter a valid low stock threshold');

    setLoading(true);
    try {
      const payload = {
        name: cleanText(form.name),
        sku: cleanText(form.sku),
        description: cleanText(form.description) || null,
        price,
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
        category: cleanText(form.category) || null,
      };
      if (product) {
        await productsApi.replace(product.id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      onSave();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error saving product'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{product ? 'Edit Product' : 'New Product'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" />
            </div>
            <div className="field">
              <label>SKU *</label>
              <input name="sku" value={form.sku} onChange={handleChange} placeholder="e.g. WH-001" />
            </div>
            <div className="field">
              <label>Price (₹) *</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0.00" step="0.01" />
            </div>
            <div className="field">
              <label>Stock Qty *</label>
              <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} placeholder="0" />
            </div>
            <div className="field">
              <label>Low Stock Threshold</label>
              <input type="number" name="low_stock_threshold" value={form.low_stock_threshold} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Category</label>
              <input name="category" value={form.category || ''} onChange={handleChange} placeholder="e.g. Electronics" />
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea name="description" value={form.description || ''} onChange={handleChange} placeholder="Optional description..." />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.sku || !form.price || form.stock_quantity === ''}
          >
            {loading ? <><div className="spinner" style={{width:14,height:14}} /> Saving...</> : (product ? 'Update' : 'Create Product')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | product

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productsApi.list({ search: search || undefined });
      setProducts(r.data);
    } catch (e) {
      setProducts([]);
      toast.error(getApiErrorMessage(e, 'Unable to load products'), { id: 'products-load-error' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Cannot delete — may have associated orders');
    }
  };

  const getStockStatus = (qty, threshold) => {
    if (qty === 0) return { label: 'OUT', class: 'badge-red' };
    if (qty <= threshold) return { label: 'LOW', class: 'badge-yellow' };
    return { label: 'OK', class: 'badge-green' };
  };

  return (
    <div>
      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      <div className="filters-row">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus /> New Product
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Package />
              <h3>No products found</h3>
              <p style={{ fontSize: 12 }}>{search ? 'Try a different search' : 'Add your first product to get started'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const status = getStockStatus(p.stock_quantity, p.low_stock_threshold);
                  const pct = Math.min(100, (p.stock_quantity / Math.max(p.low_stock_threshold * 3, 1)) * 100);
                  const barColor = status.class === 'badge-red' ? 'var(--red)' : status.class === 'badge-yellow' ? 'var(--yellow)' : 'var(--green)';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="mono" style={{ color: 'var(--accent)' }}>{p.sku}</span></td>
                      <td>{p.category || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{Number(p.price).toFixed(2)}</td>
                      <td>
                        <div className="stock-bar-wrap">
                          <div className="stock-bar">
                            <div className="stock-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="mono">{p.stock_quantity}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" onClick={() => setModal(p)} style={{ padding: '5px 8px' }}><Edit2 /></button>
                          <button className="btn btn-danger" onClick={() => handleDelete(p.id, p.name)} style={{ padding: '5px 8px' }}><Trash2 /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
