import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, MapPin, X, Search } from 'lucide-react';

function LocationModal({ loc, onClose, onSave }) {
  const [form, setForm] = useState({ name: loc?.name || '', address: loc?.address || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) { toast.error('All fields required'); return; }
    setLoading(true);
    try {
      if (loc) {
        await api.put(`/location/${loc._id}`, form);
        toast.success('Location updated!');
      } else {
        await api.post('/location', form);
        toast.success('Location created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{loc ? 'Edit Location' : 'Add Location'}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Location Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Site A" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : loc ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | Location
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/location');
      setLocations(res.data.locations || []);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this location?')) return;
    try {
      await api.delete(`/location/${id}`);
      toast.success('Location deleted');
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting');
    }
  };

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage your construction sites and work locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Location
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrapper">
            <Search size={15} />
            <input
              className="form-input"
              placeholder="Search locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MapPin size={28} /></div>
            <h3>No locations found</h3>
            <p>Add your first work location to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loc, i) => (
                  <tr key={loc._id}>
                    <td>{i + 1}</td>
                    <td className="text-primary">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                        {loc.name}
                      </div>
                    </td>
                    <td>{loc.address}</td>
                    <td>{new Date(loc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setModal(loc)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(loc._id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <LocationModal
          loc={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchLocations(); }}
        />
      )}
    </div>
  );
}
