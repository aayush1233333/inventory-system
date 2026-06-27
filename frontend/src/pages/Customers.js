import React, { useEffect, useState, useCallback } from 'react';
import { customersApi, getApiErrorMessage } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Users, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(customer || EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const cleanText = (value) => (value ?? '').toString().trim();
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: cleanText(form.name),
        email: cleanText(form.email).toLowerCase(),
        phone: cleanText(form.phone) || null,
        address: cleanText(form.address) || null,
      };
      if (customer) {
        await customersApi.update(customer.id, payload);
        toast.success('Customer updated');
      } else {
        await customersApi.create(payload);
        toast.success('Customer registered');
      }
      onSave();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Error saving customer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{customer ? 'Edit Customer' : 'New Customer'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Priya Sharma" />
            </div>
            <div className="field">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="priya@example.com" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="+91 98765 43210" />
            </div>
            <div className="field full">
              <label>Address</label>
              <textarea name="address" value={form.address || ''} onChange={handleChange} placeholder="Street, City, State..." />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.name || !form.email}>
            {loading ? <><div className="spinner" style={{width:14,height:14}} /> Saving...</> : (customer ? 'Update' : 'Register Customer')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customersApi.list({ search: search || undefined });
      setCustomers(r.data);
    } catch (e) {
      setCustomers([]);
      toast.error(getApiErrorMessage(e, 'Unable to load customers'), { id: 'customers-load-error' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await customersApi.delete(id);
      toast.success('Customer deleted');
      load();
    } catch {
      toast.error('Cannot delete — customer has orders');
    }
  };

  return (
    <div>
      {modal && (
        <CustomerModal
          customer={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      <div className="filters-row">
        <div className="search-wrap">
          <Search />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus /> New Customer
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <Users />
              <h3>No customers found</h3>
              <p style={{ fontSize: 12 }}>{search ? 'Try a different search' : 'Register your first customer'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td><span className="mono" style={{ color: 'var(--text-3)' }}>#{c.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Mail size={12} style={{ color: 'var(--text-3)' }} />
                        <span style={{ fontSize: 12 }}>{c.email}</span>
                      </span>
                    </td>
                    <td>
                      {c.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={12} style={{ color: 'var(--text-3)' }} />
                          <span style={{ fontSize: 12 }}>{c.phone}</span>
                        </span>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td>
                      {c.address ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} style={{ color: 'var(--text-3)' }} />
                          <span style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{c.address}</span>
                        </span>
                      ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleDateString()}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" onClick={() => setModal(c)} style={{ padding: '5px 8px' }}><Edit2 /></button>
                        {isAdmin && (
                          <button className="btn btn-danger" onClick={() => handleDelete(c.id, c.name)} style={{ padding: '5px 8px' }}><Trash2 /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
