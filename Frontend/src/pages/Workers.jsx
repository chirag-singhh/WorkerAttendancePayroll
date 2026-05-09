import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Users, X, Search, ToggleLeft, ToggleRight, Phone } from 'lucide-react';

const DEPARTMENTS = ['Mistry', 'Carpenter', 'Assistant', 'Painter', 'Extra', 'Tiles', 'Rustom', 'Molder', 'Custom'];

function WorkerModal({ worker, locations, onClose, onSave }) {
  const [form, setForm] = useState({
    name: worker?.name || '',
    department: worker?.department || 'Mistry',
    customDepartment: worker?.customDepartment || '',
    memberId: worker?.memberId || '',
    rate: worker?.rate || '',
    phone: worker?.phone || '',
    locationId: worker?.locationId?._id || worker?.locationId || (locations[0]?._id || ''),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.memberId || !form.rate || !form.locationId) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      if (worker) {
        await api.put(`/worker/${worker._id}`, form);
        toast.success('Worker updated!');
      } else {
        await api.post('/worker', form);
        toast.success('Worker created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{worker ? 'Edit Worker' : 'Add Worker'}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Worker name" />
              </div>
              <div className="form-group">
                <label className="form-label">Member ID *</label>
                <input className="form-input" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} placeholder="e.g. W001" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-select" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {form.department === 'Custom' && (
                <div className="form-group">
                  <label className="form-label">Custom Department</label>
                  <input className="form-input" value={form.customDepartment} onChange={e => setForm({ ...form, customDepartment: e.target.value })} placeholder="Department name" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Daily Rate (₹) *</label>
                <input className="form-input" type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="500" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">Location *</label>
                <select className="form-select" value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })}>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : worker ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const deptColors = {
  Mistry: 'purple', Carpenter: 'blue', Assistant: 'green',
  Painter: 'yellow', Extra: 'red', Tiles: 'blue',
  Rustom: 'purple', Molder: 'yellow', Custom: 'green',
};

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterActive, setFilterActive] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [wRes, lRes] = await Promise.all([api.get('/worker'), api.get('/location')]);
      setWorkers(wRes.data.workers || []);
      setLocations(lRes.data.locations || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this worker?')) return;
    try {
      await api.delete(`/worker/${id}`);
      toast.success('Worker deleted');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/worker/toggle-status/${id}`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) { toast.error('Error updating status'); }
  };

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.memberId.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || w.department === filterDept;
    const matchActive = filterActive === '' ? true : w.active === (filterActive === 'true');
    return matchSearch && matchDept && matchActive;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">Manage your workforce across all locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Add Worker
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrapper" style={{ flex: 2 }}>
            <Search size={15} />
            <input className="form-input" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: '160px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Depts</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: '140px' }} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3>No workers found</h3>
            <p>Add workers to start tracking attendance.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Dept</th>
                  <th>Member ID</th>
                  <th>Rate/Day</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                          {w.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{w.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(w.joiningDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${deptColors[w.department] || 'purple'}`}>
                        {w.department === 'Custom' ? w.customDepartment || 'Custom' : w.department}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-light)' }}>{w.memberId}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{w.rate.toLocaleString()}</td>
                    <td>
                      {w.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={12} color="var(--text-muted)" />
                          {w.phone}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>{w.locationId?.name || '—'}</td>
                    <td>
                      <span className={`badge badge-${w.active ? 'green' : 'red'}`}>
                        {w.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-icon"
                          style={{ background: w.active ? 'var(--red-bg)' : 'var(--green-bg)', color: w.active ? 'var(--red)' : 'var(--green)', border: '1px solid', borderColor: w.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }}
                          onClick={() => handleToggle(w._id)}
                          title={w.active ? 'Deactivate' : 'Activate'}
                        >
                          {w.active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                        </button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setModal(w)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(w._id)}>
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
        <WorkerModal
          worker={modal === 'create' ? null : modal}
          locations={locations}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
